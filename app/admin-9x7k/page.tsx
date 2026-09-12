'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import {
  Shield, Users, ArrowDownToLine, ArrowUpFromLine, TrendingUp, LogOut,
  Loader2, DollarSign, Activity, Check, X, RefreshCw, Ban
} from 'lucide-react'

export default function AdminPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [userEmail, setUserEmail] = useState('')
  const [userName, setUserName] = useState('')
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'deposits' | 'withdrawals' | 'trades'>('overview')

  // Data
  const [stats, setStats] = useState({ users: 0, deposits: 0, withdrawals: 0, profit: 0, pendingWithdrawals: 0 })
  const [users, setUsers] = useState<any[]>([])
  const [deposits, setDeposits] = useState<any[]>([])
  const [withdrawals, setWithdrawals] = useState<any[]>([])
  const [trades, setTrades] = useState<any[]>([])
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return }
      setUserEmail(session.user.email || '')

      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin, full_name')
        .eq('id', session.user.id)
        .single()

      if (!profile?.is_admin) { router.push('/'); return }
      setUserName(profile.full_name || session.user.email || '')
      setIsAdmin(true)
      setLoading(false)
      loadAllData()
    }
    checkAdmin()
  }, [router])

  const loadAllData = async () => {
    setRefreshing(true)
    try {
      // Load all users
      const { data: usersData } = await supabase.from('profiles').select('*')
      const { data: balancesData } = await supabase.from('balances').select('*')

      const mergedUsers = (usersData || []).map((u: any) => {
        const bal = (balancesData || []).find((b: any) => b.user_id === u.id)
        return {
          ...u,
          demo_balance: bal?.demo_balance || 0,
          live_balance: bal?.live_balance || 0,
        }
      })
      setUsers(mergedUsers)

      // Load deposits
      const { data: depositsData } = await supabase
        .from('deposits')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100)
      setDeposits(depositsData || [])

      // Load withdrawals
      const { data: withdrawalsData } = await supabase
        .from('withdrawals')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100)
      setWithdrawals(withdrawalsData || [])

      // Load trades
      const { data: tradesData } = await supabase
        .from('trades')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100)
      setTrades(tradesData || [])

      // Compute stats
      const totalDeposits = (depositsData || [])
        .filter((d: any) => d.status === 'completed')
        .reduce((sum: number, d: any) => sum + Number(d.amount), 0)

      const totalWithdrawals = (withdrawalsData || [])
        .filter((w: any) => w.status === 'paid' || w.status === 'approved')
        .reduce((sum: number, w: any) => sum + Number(w.amount), 0)

      const pendingWithdrawals = (withdrawalsData || [])
        .filter((w: any) => w.status === 'pending').length

      // Platform P&L = sum of all negative user payouts (when users lose)
      const platformPnL = (tradesData || []).reduce((sum: number, t: any) => {
        return sum + (t.result === 'LOSS' ? Number(t.stake) : -Number(t.payout - t.stake))
      }, 0)

      setStats({
        users: mergedUsers.length,
        deposits: totalDeposits,
        withdrawals: totalWithdrawals,
        profit: platformPnL,
        pendingWithdrawals,
      })
    } catch (err) {
      console.error('❌ Load error:', err)
    }
    setRefreshing(false)
  }

  const handleWithdrawal = async (id: string, action: 'approve' | 'reject') => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const wd = withdrawals.find((w) => w.id === id)
      if (!wd || !session) return

      if (action === 'approve') {
        await supabase.from('withdrawals').update({ status: 'approved' }).eq('id', id)
        // Note: Real M-Pesa B2C payout would be triggered here
      } else {
        // Reject — refund user's live balance
        const { data: bal } = await supabase
          .from('balances')
          .select('live_balance')
          .eq('user_id', wd.user_id)
          .single()

        const refunded = Number(bal?.live_balance || 0) + Number(wd.amount)
        await supabase.from('balances').update({ live_balance: refunded }).eq('user_id', wd.user_id)
        await supabase.from('withdrawals').update({ status: 'rejected' }).eq('id', id)
      }

      // Log admin action
      await supabase.from('admin_logs').insert({
        admin_id: session.user.id,
        action: `withdrawal_${action}`,
        target_type: 'withdrawal',
        target_id: id,
        details: { amount: wd.amount, user_id: wd.user_id },
      })

      loadAllData()
    } catch (err) {
      console.error('❌ Withdrawal action error:', err)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0613] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
      </div>
    )
  }
  if (!isAdmin) return null

  const tabs = [
    { id: 'overview', label: 'Overview', icon: TrendingUp },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'deposits', label: 'Deposits', icon: ArrowDownToLine },
    { id: 'withdrawals', label: 'Withdrawals', icon: ArrowUpFromLine },
    { id: 'trades', label: 'Trades', icon: TrendingUp },
  ] as const

  const statusBadge = (status: string) => {
    const colors: { [key: string]: string } = {
      pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      processing: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      completed: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      approved: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      paid: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      failed: 'bg-red-500/20 text-red-400 border-red-500/30',
      rejected: 'bg-red-500/20 text-red-400 border-red-500/30',
    }
    return (
      <span className={`text-[10px] px-2 py-0.5 rounded-full border ${colors[status] || 'bg-gray-500/20 text-gray-400 border-gray-500/30'}`}>
        {status.toUpperCase()}
      </span>
    )
  }

  return (
    <main className="min-h-screen bg-[#0a0613] text-white">
      <nav className="border-b border-purple-500/20 bg-[#0d0818]">
        <div className="px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-bold">Admin Dashboard</div>
              <div className="text-[10px] text-gray-500">DerivEngine Control Panel</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={loadAllData} disabled={refreshing} className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center">
              <RefreshCw className={`w-4 h-4 text-gray-400 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-purple-500/10 border border-purple-500/30 text-xs">
              <span className="text-purple-400 font-medium">👤 {userEmail}</span>
            </div>
            <button onClick={handleLogout} className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center">
              <LogOut className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </div>
      </nav>

      <div className="border-b border-purple-500/20 bg-[#0d0818] px-6">
        <div className="flex gap-1">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-3 text-sm font-medium flex items-center gap-2 transition border-b-2 ${
                  activeTab === tab.id ? 'border-purple-500 text-purple-300' : 'border-transparent text-gray-400 hover:text-white'
                }`}>
                <Icon className="w-4 h-4" />
                {tab.label}
                {tab.id === 'withdrawals' && stats.pendingWithdrawals > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 rounded-full bg-yellow-500 text-black text-[10px] font-bold">
                    {stats.pendingWithdrawals}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      <div className="p-6">
        {/* OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard label="Total Users" value={String(stats.users)} icon={Users} color="purple" />
              <StatCard label="Total Deposits" value={`$${stats.deposits.toFixed(2)}`} icon={ArrowDownToLine} color="emerald" />
              <StatCard label="Total Withdrawals" value={`$${stats.withdrawals.toFixed(2)}`} icon={ArrowUpFromLine} color="blue" />
              <StatCard label="Platform P&L" value={`$${stats.profit.toFixed(2)}`} icon={TrendingUp} color={stats.profit >= 0 ? 'emerald' : 'red'} />
            </div>

            {stats.pendingWithdrawals > 0 && (
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                    <ArrowUpFromLine className="w-5 h-5 text-yellow-400" />
                  </div>
                  <div>
                    <div className="font-bold text-yellow-300">{stats.pendingWithdrawals} pending withdrawal{stats.pendingWithdrawals > 1 ? 's' : ''}</div>
                    <div className="text-xs text-gray-400">Review and approve in the Withdrawals tab</div>
                  </div>
                </div>
                <button onClick={() => setActiveTab('withdrawals')} className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-black rounded-lg text-sm font-bold">
                  Review Now
                </button>
              </div>
            )}

            <div className="bg-[#0d0818] border border-purple-500/20 rounded-2xl p-6">
              <h3 className="font-bold mb-3">Recent Activity</h3>
              <div className="space-y-2">
                {deposits.slice(0, 5).map((d: any) => (
                  <div key={d.id} className="flex items-center justify-between text-sm py-2 border-b border-white/5 last:border-0">
                    <div className="flex items-center gap-2">
                      <span className="text-emerald-400">💰</span>
                      <span className="text-gray-300">Deposit</span>
                      <span className="text-gray-500 text-xs">{d.method}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold">${Number(d.amount).toFixed(2)}</span>
                      {statusBadge(d.status)}
                    </div>
                  </div>
                ))}
                {deposits.length === 0 && <div className="text-gray-500 text-sm">No deposits yet</div>}
              </div>
            </div>
          </div>
        )}

        {/* USERS */}
        {activeTab === 'users' && (
          <div className="bg-[#0d0818] border border-purple-500/20 rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-purple-500/20">
              <h3 className="font-bold">All Users ({users.length})</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-black/30 text-gray-400 text-xs">
                  <tr>
                    <th className="text-left px-4 py-3">Full Name</th>
                    <th className="text-left px-4 py-3">User ID</th>
                    <th className="text-right px-4 py-3">Demo Balance</th>
                    <th className="text-right px-4 py-3">Live Balance</th>
                    <th className="text-center px-4 py-3">Admin</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u: any) => (
                    <tr key={u.id} className="border-t border-white/5 hover:bg-white/5">
                      <td className="px-4 py-3">{u.full_name || '—'}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs font-mono">{u.id.slice(0, 12)}...</td>
                      <td className="px-4 py-3 text-right">${Number(u.demo_balance).toFixed(2)}</td>
                      <td className="px-4 py-3 text-right text-emerald-400 font-bold">${Number(u.live_balance).toFixed(2)}</td>
                      <td className="px-4 py-3 text-center">
                        {u.is_admin ? <span className="text-purple-400">✓</span> : '—'}
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 && (
                    <tr><td colSpan={5} className="text-center py-8 text-gray-500">No users yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* DEPOSITS */}
        {activeTab === 'deposits' && (
          <div className="bg-[#0d0818] border border-purple-500/20 rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-purple-500/20">
              <h3 className="font-bold">Deposits ({deposits.length})</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-black/30 text-gray-400 text-xs">
                  <tr>
                    <th className="text-left px-4 py-3">Date</th>
                    <th className="text-left px-4 py-3">Method</th>
                    <th className="text-left px-4 py-3">Phone/Address</th>
                    <th className="text-right px-4 py-3">Amount</th>
                    <th className="text-left px-4 py-3">Reference</th>
                    <th className="text-center px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {deposits.map((d: any) => (
                    <tr key={d.id} className="border-t border-white/5 hover:bg-white/5">
                      <td className="px-4 py-3 text-xs text-gray-400">{new Date(d.created_at).toLocaleString()}</td>
                      <td className="px-4 py-3 uppercase text-xs">{d.method}</td>
                      <td className="px-4 py-3 text-xs font-mono">{d.phone || d.crypto_address || '—'}</td>
                      <td className="px-4 py-3 text-right font-bold">${Number(d.amount).toFixed(2)}</td>
                      <td className="px-4 py-3 text-xs font-mono text-gray-500">{(d.reference || '—').slice(0, 20)}</td>
                      <td className="px-4 py-3 text-center">{statusBadge(d.status)}</td>
                    </tr>
                  ))}
                  {deposits.length === 0 && (
                    <tr><td colSpan={6} className="text-center py-8 text-gray-500">No deposits yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* WITHDRAWALS */}
        {activeTab === 'withdrawals' && (
          <div className="bg-[#0d0818] border border-purple-500/20 rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-purple-500/20">
              <h3 className="font-bold">Withdrawals ({withdrawals.length})</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-black/30 text-gray-400 text-xs">
                  <tr>
                    <th className="text-left px-4 py-3">Date</th>
                    <th className="text-left px-4 py-3">Method</th>
                    <th className="text-left px-4 py-3">Destination</th>
                    <th className="text-right px-4 py-3">Amount</th>
                    <th className="text-center px-4 py-3">Status</th>
                    <th className="text-center px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {withdrawals.map((w: any) => (
                    <tr key={w.id} className="border-t border-white/5 hover:bg-white/5">
                      <td className="px-4 py-3 text-xs text-gray-400">{new Date(w.created_at).toLocaleString()}</td>
                      <td className="px-4 py-3 uppercase text-xs">{w.method}</td>
                      <td className="px-4 py-3 text-xs font-mono">{w.phone || w.crypto_address || '—'}</td>
                      <td className="px-4 py-3 text-right font-bold">${Number(w.amount).toFixed(2)}</td>
                      <td className="px-4 py-3 text-center">{statusBadge(w.status)}</td>
                      <td className="px-4 py-3 text-center">
                        {w.status === 'pending' ? (
                          <div className="flex gap-2 justify-center">
                            <button onClick={() => handleWithdrawal(w.id, 'approve')}
                              className="w-8 h-8 rounded-lg bg-emerald-500 hover:bg-emerald-600 flex items-center justify-center transition">
                              <Check className="w-4 h-4 text-white" />
                            </button>
                            <button onClick={() => handleWithdrawal(w.id, 'reject')}
                              className="w-8 h-8 rounded-lg bg-red-500 hover:bg-red-600 flex items-center justify-center transition">
                              <X className="w-4 h-4 text-white" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-500">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {withdrawals.length === 0 && (
                    <tr><td colSpan={6} className="text-center py-8 text-gray-500">No withdrawals yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TRADES */}
        {activeTab === 'trades' && (
          <div className="bg-[#0d0818] border border-purple-500/20 rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-purple-500/20">
              <h3 className="font-bold">Trades ({trades.length})</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-black/30 text-gray-400 text-xs">
                  <tr>
                    <th className="text-left px-4 py-3">Date</th>
                    <th className="text-left px-4 py-3">Market</th>
                    <th className="text-left px-4 py-3">Prediction</th>
                    <th className="text-right px-4 py-3">Stake</th>
                    <th className="text-right px-4 py-3">Payout</th>
                    <th className="text-center px-4 py-3">Result</th>
                  </tr>
                </thead>
                <tbody>
                  {trades.map((t: any) => (
                    <tr key={t.id} className="border-t border-white/5 hover:bg-white/5">
                      <td className="px-4 py-3 text-xs text-gray-400">{new Date(t.created_at).toLocaleString()}</td>
                      <td className="px-4 py-3 text-xs">{t.market}</td>
                      <td className="px-4 py-3 text-xs">{t.prediction}</td>
                      <td className="px-4 py-3 text-right">${Number(t.stake).toFixed(2)}</td>
                      <td className={`px-4 py-3 text-right font-bold ${Number(t.payout) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        ${Number(t.payout).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${t.result === 'WIN' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                          {t.result}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {trades.length === 0 && (
                    <tr><td colSpan={6} className="text-center py-8 text-gray-500">No trades yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}

// ─── Stat Card Component ───
function StatCard({ label, value, icon: Icon, color }: { label: string; value: string; icon: any; color: string }) {
  const colors: { [key: string]: string } = {
    purple: 'from-purple-500/20 to-purple-500/5 border-purple-500/30',
    emerald: 'from-emerald-500/20 to-emerald-500/5 border-emerald-500/30',
    blue: 'from-blue-500/20 to-blue-500/5 border-blue-500/30',
    red: 'from-red-500/20 to-red-500/5 border-red-500/30',
  }
  const iconColors: { [key: string]: string } = {
    purple: 'text-purple-400',
    emerald: 'text-emerald-400',
    blue: 'text-blue-400',
    red: 'text-red-400',
  }
  return (
    <div className={`bg-gradient-to-br ${colors[color]} border rounded-2xl p-5`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-gray-400 font-medium">{label}</span>
        <Icon className={`w-4 h-4 ${iconColors[color]}`} />
      </div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  )
}