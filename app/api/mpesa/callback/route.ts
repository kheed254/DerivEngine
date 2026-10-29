// app/api/mpesa/callback/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    console.log('📩 M-Pesa callback:', JSON.stringify(body, null, 2))

    const stk = body?.Body?.stkCallback
    if (!stk) {
      return NextResponse.json({ ResultCode: 0, ResultDesc: 'Ignored' })
    }

    const { CheckoutRequestID, ResultCode, ResultDesc, CallbackMetadata } = stk

    const { data: deposit, error: findErr } = await supabaseAdmin
      .from('deposits')
      .select('*')
      .eq('mpesa_checkout_request_id', CheckoutRequestID)
      .single()

    if (findErr || !deposit) {
      console.error('Deposit not found for', CheckoutRequestID)
      return NextResponse.json({ ResultCode: 0, ResultDesc: 'Deposit not found' })
    }

    if (deposit.status === 'completed') {
      return NextResponse.json({ ResultCode: 0, ResultDesc: 'Already processed' })
    }

    if (ResultCode !== 0) {
      await supabaseAdmin
        .from('deposits')
        .update({
          status: 'failed',
          mpesa_result_code: ResultCode,
          mpesa_result_desc: ResultDesc,
        })
        .eq('id', deposit.id)
      return NextResponse.json({ ResultCode: 0, ResultDesc: 'Marked failed' })
    }

    const items: any[] = CallbackMetadata?.Item || []
    const amountItem = items.find((i) => i.Name === 'Amount')
    const receiptItem = items.find((i) => i.Name === 'MpesaReceiptNumber')
    const phoneItem = items.find((i) => i.Name === 'PhoneNumber')

    const amount = Number(amountItem?.Value ?? deposit.amount)
    const receipt = receiptItem?.Value ?? null
    const payerPhone = phoneItem?.Value ? String(phoneItem.Value) : deposit.phone

    if (!Number.isFinite(amount) || amount <= 0) {
      await supabaseAdmin
        .from('deposits')
        .update({ status: 'failed', mpesa_result_desc: 'Invalid amount in callback' })
        .eq('id', deposit.id)
      return NextResponse.json({ ResultCode: 0, ResultDesc: 'Invalid amount' })
    }

    // ═══════════════════════════════════════════════════════
    //  ✅ ALWAYS CREDIT live_balance — NEVER demo
    // ═══════════════════════════════════════════════════════
    const { data: bal, error: balErr } = await supabaseAdmin
      .from('balances')
      .select('live_balance')
      .eq('user_id', deposit.user_id)
      .single()

    if (balErr || !bal) {
      console.error('Balance row not found for user', deposit.user_id)
      await supabaseAdmin
        .from('deposits')
        .update({ status: 'completed_pending_credit', mpesa_receipt: receipt })
        .eq('id', deposit.id)
      return NextResponse.json({ ResultCode: 0, ResultDesc: 'Balance missing' })
    }

    const newLive = Number(bal.live_balance) + Number(amount)

    const { error: updErr } = await supabaseAdmin
      .from('balances')
      .update({
        live_balance: newLive,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', deposit.user_id)

    if (updErr) {
      console.error('Balance update failed:', updErr)
      return NextResponse.json({ ResultCode: 0, ResultDesc: 'Update failed' })
    }

    await supabaseAdmin
      .from('deposits')
      .update({
        status: 'completed',
        mpesa_receipt: receipt,
        mpesa_result_code: ResultCode,
        mpesa_result_desc: ResultDesc,
        mpesa_phone: payerPhone,
      })
      .eq('id', deposit.id)

    await supabaseAdmin.from('transactions').insert({
      user_id: deposit.user_id,
      type: 'deposit',
      amount: Number(amount),
      balance_after: newLive,
      description: `M-Pesa deposit · ${receipt || 'no receipt'}`,
    })

    console.log(`✅ Credited $${amount} to live_balance for user ${deposit.user_id}`)

    return NextResponse.json({ ResultCode: 0, ResultDesc: 'Success' })
  } catch (err: any) {
    console.error('Callback error:', err)
    return NextResponse.json({ ResultCode: 0, ResultDesc: 'Handled with error' })
  }
}

export async function GET() {
  return NextResponse.json({ status: 'M-Pesa callback endpoint is live' })
}