// app/api/mpesa/stkpush/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function getTimestamp() {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return (
    d.getFullYear() +
    pad(d.getMonth() + 1) +
    pad(d.getDate()) +
    pad(d.getHours()) +
    pad(d.getMinutes()) +
    pad(d.getSeconds())
  )
}

export async function POST(req: NextRequest) {
  try {
    const { phone, amount, depositId } = await req.json()

    if (!phone || !amount || !depositId) {
      return NextResponse.json(
        { error: 'Missing phone, amount, or depositId' },
        { status: 400 }
      )
    }

    const numAmount = Number(amount)
    if (!Number.isFinite(numAmount) || numAmount <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })
    }

    const { data: deposit, error: depErr } = await supabaseAdmin
      .from('deposits')
      .select('*')
      .eq('id', depositId)
      .single()

    if (depErr || !deposit) {
      return NextResponse.json({ error: 'Deposit record not found' }, { status: 404 })
    }
    if (deposit.status !== 'pending') {
      return NextResponse.json({ error: 'Deposit already processed' }, { status: 400 })
    }

    let msisdn = String(phone).replace(/\D/g, '')
    if (msisdn.startsWith('0')) msisdn = '254' + msisdn.slice(1)
    if (msisdn.startsWith('7') || msisdn.startsWith('1')) msisdn = '254' + msisdn
    if (!msisdn.startsWith('254') || msisdn.length !== 12) {
      return NextResponse.json({ error: 'Invalid Kenyan phone number' }, { status: 400 })
    }

    const timestamp = getTimestamp()
    const shortcode = process.env.MPESA_SHORTCODE!
    const passkey = process.env.MPESA_PASSKEY!
    const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString('base64')

    const auth = Buffer.from(
      `${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`
    ).toString('base64')

    const tokenRes = await fetch(
      'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
      { headers: { Authorization: `Basic ${auth}` } }
    )
    const tokenData = await tokenRes.json()
    if (!tokenData.access_token) {
      console.error('Token error:', tokenData)
      return NextResponse.json({ error: 'Failed to get M-Pesa access token' }, { status: 500 })
    }

    const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/mpesa/callback`

    const stkBody = {
      BusinessShortCode: shortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: Math.round(numAmount),
      PartyA: msisdn,
      PartyB: shortcode,
      PhoneNumber: msisdn,
      CallBackURL: callbackUrl,
      AccountReference: `DEP-${depositId.slice(0, 8)}`,
      TransactionDesc: 'DerivEngine deposit',
    }

    const stkRes = await fetch(
      'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(stkBody),
      }
    )
    const stkData = await stkRes.json()

    if (stkData.ResponseCode !== '0') {
      console.error('STK error:', stkData)
      await supabaseAdmin
        .from('deposits')
        .update({ status: 'failed', mpesa_response: stkData })
        .eq('id', depositId)
      return NextResponse.json(
        { error: stkData.errorMessage || stkData.ResponseDescription || 'STK push failed' },
        { status: 400 }
      )
    }

    await supabaseAdmin
      .from('deposits')
      .update({
        status: 'processing',
        mpesa_checkout_request_id: stkData.CheckoutRequestID,
        mpesa_merchant_request_id: stkData.MerchantRequestID,
      })
      .eq('id', depositId)

    return NextResponse.json({
      success: true,
      checkoutRequestId: stkData.CheckoutRequestID,
    })
  } catch (err: any) {
    console.error('STK push error:', err)
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 })
  }
}