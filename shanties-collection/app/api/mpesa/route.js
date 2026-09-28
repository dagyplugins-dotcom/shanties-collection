// app/api/mpesa/route.js
import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { initiateSTKPush } from '@/lib/mpesa';

export async function POST(request) {
  try {
    // 1. Check credentials are configured
    if (!process.env.MPESA_CONSUMER_KEY || process.env.MPESA_CONSUMER_KEY === 'test_key') {
      return NextResponse.json(
        { error: 'M-Pesa is not configured yet. Please add your Daraja credentials to .env.local.' },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { customer, items, phone } = body;

    // 2. Validate input
    if (!customer || !items || !Array.isArray(items) || items.length === 0 || !phone) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!customer.customer_name || !customer.delivery_county || !customer.delivery_town || !customer.delivery_address) {
      return NextResponse.json({ error: 'Missing delivery details' }, { status: 400 });
    }

    const supabase = createServiceClient();

    // 3. Fetch real product prices from database (NEVER trust the browser)
    const productIds = items.map((i) => i.id);
    const { data: products, error: prodErr } = await supabase
      .from('products')
      .select('id, name, price, stock_quantity, is_active')
      .in('id', productIds);

    if (prodErr) throw prodErr;
    if (!products || products.length === 0) {
      return NextResponse.json({ error: 'No valid products found' }, { status: 400 });
    }

    // 4. Build line items using DB prices (ignore client-side prices)
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

    // 5. Fetch delivery fee from delivery_zones by county
    const { data: zone } = await supabase
      .from('delivery_zones')
      .select('id, fee')
      .eq('county', customer.delivery_county)
      .eq('is_enabled', true)
      .maybeSingle();

    const deliveryFee = zone ? Number(zone.fee) : 0;
    const deliveryZoneId = zone ? zone.id : null;
    const total = subtotal + deliveryFee;

    // 6. Insert order
    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .insert({
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
        payment_method: 'mpesa_stk',
        payment_status: 'pending_payment',
        order_status: 'order_placed',
      })
      .select('id, order_number')
      .single();

    if (orderErr) throw orderErr;

    // 7. Insert order items
    const { error: itemsErr } = await supabase
      .from('order_items')
      .insert(lineItems.map((li) => ({ ...li, order_id: order.id })));

    if (itemsErr) throw itemsErr;

    // 8. Insert payment row (initiated)
    const { data: payment, error: payErr } = await supabase
      .from('payments')
      .insert({
        order_id: order.id,
        method: 'mpesa_stk',
        phone,
        amount: total,
        status: 'initiated',
      })
      .select('id')
      .single();

    if (payErr) throw payErr;

    // 9. Trigger STK Push
    const callbackUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/api/mpesa/callback`;
    const stk = await initiateSTKPush({
      phone,
      amount: total,
      accountReference: order.order_number,
      transactionDesc: `Payment for ${order.order_number}`,
      callbackUrl,
    });

    // 10. Save CheckoutRequestID on payment + move status to pending
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
      message: 'STK Push sent. Check your phone.',
    });

  } catch (error) {
    console.error('M-Pesa API Error:', error);
    return NextResponse.json({ error: error.message || 'Payment failed' }, { status: 500 });
  }
}
