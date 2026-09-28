// app/api/mpesa/callback/route.js
import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';

export async function POST(request) {
  try {
    const body = await request.json();
    console.log('M-Pesa Callback:', JSON.stringify(body, null, 2));

    const stkCallback = body?.Body?.stkCallback;

    if (!stkCallback) {
      return NextResponse.json({ ResultCode: 0, ResultDesc: 'Accepted' });
    }

    const { MerchantRequestID, CheckoutRequestID, ResultCode, ResultDesc } = stkCallback;
    const isSuccess = ResultCode === 0;

    // Extract receipt number if successful
    let mpesaReceipt = null;
    if (isSuccess && stkCallback.CallbackMetadata?.Item) {
      const receiptItem = stkCallback.CallbackMetadata.Item.find(
        (i) => i.Name === 'MpesaReceiptNumber'
      );
      if (receiptItem) mpesaReceipt = String(receiptItem.Value);
    }

    // Map ResultCode to our enum
    let paymentStatus = 'failed';
    if (ResultCode === 0) paymentStatus = 'success';
    else if (ResultCode === 1032) paymentStatus = 'cancelled';
    else paymentStatus = 'failed';

    const supabase = createServiceClient();

    // 1. Update the payment row
    const { data: payment, error: payErr } = await supabase
      .from('payments')
      .update({
        status: paymentStatus,
        result_code: ResultCode,
        result_desc: ResultDesc,
        mpesa_receipt: mpesaReceipt,
        raw_callback: body,
        merchant_request_id: MerchantRequestID,
      })
      .eq('checkout_request_id', CheckoutRequestID)
      .select('order_id')
      .maybeSingle();

    if (payErr) console.error('Payment update error:', payErr);

    // 2. Update the order
    if (payment?.order_id) {
      await supabase
        .from('orders')
        .update({
          payment_status: isSuccess ? 'paid' : (ResultCode === 1032 ? 'payment_cancelled' : 'payment_failed'),
          payment_reference: mpesaReceipt,
          order_status: isSuccess ? 'payment_confirmed' : 'order_placed',
        })
        .eq('id', payment.order_id);
    }

    // Safaricom expects this exact response
    return NextResponse.json({ ResultCode: 0, ResultDesc: 'Accepted' });

  } catch (error) {
    console.error('Callback error:', error);
    // Always return success so Safaricom doesn't retry endlessly
    return NextResponse.json({ ResultCode: 0, ResultDesc: 'Accepted' });
  }
}
