// app/api/kotani/onramp/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

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

    // Call Kotani Pay Onramp API
    const res = await fetch(`${process.env.KOTANI_BASE_URL}/onramp`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.KOTANI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fiatAmount: numAmount,
        currency: 'KES',
        chain: 'TRON',
        token: 'USDT',
        receiverAddress: 'TLgyntXK3BLu1WU9qpqvyX2ir5zUGQnb1L', // Your Trust Wallet USDT address
        phoneNumber: msisdn,
        referenceId: depositId,
        callbackUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/kotani/webhook`,
      }),
    })

    const data = await res.json()

    if (!res.ok) {
      console.error('Kotani onramp error:', data)
      await supabaseAdmin
        .from('deposits')
        .update({ status: 'failed', mpesa_response: data })
        .eq('id', depositId)
      return NextResponse.json({ error: data.message || 'Onramp failed' }, { status: 400 })
    }

    // Mark deposit as processing
    await supabaseAdmin
      .from('deposits')
      .update({
        status: 'processing',
        mpesa_checkout_request_id: data.referenceId || depositId,
      })
      .eq('id', depositId)

    return NextResponse.json({
      success: true,
      referenceId: data.referenceId || depositId,
    })
  } catch (err: any) {
    console.error('Onramp route error:', err)
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 })
  }
}