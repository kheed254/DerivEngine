import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const DARAJA_BASE = 'https://sandbox.safaricom.co.ke'
const B2C_CONSUMER_KEY = process.env.MPESA_B2C_CONSUMER_KEY!
const B2C_CONSUMER_SECRET = process.env.MPESA_B2C_CONSUMER_SECRET!
const B2C_SHORTCODE = process.env.MPESA_B2C_SHORTCODE || '600000'
const B2C_INITIATOR = process.env.MPESA_B2C_INITIATOR_NAME || 'testapi'
const B2C_SECURITY_CRED = process.env.MPESA_B2C_SECURITY_CREDENTIAL || 'Safaricom999!*!'

// ─────────────────────────────────────────────
// Get OAuth token
// ─────────────────────────────────────────────
async function getAccessToken(): Promise<string> {
  const auth = Buffer.from(`${B2C_CONSUMER_KEY}:${B2C_CONSUMER_SECRET}`).toString('base64')
  const res = await fetch(`${DARAJA_BASE}/oauth/v1/generate?grant_type=client_credentials`, {
    method: 'GET',
    headers: { Authorization: `Basic ${auth}` },
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Safaricom B2C auth failed: ${err}`)
  }
  const data = await res.json()
  return data.access_token
}

// ─────────────────────────────────────────────
// Send B2C payout
// ─────────────────────────────────────────────
async function sendB2C(phone: string, amount: number, remarks: string) {
  const token = await getAccessToken()

  let formattedPhone = phone.replace(/\D/g, '')
  if (formattedPhone.startsWith('0')) formattedPhone = '254' + formattedPhone.slice(1)
  if (formattedPhone.startsWith('7')) formattedPhone = '254' + formattedPhone
  if (formattedPhone.startsWith('1')) formattedPhone = '254' + formattedPhone

  const body = {
    InitiatorName: B2C_INITIATOR,
    SecurityCredential: B2C_SECURITY_CRED,
    CommandID: 'BusinessPayment',
    Amount: Math.ceil(amount),
    PartyA: B2C_SHORTCODE,
    PartyB: formattedPhone,
    Remarks: remarks,
    QueueTimeOutURL: 'https://derivengine.vercel.app/api/mpesa/b2c/timeout',
    ResultURL: 'https://derivengine.vercel.app/api/mpesa/b2c/result',
    Occasion: 'Withdrawal',
  }

  console.log('📡 Sending B2C payout to', formattedPhone, 'amount', amount)

  const res = await fetch(`${DARAJA_BASE}/mpesa/b2c/v1/paymentrequest`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  const data = await res.json()
  console.log('📥 B2C response:', data)
  return { ok: res.ok, data }
}

// ─────────────────────────────────────────────
// MAIN HANDLER
// ─────────────────────────────────────────────
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { withdrawalId } = body

    if (!withdrawalId) {
      return NextResponse.json({ success: false, error: 'Missing withdrawalId' }, { status: 400 })
    }

    // Fetch withdrawal
    const { data: wd, error } = await supabaseAdmin
      .from('withdrawals')
      .select('*')
      .eq('id', withdrawalId)
      .single()

    if (error || !wd) {
      return NextResponse.json({ success: false, error: 'Withdrawal not found' }, { status: 404 })
    }

    if (wd.status !== 'approved') {
      return NextResponse.json({ success: false, error: 'Withdrawal must be approved first' }, { status: 400 })
    }

    if (wd.method !== 'mpesa' || !wd.phone) {
      return NextResponse.json({ success: false, error: 'Only M-Pesa withdrawals supported' }, { status: 400 })
    }

    // Send B2C
    const { ok, data } = await sendB2C(wd.phone, wd.amount, `Payout ${withdrawalId.slice(0, 8)}`)

    if (!ok) {
      return NextResponse.json({
        success: false,
        error: data.errorMessage || data.errorCode || 'B2C failed',
        raw: data,
      })
    }

    // Update status to paid + record reference
    await supabaseAdmin
      .from('withdrawals')
      .update({
        status: 'paid',
        admin_note: `B2C Ref: ${data.ConversationID || 'unknown'}`,
        processed_at: new Date().toISOString(),
      })
      .eq('id', withdrawalId)

    // Record in transactions
    await supabaseAdmin.from('transactions').insert({
      user_id: wd.user_id,
      type: 'withdrawal_paid',
      amount: -Number(wd.amount),
      description: `B2C payout to ${wd.phone}`,
    })

    return NextResponse.json({
      success: true,
      message: 'B2C payout initiated',
      conversationId: data.ConversationID,
      originatorConversationId: data.OriginatorConversationID,
    })
  } catch (error: any) {
    console.error('❌ B2C route error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}