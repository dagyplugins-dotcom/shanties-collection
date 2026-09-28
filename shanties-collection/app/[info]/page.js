import { notFound } from 'next/navigation';
import { INFO_PAGES } from '@/lib/pages';
import { getSettings } from '@/lib/data';

export const revalidate = 60;
export const dynamicParams = false;

export const generateStaticParams = () => Object.keys(INFO_PAGES).map((info) => ({ info }));

export async function generateMetadata({ params }) {
  const p = INFO_PAGES[params.info];
  return p ? { title: p.title } : {};
}

export default async function InfoPage({ params }) {
  const base = INFO_PAGES[params.info];
  if (!base) notFound();
  const settings = await getSettings();
  const override = settings.pages?.[params.info];
  const title = override?.title || base.title;
  const body = override?.body ? String(override.body).split(/\n{2,}/) : base.body;
  const c = settings.contact || {};
  const wa = String(c.whatsapp || '').replace(/\D/g, '');
  const hasContact = c.phone || wa || c.email || c.address || c.hours;
  const showContact = ['contact-us', 'help-support', 'delivery-information', 'returns-refunds'].includes(params.info);

  return (
    <div className="container page narrow">
      <h1>{title}</h1>
      <div className="prose">{body.map((t, i) => <p key={i}>{t}</p>)}</div>
      {showContact && (
        <section className="auth-card" aria-labelledby="contact-h">
          <h2 id="contact-h">Get in touch</h2>
          {hasContact ? (
            <dl className="contact">
              {c.phone && <div><dt>Phone</dt><dd><a href={`tel:${c.phone}`}>{c.phone}</a></dd></div>}
              {wa && <div><dt>WhatsApp</dt><dd><a href={`https://wa.me/${wa}`} target="_blank" rel="noopener noreferrer">Chat on WhatsApp</a></dd></div>}
              {c.email && <div><dt>Email</dt><dd><a href={`mailto:${c.email}`}>{c.email}</a></dd></div>}
              {c.address && <div><dt>Location</dt><dd>{c.address}</dd></div>}
              {c.hours && <div><dt>Business hours</dt><dd>{c.hours}</dd></div>}
            </dl>
          ) : (
            <p className="muted">Contact details will appear here once the store adds them.</p>
          )}
        </section>
      )}
    </div>
  );
}
