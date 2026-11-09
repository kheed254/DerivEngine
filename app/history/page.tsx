'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { 
  ChevronDown, LogOut, Wallet, ArrowDownToLine, ArrowUpFromLine, 
  TrendingUp, History, Gift, BarChart3, Sun, Moon, ArrowLeft, Search
} from 'lucide-react'

export default function HistoryPage() {
  const [user, setUser] = useState<any>(null)
  const [theme, setTheme] = useState<'dark' | 'light'>('light')
  const [isLiveMode, setIsLiveMode] = useState(true)
  const [liveBalance, setLiveBalance] = useState(0)
  const [demoBalance, setDemoBalance] = useState(10000)
  const [isAccountDropdownOpen, setIsAccountDropdownOpen] = useState(false)
  
  const [trades, setTrades] = useState<any[]>([])
  const [transactions, setTransactions] = useState<any[]>([])
  const [activeMainTab, setActiveMainTab] = useState<'trades' | 'transactions'>('trades')
  const [activeFilter, setActiveFilter] = useState<'All' | 'Rise/Fall' | 'Digits' | 'Multipliers'>('All')

  const isDark = theme === 'dark'
  const balance = isLiveMode ? liveBalance : demoBalance

  // Fetch User & Balances
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setUser(session.user)
        fetchBalances(session.user.id)
        fetchHistory(session.user.id)
      }
    })
  }, [])

  const fetchBalances = async (userId: string) => {
    const { data } = await supabase.from('balances').select('*').eq('user_id', userId).single()
    if (data) {
      setLiveBalance(Number(data.live_balance))
      setDemoBalance(Number(data.demo_balance))
    }
  }

  const fetchHistory = async (userId: string) => {
    // Fetch Trades
    const { data: tradesData } = await supabase
      .from('trades')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    if (tradesData) setTrades(tradesData)

    // Fetch Transactions (Deposits/Withdrawals)
    const { data: txData } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    if (txData) setTransactions(txData)
  }

  // Derived stats
  const totalTrades = trades.length
  const totalWins = trades.filter(t => t.result === 'WIN').length
  const winRate = totalTrades > 0 ? Math.round((totalWins / totalTrades) * 100) : 0
  const netPnl = trades.reduce((sum, t) => sum + Number(t.payout), 0)

  // Filtered trades
  const filteredTrades = trades.filter(t => {
    if (activeFilter === 'All') return true
    if (activeFilter === 'Rise/Fall') return t.trade_type === 'rise-fall'
    if (activeFilter === 'Digits') return t.trade_type === 'digits'
    if (activeFilter === 'Multipliers') return t.trade_type === 'multipliers'
    return true
  })

  const userInitial = user?.email ? user.email[0].toUpperCase() : 'U'
  const accountNumber = user?.id ? `ST-${user.id.slice(0, 6).toUpperCase()}` : 'ST-000000'

  return (
    <main className={`min-h-screen relative overflow-hidden flex flex-col ${isDark ? 'bg-[#0a0613] text-white' : 'bg-[#f8f9fc] text-gray-900'}`}>
      
      {/* Background Gradient & Chart SVG */}
      <div className="absolute inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className={`absolute top-0 right-0 w-[80%] h-[80%] rounded-full blur-[120px] opacity-40 ${isDark ? 'bg-purple-900/20' : 'bg-purple-300/40'}`} />
        <svg className="absolute bottom-0 w-full h-[50vh] opacity-30" viewBox="0 0 100 40" preserveAspectRatio="none">
           <path d="M0,40 L0,30 L10,32 L20,22 L35,28 L50,18 L65,25 L80,15 L100,20 L100,40 Z" fill="url(#grad)" />
           <defs>
             <linearGradient id="grad" x1="0" x2="0" y1="0" y2="1">
               <stop offset="0%" stopColor="#a855f7" stopOpacity="0.5"/>
               <stop offset="100%" stopColor="#a855f7" stopOpacity="0"/>
             </linearGradient>
           </defs>
           <path d="M0,30 L10,32 L20,22 L35,28 L50,18 L65,25 L80,15 L100,20" fill="none" stroke="#a855f7" strokeWidth="0.5" />
        </svg>
      </div>

      {/* ── TOP BAR ───────────────────────────── */}
      <nav className={`border-b sticky top-0 z-30 backdrop-blur-md ${isDark ? 'border-[#1f1433] bg-[#0d0818]/80' : 'border-gray-200 bg-white/80'}`}>
        <div className="px-4 md:px-6 py-2 flex items-center justify-between gap-3 max-w-7xl mx-auto w-full">
          
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2 flex-shrink-0">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center">
                <span className="text-white font-bold text-sm italic">~</span>
              </div>
              <span className={`font-bold text-lg hidden lg:inline ${isDark ? 'text-white' : 'text-gray-900'}`}>SinTrades</span>
            </Link>
            
            <div className="hidden md:flex items-center gap-1">
              <Link href="/" className={`px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 flex items-center gap-2 ${isDark ? 'text-gray-400 hover:bg-white/5' : 'text-gray-500'}`}>
                <BarChart3 className="w-4 h-4" /> Trade
              </Link>
              <button className={`px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 flex items-center gap-2 ${isDark ? 'text-gray-400 hover:bg-white/5' : 'text-gray-500'}`}>
                <Wallet className="w-4 h-4" /> Wallet
              </button>
              <Link href="/history" className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 ${isDark ? 'text-white bg-white/10' : 'text-gray-900 bg-gray-100'}`}>
                <History className="w-4 h-4" /> History
              </Link>
              <button className={`px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 flex items-center gap-2 ${isDark ? 'text-gray-400 hover:bg-white/5' : 'text-gray-500'}`}>
                <Gift className="w-4 h-4" /> Refer
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-shrink-0">
            {/* Live Account Badge */}
            <div className={`hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs border ${isDark ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-600'}`}>
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
              <span className="font-medium tracking-wide">LIVE ACCOUNT</span>
              <span className="opacity-50 ml-1">|</span>
              <span>{accountNumber}</span>
            </div>

            {/* Account Dropdown */}
            <div className="relative hidden md:block">
              <button
                onClick={() => setIsAccountDropdownOpen(!isAccountDropdownOpen)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs border transition ${isDark ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'}`}
              >
                <div className="text-left">
                  <div className={`text-[9px] font-bold tracking-wider uppercase ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>REAL</div>
                  <div className={`font-bold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>${balance.toFixed(2)}</div>
                </div>
                <ChevronDown className={`w-3 h-3 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
              </button>

              {isAccountDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-[90]" onClick={() => setIsAccountDropdownOpen(false)} />
                  <div className={`absolute top-full mt-2 right-0 w-72 rounded-2xl border shadow-2xl z-[100] overflow-hidden ${isDark ? 'bg-[#130a21] border-[#2a1b40]' : 'bg-white border-gray-200'}`}>
                    <div className="px-4 py-2 text-[10px] font-bold tracking-wider text-gray-400">SWITCH ACCOUNT</div>
                    <button onClick={() => { setIsLiveMode(true); setIsAccountDropdownOpen(false) }} className={`w-full flex items-center gap-3 px-4 py-3 transition ${isDark ? 'hover:bg-white/5' : 'hover:bg-gray-50'}`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isLiveMode ? 'bg-purple-100' : 'bg-gray-100'}`}>
                        {isLiveMode ? <span className="text-purple-600 text-sm">✓</span> : <span className="text-gray-400 text-sm">🔒</span>}
                      </div>
                      <div className="flex-1 text-left">
                        <div className="flex items-center justify-between">
                          <span className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>Real account</span>
                          <span className="font-bold text-sm text-purple-600">${liveBalance.toFixed(2)}</span>
                        </div>
                        <div className={`text-[11px] ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>Your live funds</div>
                      </div>
                    </button>
                    <div className={`h-px ${isDark ? 'bg-white/5' : 'bg-gray-100'}`} />
                    <button onClick={() => { setIsLiveMode(false); setIsAccountDropdownOpen(false) }} className={`w-full flex items-center gap-3 px-4 py-3 transition ${isDark ? 'hover:bg-white/5' : 'hover:bg-gray-50'}`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${!isLiveMode ? 'bg-purple-100' : 'bg-gray-100'}`}>
                        {!isLiveMode ? <span className="text-purple-600 text-sm">✓</span> : <span className="text-yellow-500 text-sm">⚠️</span>}
                      </div>
                      <div className="flex-1 text-left">
                        <div className="flex items-center justify-between">
                          <span className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>Demo account</span>
                          <span className="font-bold text-sm text-yellow-500">${demoBalance.toFixed(2)}</span>
                        </div>
                        <div className={`text-[11px] ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>Practice · virtual funds</div>
                      </div>
                    </button>
                  </div>
                </>
              )}
            </div>

            <button className={`hidden md:flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold bg-purple-600 text-white hover:bg-purple-700 transition`}>
              <ArrowUpFromLine className="w-4 h-4" /> Withdraw
            </button>

            <Link href="/profile" className="w-9 h-9 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold text-sm hover:bg-purple-700 transition">
              {userInitial}
            </Link>
            
            <button onClick={() => setTheme(isDark ? 'light' : 'dark')} className={`w-9 h-9 rounded-full flex items-center justify-center transition hidden md:flex ${isDark ? 'bg-white/5 text-gray-400 hover:bg-white/10' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            
            <button className={`w-9 h-9 rounded-full flex items-center justify-center transition hidden md:flex ${isDark ? 'bg-white/5 text-gray-400 hover:bg-white/10' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </nav>

      {/* ── MAIN CONTENT ───────────────────────────── */}
      <div className="flex-1 px-4 md:px-6 py-8 max-w-5xl mx-auto w-full relative z-10">
        
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className={`p-5 rounded-2xl border shadow-sm ${isDark ? 'bg-[#130a21] border-[#2a1b40]' : 'bg-white border-gray-200'}`}>
            <div className={`text-[10px] font-bold tracking-wider mb-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>TRADES</div>
            <div className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{totalTrades}</div>
          </div>
          <div className={`p-5 rounded-2xl border shadow-sm ${isDark ? 'bg-[#130a21] border-[#2a1b40]' : 'bg-white border-gray-200'}`}>
            <div className={`text-[10px] font-bold tracking-wider mb-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>WIN RATE</div>
            <div className={`text-2xl font-bold text-purple-600`}>{winRate}%</div>
          </div>
          <div className={`p-5 rounded-2xl border shadow-sm ${isDark ? 'bg-[#130a21] border-[#2a1b40]' : 'bg-white border-gray-200'}`}>
            <div className={`text-[10px] font-bold tracking-wider mb-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>WINS</div>
            <div className={`text-2xl font-bold text-emerald-500`}>{totalWins}</div>
          </div>
          <div className={`p-5 rounded-2xl border shadow-sm ${isDark ? 'bg-[#130a21] border-[#2a1b40]' : 'bg-white border-gray-200'}`}>
            <div className={`text-[10px] font-bold tracking-wider mb-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>NET P&L</div>
            <div className={`text-2xl font-bold ${netPnl >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
              {netPnl >= 0 ? '' : '-'}${Math.abs(netPnl).toFixed(2)}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 mb-4">
          <button 
            onClick={() => setActiveMainTab('trades')}
            className={`px-6 py-2 rounded-xl text-sm font-semibold transition ${activeMainTab === 'trades' ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20' : isDark ? 'bg-[#130a21] text-gray-400 border border-[#2a1b40]' : 'bg-gray-100 text-gray-500'}`}
          >
            Trades
          </button>
          <button 
            onClick={() => setActiveMainTab('transactions')}
            className={`px-6 py-2 rounded-xl text-sm font-semibold transition ${activeMainTab === 'transactions' ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20' : isDark ? 'bg-[#130a21] text-gray-400 border border-[#2a1b40]' : 'bg-gray-100 text-gray-500'}`}
          >
            Transactions
          </button>
        </div>

        {/* Main Card */}
        <div className={`rounded-3xl border shadow-xl shadow-gray-200/20 overflow-hidden ${isDark ? 'bg-[#130a21] border-[#2a1b40]' : 'bg-white border-gray-200'}`}>
          
          {/* Card Header */}
          <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 border-b gap-4 ${isDark ? 'border-[#2a1b40]' : 'border-gray-100'}`}>
            <h2 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {activeMainTab === 'trades' ? 'Trade history' : 'Transaction history'}
            </h2>
            
            {/* Filters (Only for Trades) */}
            {activeMainTab === 'trades' && (
              <div className={`flex items-center p-1 rounded-xl border ${isDark ? 'bg-[#1a1126] border-[#2a1b40]' : 'bg-gray-50 border-gray-200'}`}>
                {['All', 'Rise/Fall', 'Digits', 'Multipliers'].map((f) => (
                  <button
                    key={f}
                    onClick={() => setActiveFilter(f as any)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${activeFilter === f ? (isDark ? 'bg-[#2a1b40] text-white' : 'bg-white text-gray-900 shadow-sm border border-gray-200') : (isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-700')}`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Table Content */}
          <div className="p-0">
            {activeMainTab === 'trades' ? (
              filteredTrades.length === 0 ? (
                <div className={`py-16 text-center text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                  No trades here yet. Head to the terminal and place your first trade.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className={`text-xs font-semibold ${isDark ? 'text-gray-400 bg-white/5' : 'text-gray-500 bg-gray-50'}`}>
                      <tr>
                        <th className="px-5 py-3">Time</th>
                        <th className="px-5 py-3">Market</th>
                        <th className="px-5 py-3">Type</th>
                        <th className="px-5 py-3">Stake</th>
                        <th className="px-5 py-3">Result</th>
                        <th className="px-5 py-3 text-right">P&L</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${isDark ? 'divide-white/5' : 'divide-gray-100'}`}>
                      {filteredTrades.map((t) => (
                        <tr key={t.id} className={isDark ? 'hover:bg-white/5' : 'hover:bg-gray-50'}>
                          <td className={`px-5 py-4 whitespace-nowrap ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{new Date(t.created_at).toLocaleTimeString()}</td>
                          <td className={`px-5 py-4 whitespace-nowrap font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{t.market.replace('Volatility ', 'V').replace(' Index', '')}</td>
                          <td className={`px-5 py-4 whitespace-nowrap ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{t.prediction}</td>
                          <td className={`px-5 py-4 whitespace-nowrap ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>${Number(t.stake).toFixed(2)}</td>
                          <td className="px-5 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold ${t.result === 'WIN' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                              {t.result}
                            </span>
                          </td>
                          <td className={`px-5 py-4 whitespace-nowrap text-right font-bold ${Number(t.payout) >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                            {Number(t.payout) >= 0 ? '+' : ''}${Number(t.payout).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            ) : (
              transactions.length === 0 ? (
                <div className={`py-16 text-center text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                  No transactions found.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className={`text-xs font-semibold ${isDark ? 'text-gray-400 bg-white/5' : 'text-gray-500 bg-gray-50'}`}>
                      <tr>
                        <th className="px-5 py-3">Date</th>
                        <th className="px-5 py-3">Description</th>
                        <th className="px-5 py-3">Type</th>
                        <th className="px-5 py-3 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${isDark ? 'divide-white/5' : 'divide-gray-100'}`}>
                      {transactions.map((tx) => (
                        <tr key={tx.id} className={isDark ? 'hover:bg-white/5' : 'hover:bg-gray-50'}>
                          <td className={`px-5 py-4 whitespace-nowrap ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{new Date(tx.created_at).toLocaleDateString()}</td>
                          <td className={`px-5 py-4 whitespace-nowrap font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{tx.description}</td>
                          <td className="px-5 py-4 whitespace-nowrap capitalize">
                             <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold ${tx.type === 'deposit' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-orange-500/10 text-orange-500'}`}>
                              {tx.type}
                            </span>
                          </td>
                          <td className={`px-5 py-4 whitespace-nowrap text-right font-bold ${Number(tx.amount) >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                            {Number(tx.amount) >= 0 ? '+' : ''}${Number(tx.amount).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            )}
          </div>
        </div>

        {/* Footer Disclaimer */}
        <p className={`text-center text-[10px] mt-8 max-w-2xl mx-auto leading-relaxed ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
          Trading synthetic indices carries risk and may not be suitable for everyone. Only trade with money you can afford to lose. Past results don't guarantee future outcomes.
        </p>
      </div>
    </main>
  )
}