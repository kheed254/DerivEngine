'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import {
  ArrowLeft, ArrowDownToLine, ArrowUpFromLine, TrendingUp,
  Loader2, Filter, Clock, Wallet
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
      <div className="min-h-screen bg-[#f8f9fc] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
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
    if (s === 'completed' || s === 'paid' || s === 'win') return 'bg-emerald-100 text-emerald-700'
    if (s === 'pending' || s === 'processing' || s === 'approved') return 'bg-yellow-100 text-yellow-700'
    if (s === 'failed' || s === 'rejected' || s === 'loss') return 'bg-red-100 text-red-700'
    return 'bg-gray-100 text-gray-700'
  }

  return (
    <main className="min-h-screen bg-[#f8f9fc] text-gray-900 pb-12">
      {/* Header */}
      <nav className="border-b border-gray-200 bg-white sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 md:px-6 py-3 flex items-center gap-4">
          <Link href="/" className="w-9 h-9 rounded-lg bg-gray-50 hover:bg-gray-100 flex items-center justify-center transition border border-gray-200">
            <ArrowLeft className="w-4 h-4 text-gray-600" />
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center shadow-sm">
              <Clock className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-bold text-gray-900">Transaction History</div>
              <div className="text-[10px] text-gray-500">{user?.email}</div>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 md:px-6 pt-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-gray-500 font-bold tracking-wider">TOTAL IN</span>
              <ArrowDownToLine className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900">${totalIn.toFixed(2)}</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-gray-500 font-bold tracking-wider">TOTAL OUT</span>
              <ArrowUpFromLine className="w-4 h-4 text-red-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900">${totalOut.toFixed(2)}</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-gray-500 font-bold tracking-wider">TRANSACTIONS</span>
              <TrendingUp className="w-4 h-4 text-purple-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{transactions.length}</div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
          {[
            { id: 'all', label: 'All', icon: Filter },
            { id: 'deposits', label: 'Deposits', icon: ArrowDownToLine },
            { id: 'withdrawals', label: 'Withdrawals', icon: ArrowUpFromLine },
            { id: 'trades', label: 'Trades', icon: TrendingUp },
          ].map((f) => {
            const Icon = f.icon
            return (
              <button key={f.id} onClick={() => setFilter(f.id as any)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition flex items-center gap-2 whitespace-nowrap ${
                  filter === f.id ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                }`}>
                <Icon className="w-4 h-4" />
                {f.label}
              </button>
            )
          })}
        </div>

        {/* List */}
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
          {filtered.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-3">
                <Clock className="w-6 h-6 text-gray-400" />
              </div>
              <div className="text-gray-500 text-sm">No transactions yet</div>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filtered.map((t: any) => (
                <div key={`${t.kind}-${t.id}`} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 hover:bg-gray-50 transition gap-2">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                      t.kind === 'deposit' ? 'bg-emerald-50' :
                      t.kind === 'withdrawal' ? 'bg-red-50' : 'bg-purple-50'
                    }`}>
                      {t.kind === 'deposit' && <ArrowDownToLine className="w-4 h-4 text-emerald-600" />}
                      {t.kind === 'withdrawal' && <ArrowUpFromLine className="w-4 h-4 text-red-600" />}
                      {t.kind === 'trade' && <TrendingUp className="w-4 h-4 text-purple-600" />}
                    </div>
                    <div>
                      <div className="font-semibold text-sm text-gray-900">{t.type}</div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {new Date(t.date).toLocaleString()}
                        {t.description && ` · ${t.description}`}
                      </div>
                    </div>
                  </div>
                  <div className="text-left sm:text-right flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 sm:gap-1 pl-13 sm:pl-0">
                    <div className={`font-bold text-sm ${t.amount >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {t.amount >= 0 ? '+' : ''}${Math.abs(t.amount).toFixed(2)}
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${statusStyle(t.status)}`}>
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