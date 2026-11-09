'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import {
  ArrowLeft, Wallet, ArrowDownToLine, ArrowUpFromLine, TrendingUp,
  Loader2, Filter, Clock, CheckCircle2, XCircle, AlertCircle
} from 'lucide-react'

export default function HistoryPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [transactions, setTransactions] = useState<any[]>([])
  const [filter, setFilter] = useState<'all' | 'deposits' | 'withdrawals' | 'trades'>('all')

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return }
      setUser(session.user)

      // Load all three sources in parallel
      const [depositsRes, withdrawalsRes, tradesRes] = await Promise.all([
        supabase.from('deposits').select('*').eq('user_id', session.user.id).order('created_at', { ascending: false }),
        supabase.from('withdrawals').select('*').eq('user_id', session.user.id).order('created_at', { ascending: false }),
        supabase.from('trades').select('*').eq('user_id', session.user.id).order('created_at', { ascending: false }),
      ])

      // Merge into one unified list
      const merged: any[] = []

      ;(depositsRes.data || []).forEach((d: any) => {
        merged.push({
          id: d.id,
          kind: 'deposit',
          type: `Deposit · ${d.method.toUpperCase()}`,
          amount: Number(d.amount),
          status: d.status,
          date: d.created_at,
          description: d.phone || d.crypto_address || '',
        })
      })

      ;(withdrawalsRes.data || []).forEach((w: any) => {
        merged.push({
          id: w.id,
          kind: 'withdrawal',
          type: `Withdrawal · ${w.method.toUpperCase()}`,
          amount: -Number(w.amount),
          status: w.status,
          date: w.created_at,
          description: w.phone || w.crypto_address || '',
        })
      })

      ;(tradesRes.data || []).forEach((t: any) => {
        merged.push({
          id: t.id,
          kind: 'trade',
          type: `${t.prediction} · ${t.market}`,
          amount: Number(t.payout) >= 0 ? Number(t.payout) : Number(t.payout),
          status: t.result,
          date: t.created_at,
          description: t.result === 'WIN' ? 'Win' : 'Loss',
        })
      })

      // Sort by date desc
      merged.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      setTransactions(merged)
      setLoading(false)
    }
    load()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0613] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
      </div>
    )
  }

  const filtered = filter === 'all' ? transactions :
    filter === 'deposits' ? transactions.filter((t) => t.kind === 'deposit') :
    filter === 'withdrawals' ? transactions.filter((t) => t.kind === 'withdrawal') :
    transactions.filter((t) => t.kind === 'trade')

  const totalIn = transactions.filter((t) => t.amount > 0 && t.status === 'completed').reduce((s, t) => s + t.amount, 0)
  const totalOut = Math.abs(transactions.filter((t) => t.amount < 0).reduce((s, t) => s + t.amount, 0))

  const statusStyle = (status: string) => {
    const s = status?.toLowerCase()
    if (s === 'completed' || s === 'paid' || s === 'win') return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
    if (s === 'pending' || s === 'processing' || s === 'approved') return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
    if (s === 'failed' || s === 'rejected' || s === 'loss') return 'bg-red-500/20 text-red-400 border-red-500/30'
    return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
  }

  return (
    <main className="min-h-screen bg-[#0a0613] text-white">
      {/* Header */}
      <nav className="border-b border-purple-500/20 bg-[#0d0818]">
        <div className="px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="w-9 h-9 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition">
              <ArrowLeft className="w-4 h-4 text-gray-400" />
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center">
                <Clock className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="font-bold">Transaction History</div>
                <div className="text-[10px] text-gray-500">{user?.email}</div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto p-6">
        {/* Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 border border-emerald-500/30 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-gray-400 font-medium">Total In</span>
              <ArrowDownToLine className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold">${totalIn.toFixed(2)}</div>
          </div>
          <div className="bg-gradient-to-br from-red-500/20 to-red-500/5 border border-red-500/30 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-gray-400 font-medium">Total Out</span>
              <ArrowUpFromLine className="w-4 h-4 text-red-400" />
            </div>
            <div className="text-2xl font-bold">${totalOut.toFixed(2)}</div>
          </div>
          <div className="bg-gradient-to-br from-purple-500/20 to-purple-500/5 border border-purple-500/30 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-gray-400 font-medium">Transactions</span>
              <TrendingUp className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-2xl font-bold">{transactions.length}</div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-4 overflow-x-auto">
          {[
            { id: 'all', label: 'All', icon: Filter },
            { id: 'deposits', label: 'Deposits', icon: ArrowDownToLine },
            { id: 'withdrawals', label: 'Withdrawals', icon: ArrowUpFromLine },
            { id: 'trades', label: 'Trades', icon: TrendingUp },
          ].map((f) => {
            const Icon = f.icon
            return (
              <button key={f.id} onClick={() => setFilter(f.id as any)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 ${
                  filter === f.id ? 'bg-purple-600 text-white' : 'bg-[#0d0818] text-gray-400 hover:bg-[#14141c] border border-purple-500/20'
                }`}>
                <Icon className="w-4 h-4" />
                {f.label}
              </button>
            )
          })}
        </div>

        {/* List */}
        <div className="bg-[#0d0818] border border-purple-500/20 rounded-2xl overflow-hidden">
          {filtered.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-3">
                <Clock className="w-6 h-6 text-gray-500" />
              </div>
              <div className="text-gray-500">No transactions yet</div>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {filtered.map((t: any) => (
                <div key={`${t.kind}-${t.id}`} className="flex items-center justify-between p-4 hover:bg-white/5 transition">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      t.kind === 'deposit' ? 'bg-emerald-500/20' :
                      t.kind === 'withdrawal' ? 'bg-red-500/20' : 'bg-purple-500/20'
                    }`}>
                      {t.kind === 'deposit' && <ArrowDownToLine className="w-4 h-4 text-emerald-400" />}
                      {t.kind === 'withdrawal' && <ArrowUpFromLine className="w-4 h-4 text-red-400" />}
                      {t.kind === 'trade' && <TrendingUp className="w-4 h-4 text-purple-400" />}
                    </div>
                    <div>
                      <div className="font-medium text-sm">{t.type}</div>
                      <div className="text-xs text-gray-500">
                        {new Date(t.date).toLocaleString()}
                        {t.description && ` · ${t.description}`}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`font-bold text-sm ${t.amount >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {t.amount >= 0 ? '+' : ''}${Math.abs(t.amount).toFixed(2)}
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border ${statusStyle(t.status)}`}>
                      {t.status?.toUpperCase()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}