import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json()
    
    console.log('✅ Kotani webhook received:', JSON.stringify(payload, null, 2))

    // Kotani sends a flat JSON object for deposits
    const { status, reference_id, amount } = payload

    if (status === 'SUCCESSFUL' || status === 'COMPLETED') {
      
      // Find the deposit row using the reference_id (which is your depositId)
      const { data: deposit } = await supabaseAdmin
        .from('deposits')
        .select('*')
        .eq('id', reference_id)
        .single()

      // Only process if the deposit exists and hasn't been completed yet
      if (deposit && deposit.status !== 'completed') {
        
        // Get current user balance
        const { data: bal } = await supabaseAdmin
          .from('balances')
          .select('live_balance')
          .eq('user_id', deposit.user_id)
          .single()

        if (bal) {
          const newLive = Number(bal.live_balance) + Number(deposit.amount)
          
          // 1. Update Balance
          await supabaseAdmin
            .from('balances')
            .update({ live_balance: newLive, updated_at: new Date().toISOString() })
            .eq('user_id', deposit.user_id)

          // 2. Mark Deposit as Completed
          await supabaseAdmin
            .from('deposits')
            .update({ status: 'completed', mpesa_result_desc: 'Kotani deposit success' })
            .eq('id', reference_id)

          // 3. Add to Transactions Ledger
          await supabaseAdmin.from('transactions').insert({
            user_id: deposit.user_id,
            type: 'deposit',
            amount: Number(deposit.amount),
            balance_after: newLive,
            description: `M-Pesa deposit via Kotani (Ref: ${reference_id})`,
          })

          console.log(`✅ Credited $${deposit.amount} to user ${deposit.user_id}`)
        }
      }
    } else if (status === 'FAILED') {
      await supabaseAdmin
        .from('deposits')
        .update({ status: 'failed' })
        .eq('id', reference_id)
    }

    return NextResponse.json({ received: true })
  } catch (err: any) {
    console.error('Webhook error:', err)
    return NextResponse.json({ received: true })
  }
}