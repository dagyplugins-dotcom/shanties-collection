import Link from 'next/link';

export const metadata = { title: 'Checkout', robots: { index: false } };

// Replaced in Step 2 with delivery details, delivery fees and M-Pesa payment.
export default function Checkout() {
  return (
    <div className="container page">
      <div className="empty">
        <h2>Checkout is coming next</h2>
        <p>Your cart is saved. Delivery and M-Pesa payment are built in Step 2.</p>
        <Link href="/cart" className="btn btn-primary">Back to cart</Link>
      </div>
    </div>
  );
}
