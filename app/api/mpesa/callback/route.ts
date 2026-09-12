import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  try {
    const body = await request.json()
    console.log('📥 M-Pesa callback received:', JSON.stringify(body, null, 2))

    const stkCallback = body?.Body?.stkCallback

    if (!stkCallback) {
      return NextResponse.json({ ResultCode: 0, ResultDesc: 'Accepted' })
    }

    const { CheckoutRequestID, ResultCode, ResultDesc, CallbackMetadata } = stkCallback

    const { data: deposit, error: findError } = await supabaseAdmin
      .from('deposits')
      .select('*')
      .eq('reference', CheckoutRequestID)
      .single()

    if (findError || !deposit) {
      console.error('❌ Deposit not found for CheckoutRequestID:', CheckoutRequestID)
      return NextResponse.json({ ResultCode: 0, ResultDesc: 'Accepted' })
    }

    if (ResultCode === 0 && CallbackMetadata) {
      const items = CallbackMetadata.Item || []
      const receipt = items.find((i: any) => i.Name === 'MpesaReceiptNumber')?.Value || ''
      const paidAmount = items.find((i: any) => i.Name === 'Amount')?.Value || deposit.amount

      const { data: balanceData } = await supabaseAdmin
        .from('balances')
        .select('live_balance')
        .eq('user_id', deposit.user_id)
        .single()

      const newLive = Number(balanceData?.live_balance || 0) + Number(paidAmount)

      await supabaseAdmin
        .from('balances')
        .update({ live_balance: newLive, updated_at: new Date().toISOString() })
        .eq('user_id', deposit.user_id)

      await supabaseAdmin.from('transactions').insert({
        user_id: deposit.user_id,
        type: 'deposit',
        amount: paidAmount,
        balance_after: newLive,
        reference_id: deposit.id,
        description: `M-Pesa deposit (Receipt: ${receipt})`,
      })

      await supabaseAdmin
        .from('deposits')
        .update({
          status: 'completed',
          reference: receipt,
          completed_at: new Date().toISOString(),
        })
        .eq('id', deposit.id)

      console.log('✅ Deposit completed:', receipt, 'New balance:', newLive)
    } else {
      await supabaseAdmin
        .from('deposits')
        .update({
          status: 'failed',
          metadata: stkCallback,
        })
        .eq('id', deposit.id)

      console.log('❌ Deposit failed:', ResultDesc)
    }

    return NextResponse.json({ ResultCode: 0, ResultDesc: 'Accepted' })
  } catch (error: any) {
    console.error('❌ Callback error:', error)
    return NextResponse.json({ ResultCode: 0, ResultDesc: 'Accepted' })
  }
}