import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function verifyWebhook(secret: string, payload: any, headerSignature: string): boolean {
  const { signature, ...payloadWithoutSignature } = payload
  const payloadString = JSON.stringify(payloadWithoutSignature)
  const computed = 'sha256=' + crypto.createHmac('sha256', secret).update(payloadString).digest('hex')
  try {
    return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(headerSignature.trim()))
  } catch { return false }
}

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json()
    const headerSignature = req.headers.get('x-kotani-signature')

    // Verify signature if Kotani sends one
    if (headerSignature && !verifyWebhook(process.env.KOTANI_WEBHOOK_SECRET!, payload, headerSignature)) {
      console.error('Invalid Kotani signature')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    console.log('✅ Kotani webhook received:', JSON.stringify(payload, null, 2))

    // Listen for M-Pesa deposit success
    if (payload.event === 'transaction.deposit.status.updated') {
      const { referenceId, status } = payload.data

      if (status === 'SUCCESSFUL' || status === 'COMPLETED') {
        const { data: deposit } = await supabaseAdmin
          .from('deposits')
          .select('*')
          .eq('id', referenceId)
          .single()

        if (deposit && deposit.status !== 'completed') {
          const { data: bal } = await supabaseAdmin
            .from('balances')
            .select('live_balance')
            .eq('user_id', deposit.user_id)
            .single()

          if (bal) {
            const newLive = Number(bal.live_balance) + Number(deposit.amount)
            
            // 1. Add money to user balance
            await supabaseAdmin
              .from('balances')
              .update({ live_balance: newLive, updated_at: new Date().toISOString() })
              .eq('user_id', deposit.user_id)

            // 2. Mark deposit as completed
            await supabaseAdmin
              .from('deposits')
              .update({ status: 'completed', mpesa_result_desc: 'Kotani deposit success' })
              .eq('id', referenceId)

            // 3. Log the transaction
            await supabaseAdmin.from('transactions').insert({
              user_id: deposit.user_id,
              type: 'deposit',
              amount: Number(deposit.amount),
              balance_after: newLive,
              description: `M-Pesa deposit via Kotani (KES ${deposit.amount})`,
            })
            console.log(`✅ Credited $${deposit.amount} to user ${deposit.user_id}`)
          }
        }
      } else if (status === 'FAILED') {
        await supabaseAdmin.from('deposits').update({ status: 'failed' }).eq('id', referenceId)
      }
    }

    return NextResponse.json({ received: true })
  } catch (err: any) {
    console.error('Webhook error:', err)
    return NextResponse.json({ received: true })
  }
}