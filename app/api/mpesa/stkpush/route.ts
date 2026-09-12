import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const DARAJA_BASE = 'https://sandbox.safaricom.co.ke'
const CONSUMER_KEY = process.env.MPESA_CONSUMER_KEY!
const CONSUMER_SECRET = process.env.MPESA_CONSUMER_SECRET!
const PASSKEY = process.env.MPESA_PASSKEY!
const SHORTCODE = process.env.MPESA_SHORTCODE || '174379'
const CALLBACK_URL = 'https://derivengine.vercel.app/api/mpesa/callback'

async function getAccessToken(): Promise<string> {
  const auth = Buffer.from(`${CONSUMER_KEY}:${CONSUMER_SECRET}`).toString('base64')
  const res = await fetch(`${DARAJA_BASE}/oauth/v1/generate?grant_type=client_credentials`, {
    method: 'GET',
    headers: { Authorization: `Basic ${auth}` },
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Safaricom auth failed: ${err}`)
  }
  const data = await res.json()
  return data.access_token
}

async function sendSTKPush(phone: string, amount: number, accountRef: string) {
  const token = await getAccessToken()
  const now = new Date()
  const timestamp =
    now.getFullYear().toString() +
    String(now.getMonth() + 1).padStart(2, '0') +
    String(now.getDate()).padStart(2, '0') +
    String(now.getHours()).padStart(2, '0') +
    String(now.getMinutes()).padStart(2, '0') +
    String(now.getSeconds()).padStart(2, '0')

  const password = Buffer.from(`${SHORTCODE}${PASSKEY}${timestamp}`).toString('base64')

  let formattedPhone = phone.replace(/\D/g, '')
  if (formattedPhone.startsWith('0')) formattedPhone = '254' + formattedPhone.slice(1)
  if (formattedPhone.startsWith('7')) formattedPhone = '254' + formattedPhone
  if (formattedPhone.startsWith('1')) formattedPhone = '254' + formattedPhone

  const body = {
    BusinessShortCode: SHORTCODE,
    Password: password,
    Timestamp: timestamp,
    TransactionType: 'CustomerPayBillOnline',
    Amount: Math.ceil(amount),
    PartyA: formattedPhone,
    PartyB: SHORTCODE,
    PhoneNumber: formattedPhone,
    CallBackURL: CALLBACK_URL,
    AccountReference: accountRef,
    TransactionDesc: 'DerivEngine Deposit',
  }

  console.log('📡 Sending STK Push to', formattedPhone, 'for', amount)

  const res = await fetch(`${DARAJA_BASE}/mpesa/stkpush/v1/processrequest`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  const data = await res.json()
  console.log('📥 Safaricom response:', data)
  return { ok: res.ok, data }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { phone, amount, depositId } = body

    if (!phone || !amount || !depositId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    await supabaseAdmin
      .from('deposits')
      .update({ status: 'processing' })
      .eq('id', depositId)

    const { ok, data } = await sendSTKPush(phone, amount, `DEP-${depositId.slice(0, 8)}`)

    if (!ok) {
      await supabaseAdmin
        .from('deposits')
        .update({ status: 'failed' })
        .eq('id', depositId)

      return NextResponse.json({
        success: false,
        error: data.errorMessage || data.errorCode || 'STK Push failed',
        raw: data,
      })
    }

    await supabaseAdmin
      .from('deposits')
      .update({
        reference: data.CheckoutRequestID,
        metadata: data,
      })
      .eq('id', depositId)

    return NextResponse.json({
      success: true,
      message: 'STK Push sent. Check your phone and enter M-Pesa PIN.',
      checkoutRequestId: data.CheckoutRequestID,
      customerMessage: data.CustomerMessage,
    })
  } catch (error: any) {
    console.error('❌ STK Push route error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}