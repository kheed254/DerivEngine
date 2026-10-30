import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { phone, amount, depositId, userId } = await req.json()

    if (!phone || !amount || !depositId || !userId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const numAmount = Number(amount)
    if (!Number.isFinite(numAmount) || numAmount <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })
    }

    // Normalize phone to 2547XXXXXXXX
    let msisdn = String(phone).replace(/\D/g, '')
    if (msisdn.startsWith('0')) msisdn = '254' + msisdn.slice(1)
    if (msisdn.startsWith('7') || msisdn.startsWith('1')) msisdn = '254' + msisdn
    if (!msisdn.startsWith('254') || msisdn.length !== 12) {
      return NextResponse.json({ error: 'Invalid Kenyan phone number' }, { status: 400 })
    }

    // 👇 REPLACE THIS WITH THE WALLET ID YOU COPIED FROM KOTANI 👇
    const KOTANI_WALLET_ID = '6ae5010d87e1c813d2aada78'

    const body = {
      customer_key: `cust_${userId}`,
      amount: numAmount,
      currency: 'KES',
      wallet_id: KOTANI_WALLET_ID,
      phone_number: msisdn,
      callback_url: `https://derivengine.vercel.app/api/kotani/webhook`,
      reference_id: depositId,
    }

    // Generate signature for Kotani secure mode
    const timestamp = Math.floor(Date.now() / 1000).toString()
    const nonce = crypto.randomUUID()
    const payload = `${timestamp}.${nonce}.${JSON.stringify(body)}`
    const signature = crypto
      .createHmac('sha256', process.env.KOTANI_WEBHOOK_SECRET!)
      .update(payload)
      .digest('hex')

    const res = await fetch(`https://sandbox-api.kotanipay.com/api/v3/deposit/mobile-money`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.KOTANI_API_KEY}`,
        'Content-Type': 'application/json',
        'x-timestamp': timestamp,
        'x-nonce': nonce,
        'x-signature': signature,
      },
      body: JSON.stringify(body),
    })

    const data = await res.json()

    if (!res.ok) {
      console.error('Kotani deposit error:', data)
      await supabaseAdmin
        .from('deposits')
        .update({ status: 'failed', mpesa_response: data })
        .eq('id', depositId)
      return NextResponse.json({ error: data.message || data.error || 'Deposit failed' }, { status: 400 })
    }

    // Mark deposit as processing
    await supabaseAdmin
      .from('deposits')
      .update({
        status: 'processing',
        mpesa_checkout_request_id: data.id || depositId,
      })
      .eq('id', depositId)

    return NextResponse.json({
      success: true,
      referenceId: data.id || depositId,
    })
  } catch (err: any) {
    console.error('Deposit route error:', err)
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 })
  }
}