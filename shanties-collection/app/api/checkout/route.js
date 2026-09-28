// app/api/checkout/route.js
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { createServiceClient } from '@/lib/supabase/service';
import { initiateSTKPush } from '@/lib/mpesa';

export async function POST(request) {
  try {
    const body = await request.json();
    const { customer, items, phone, payment_method } = body;

    if (!customer || !items || !Array.isArray(items) || items.length === 0 || !phone) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!customer.customer_name || !customer.delivery_county || !customer.delivery_town || !customer.delivery_address) {
      return NextResponse.json({ error: 'Missing delivery details' }, { status: 400 });
    }

    const method = payment_method === 'mpesa_manual' ? 'mpesa_manual' : 'mpesa_stk';

    if (method === 'mpesa_stk') {
      if (!process.env.MPESA_CONSUMER_KEY || process.env.MPESA_CONSUMER_KEY === 'test_key') {
        return NextResponse.json(
          { error: 'M-Pesa STK is not configured yet. Please choose "Pay manually" instead.' },
          { status: 503 }
        );
      }
    }

    // ─── Detect logged-in user (optional) ───
    let userId = null;
    try {
      const cookieStore = cookies();
      const userClient = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        {
          cookies: {
            getAll: () => cookieStore.getAll(),
            setAll: () => {},
          },
        }
      );
      const { data: { user } } = await userClient.auth.getUser();
      userId = user?.id || null;
    } catch (e) {
      // Not logged in — fine, order will be anonymous
    }

    const supabase = createServiceClient();

    const productIds = items.map((i) => i.id);
    const { data: products, error: prodErr } = await supabase
      .from('products')
      .select('id, name, price, stock_quantity, is_active')
      .in('id', productIds);

    if (prodErr) throw prodErr;
    if (!products || products.length === 0) {
      return NextResponse.json({ error: 'No valid products found' }, { status: 400 });
    }

    const lineItems = items.map((item) => {
      const p = products.find((x) => x.id === item.id);
      if (!p || !p.is_active) throw new Error(`Product not available: ${item.name}`);
      if (p.stock_quantity < item.qty) throw new Error(`Not enough stock for ${p.name}`);
      return {
        product_id: p.id,
        name: p.name,
        price: Number(p.price),
        quantity: Number(item.qty),
        image_url: item.image || null,
      };
    });

    const subtotal = lineItems.reduce((s, i) => s + i.price * i.quantity, 0);

    const { data: zone } = await supabase
      .from('delivery_zones')
      .select('id, fee')
      .eq('county', customer.delivery_county)
      .eq('is_enabled', true)
      .maybeSingle();

    const deliveryFee = zone ? Number(zone.fee) : 0;
    const deliveryZoneId = zone ? zone.id : null;
    const total = subtotal + deliveryFee;

    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .insert({
        user_id: userId,
        customer_name: customer.customer_name,
        customer_phone: phone,
        customer_email: customer.customer_email || null,
        delivery_county: customer.delivery_county,
        delivery_town: customer.delivery_town,
        delivery_area: customer.delivery_area || null,
        delivery_address: customer.delivery_address,
        delivery_notes: customer.delivery_notes || null,
        delivery_zone_id: deliveryZoneId,
        subtotal,
        delivery_fee: deliveryFee,
        total,
        payment_method: method,
        payment_status: 'pending_payment',
        order_status: 'order_placed',
      })
      .select('id, order_number')
      .single();

    if (orderErr) throw orderErr;

    const { error: itemsErr } = await supabase
      .from('order_items')
      .insert(lineItems.map((li) => ({ ...li, order_id: order.id })));

    if (itemsErr) throw itemsErr;

    const { data: payment, error: payErr } = await supabase
      .from('payments')
      .insert({
        order_id: order.id,
        method,
        phone,
        amount: total,
        status: 'initiated',
      })
      .select('id')
      .single();

    if (payErr) throw payErr;

    if (method === 'mpesa_manual') {
      return NextResponse.json({
        success: true,
        order_number: order.order_number,
        payment_method: 'mpesa_manual',
        message: 'Order placed. Please complete payment using the details provided.',
      });
    }

    const callbackUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/api/mpesa/callback`;
    const stk = await initiateSTKPush({
      phone,
      amount: total,
      accountReference: order.order_number,
      transactionDesc: `Payment for ${order.order_number}`,
      callbackUrl,
    });

    await supabase
      .from('payments')
      .update({
        status: 'pending',
        merchant_request_id: stk.MerchantRequestID,
        checkout_request_id: stk.CheckoutRequestID,
      })
      .eq('id', payment.id);

    await supabase
      .from('orders')
      .update({ payment_status: 'payment_processing' })
      .eq('id', order.id);

    return NextResponse.json({
      success: true,
      order_number: order.order_number,
      checkout_request_id: stk.CheckoutRequestID,
      payment_method: 'mpesa_stk',
      message: 'STK Push sent. Check your phone.',
    });

  } catch (error) {
    console.error('Checkout API Error:', error);
    return NextResponse.json({ error: error.message || 'Checkout failed' }, { status: 500 });
  }
}
