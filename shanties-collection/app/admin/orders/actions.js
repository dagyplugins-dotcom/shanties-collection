'use server';

import { redirect } from 'next/navigation';
import { revalidateTag, revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';

const str = (fd, k) => String(fd.get(k) ?? '').trim();

const ALLOWED_PAYMENT = [
  'pending_payment',
  'payment_processing',
  'paid',
  'payment_failed',
  'payment_cancelled',
  'payment_refunded',
];

const ALLOWED_ORDER = [
  'order_placed',
  'payment_confirmed',
  'processing',
  'ready_for_delivery',
  'out_for_delivery',
  'delivered',
  'cancelled',
];

export async function updateOrderStatus(formData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/admin/orders');

  const id = str(formData, 'id');
  const payment_status = str(formData, 'payment_status');
  const order_status = str(formData, 'order_status');
  const payment_reference = str(formData, 'payment_reference');

  if (!id) redirect('/admin/orders');

  const update = {};
  if (ALLOWED_PAYMENT.includes(payment_status)) update.payment_status = payment_status;
  if (ALLOWED_ORDER.includes(order_status)) update.order_status = order_status;
  if (payment_reference !== undefined) update.payment_reference = payment_reference || null;

  if (Object.keys(update).length === 0) {
    redirect(`/admin/orders/${id}?error=${encodeURIComponent('Nothing to update.')}`);
  }

  const service = createServiceClient();
  const { error } = await service.from('orders').update(update).eq('id', id);
  if (error) {
    redirect(`/admin/orders/${id}?error=${encodeURIComponent(error.message)}`);
  }

  revalidateTag('store');
  revalidatePath('/admin/orders');
  revalidatePath(`/admin/orders/${id}`);
  redirect(`/admin/orders/${id}?message=${encodeURIComponent('Order updated.')}`);
}

export async function markOrderPaid(formData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/admin/orders');

  const id = str(formData, 'id');
  if (!id) redirect('/admin/orders');

  const service = createServiceClient();
  await service
    .from('orders')
    .update({
      payment_status: 'paid',
      order_status: 'payment_confirmed',
    })
    .eq('id', id);

  // Also update the payments row for consistency
  await service
    .from('payments')
    .update({ status: 'success' })
    .eq('order_id', id)
    .eq('status', 'initiated');

  revalidateTag('store');
  revalidatePath('/admin/orders');
  revalidatePath(`/admin/orders/${id}`);
  redirect(`/admin/orders/${id}?message=${encodeURIComponent('Order marked as paid.')}`);
}
