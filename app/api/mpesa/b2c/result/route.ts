import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  try {
    const body = await request.json()
    console.log('📥 B2C result callback:', JSON.stringify(body, null, 2))

    const result = body?.Result
    if (result) {
      const { ResultCode, ResultDesc, ConversationID, TransactionID, OriginatorConversationID } = result

      // Find the withdrawal by B2C conversation ID (stored earlier in admin_note)
      if (ConversationID) {
        const { data: wd } = await supabaseAdmin
          .from('withdrawals')
          .select('*')
          .ilike('admin_note', `%${ConversationID}%`)
          .single()

        if (wd) {
          if (ResultCode === 0) {
            // Success — mark as paid (in case it wasn't already)
            await supabaseAdmin
              .from('withdrawals')
              .update({
                status: 'paid',
                admin_note: `B2C OK · ${TransactionID || ConversationID}`,
                processed_at: new Date().toISOString(),
              })
              .eq('id', wd.id)

            console.log('✅ B2C payout confirmed:', TransactionID)
          } else {
            // Failed — mark as failed and refund
            const { data: bal } = await supabaseAdmin
              .from('balances')
              .select('live_balance')
              .eq('user_id', wd.user_id)
              .single()

            const refunded = Number(bal?.live_balance || 0) + Number(wd.amount)
            await supabaseAdmin
              .from('balances')
              .update({ live_balance: refunded, updated_at: new Date().toISOString() })
              .eq('user_id', wd.user_id)

            await supabaseAdmin
              .from('withdrawals')
              .update({
                status: 'failed',
                admin_note: `B2C failed: ${ResultDesc || 'unknown'}`,
              })
              .eq('id', wd.id)

            await supabaseAdmin.from('transactions').insert({
              user_id: wd.user_id,
              type: 'withdrawal_refund',
              amount: Number(wd.amount),
              balance_after: refunded,
              description: `B2C failed — refunded (${ResultDesc || 'unknown'})`,
            })

            console.log('❌ B2C failed and refunded:', ResultDesc)
          }
        }
      }
    }

    return NextResponse.json({ ResultCode: 0, ResultDesc: 'Accepted' })
  } catch (error) {
    console.error('❌ B2C result callback error:', error)
    return NextResponse.json({ ResultCode: 0, ResultDesc: 'Accepted' })
  }
}