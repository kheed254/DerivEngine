import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto' // Only needed if Secure Mode is ON

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { phone, amount, depositId, userId } = await req.json()

    // 1. Normalize phone
    let msisdn = String(phone).replace(/\D/g, '')
    if (msisdn.startsWith('0')) msisdn = '254' + msisdn.slice(1)
    if (msisdn.startsWith('7') || msisdn.startsWith('1')) msisdn = '254' + msisdn
    if (!msisdn.startsWith('254') || msisdn.length !== 12) {
      return NextResponse.json({ error: 'Invalid Kenyan phone number' }, { status: 400 })
    }

    // 2. Prepare body for Deposit Flow
    const body = {
      customer_key: `cust_${userId}`, // Unique identifier for the customer
      amount: Number(amount),
      currency: 'KES',
      phone_number: msisdn,
      callback_url: `https://derivengine.vercel.app/api/kotani/webhook`, // We will update the webhook later
      reference_id: depositId,
    }

    // 3. (Optional) Signature Headers if Secure Mode is ON
    // If your account does NOT have Request Signing enabled, you can delete this block and just use the Authorization header.
    const timestamp = Math.floor(Date.now() / 1000).toString()
    const nonce = crypto.randomUUID()
    const payload = `${timestamp}.${nonce}.${JSON.stringify(body)}`
    const signature = crypto
      .createHmac('sha256', process.env.KOTANI_WEBHOOK_SECRET!) // Use your API Secret here
      .update(payload)
      .digest('hex')

    // 4. Call Kotani Deposit Endpoint
    const res = await fetch(`https://sandbox-api.kotanipay.com/api/v3/deposit/mobile-money`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.KOTANI_API_KEY}`,
        'Content-Type': 'application/json',
        // Include these 3 lines ONLY if Secure Mode is ON:
        'x-timestamp': timestamp,
        'x-nonce': nonce,
        'x-signature': signature,
      },
      body: JSON.stringify(body),
    })

    const data = await res.json()

    if (!res.ok) {
      console.error('Kotani deposit error:', data)
      await supabaseAdmin.from('deposits').update({ status: 'failed', mpesa_response: data }).eq('id', depositId)
      return NextResponse.json({ error: data.message || 'Deposit failed' }, { status: 400 })
    }

    // Mark as processing
    await supabaseAdmin.from('deposits').update({
      status: 'processing',
      mpesa_checkout_request_id: data.id || depositId,
    }).eq('id', depositId)

    return NextResponse.json({ success: true, referenceId: data.id || depositId })
  } catch (err: any) {
    console.error('Deposit route error:', err)
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 })
  }
}