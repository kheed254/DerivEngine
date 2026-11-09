'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { 
  ChevronDown, LogOut, Wallet, ArrowDownToLine, ArrowUpFromLine, 
  TrendingUp, History, Gift, BarChart3, ShieldCheck, Copy, Check,
  Sun, Moon, Mail, Globe, Hash, Calendar, Phone
} from 'lucide-react'

export default function ProfilePage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [theme, setTheme] = useState<'dark' | 'light'>('light')
  const [isLiveMode, setIsLiveMode] = useState(true)
  const [liveBalance, setLiveBalance] = useState(0)
  const [demoBalance, setDemoBalance] = useState(10000)
  const [isAccountDropdownOpen, setIsAccountDropdownOpen] = useState(false)
  
  // Modal states
  const [isPhoneModalOpen, setIsPhoneModalOpen] = useState(false)
  const [newPhoneNumber, setNewPhoneNumber] = useState('')
  const [isUpdatingPhone, setIsUpdatingPhone] = useState(false)
  const [copied, setCopied] = useState(false)

  const isDark = theme === 'dark'
  const balance = isLiveMode ? liveBalance : demoBalance

  // Fetch User & Balances
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setUser(session.user)
        fetchBalances(session.user.id)
      } else {
        router.push('/login')
      }
    })
  }, [router])

  const fetchBalances = async (userId: string) => {
    const { data } = await supabase.from('balances').select('*').eq('user_id', userId).single()
    if (data) {
      setLiveBalance(Number(data.live_balance))
      setDemoBalance(Number(data.demo_balance))
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const handleUpdatePhone = async () => {
    if (!newPhoneNumber || newPhoneNumber.length < 10) {
      alert("Please enter a valid phone number")
      return
    }
    setIsUpdatingPhone(true)
    const { error } = await supabase.auth.updateUser({
      data: { phone: newPhoneNumber }
    })
    
    if (error) {
      alert(error.message)
    } else {
      setUser({ ...user, user_metadata: { ...user.user_metadata, phone: newPhoneNumber } })
      setIsPhoneModalOpen(false)
      setNewPhoneNumber('')
    }
    setIsUpdatingPhone(false)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text); setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const userInitial = user?.email ? user.email[0].toUpperCase() : 'U'
  const accountNumber = user?.id ? `ST-${user.id.slice(0, 6).toUpperCase()}` : 'ST-000000'
  const memberSince = user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'September 2026'
  const userEmail = user?.email || 'user@example.com'
  const fullName = user?.user_metadata?.full_name || userEmail.split('@')[0].toUpperCase()
  const phoneNumber = user?.user_metadata?.phone || user?.phone || null

  return (
    <main className="min-h-screen relative overflow-hidden flex flex-col bg-[#f8f9fc] text-gray-900 pb-12">
      
      {/* Background Gradient & Chart SVG */}
      <div className="absolute inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-0 right-0 w-[80%] h-[80%] rounded-full blur-[120px] opacity-40 bg-purple-300/40" />
        <svg className="absolute bottom-0 w-full h-[50vh] opacity-30" viewBox="0 0 100 40" preserveAspectRatio="none">
           <path d="M0,40 L0,30 L10,32 L20,22 L35,28 L50,18 L65,25 L80,15 L100,20 L100,40 Z" fill="url(#grad-profile)" />
           <defs>
             <linearGradient id="grad-profile" x1="0" x2="0" y1="0" y2="1">
               <stop offset="0%" stopColor="#a855f7" stopOpacity="0.5"/>
               <stop offset="100%" stopColor="#a855f7" stopOpacity="0"/>
             </linearGradient>
           </defs>
           <path d="M0,30 L10,32 L20,22 L35,28 L50,18 L65,25 L80,15 L100,20" fill="none" stroke="#a855f7" strokeWidth="0.5" />
        </svg>
      </div>

      {/* ── TOP BAR ───────────────────────────── */}
      <nav className="border-b sticky top-0 z-30 backdrop-blur-md border-gray-200 bg-white/80">
        <div className="px-4 md:px-6 py-2 flex items-center justify-between gap-3 max-w-6xl mx-auto w-full">
          
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2 flex-shrink-0">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center">
                <span className="text-white font-bold text-sm italic">~</span>
              </div>
              <span className="font-bold text-lg hidden lg:inline text-gray-900">SinTrades</span>
            </Link>
            
            <div className="hidden md:flex items-center gap-1">
              <Link href="/" className="px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 flex items-center gap-2 text-gray-500">
                <BarChart3 className="w-4 h-4" /> Trade
              </Link>
              <button className="px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 flex items-center gap-2 text-gray-500">
                <Wallet className="w-4 h-4" /> Wallet
              </button>
              <Link href="/history" className="px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 flex items-center gap-2 text-gray-500">
                <History className="w-4 h-4" /> History
              </Link>
              <button className="px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 flex items-center gap-2 text-gray-500">
                <Gift className="w-4 h-4" /> Refer
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs border bg-emerald-50 border-emerald-200 text-emerald-600">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
              <span className="font-medium tracking-wide">LIVE ACCOUNT</span>
              <span className="opacity-50 ml-1">|</span>
              <span>{accountNumber}</span>
            </div>

            <div className="relative hidden md:block">
              <button
                onClick={() => setIsAccountDropdownOpen(!isAccountDropdownOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs border transition bg-gray-50 border-gray-200 hover:bg-gray-100"
              >
                <div className="text-left">
                  <div className="text-[9px] font-bold tracking-wider uppercase text-gray-500">REAL</div>
                  <div className="font-bold text-sm text-gray-900">${balance.toFixed(2)}</div>
                </div>
                <ChevronDown className="w-3 h-3 text-gray-500" />
              </button>

              {isAccountDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-[90]" onClick={() => setIsAccountDropdownOpen(false)} />
                  <div className="absolute top-full mt-2 right-0 w-72 rounded-2xl border shadow-2xl z-[100] overflow-hidden bg-white border-gray-200">
                    <div className="px-4 py-2 text-[10px] font-bold tracking-wider text-gray-400">SWITCH ACCOUNT</div>
                    <button onClick={() => { setIsLiveMode(true); setIsAccountDropdownOpen(false) }} className="w-full flex items-center gap-3 px-4 py-3 transition hover:bg-gray-50">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isLiveMode ? 'bg-purple-100' : 'bg-gray-100'}`}>
                        {isLiveMode ? <span className="text-purple-600 text-sm">✓</span> : <span className="text-gray-400 text-sm">🔒</span>}
                      </div>
                      <div className="flex-1 text-left">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-sm text-gray-900">Real account</span>
                          <span className="font-bold text-sm text-purple-600">${liveBalance.toFixed(2)}</span>
                        </div>
                      </div>
                    </button>
                    <div className="h-px bg-gray-100" />
                    <button onClick={() => { setIsLiveMode(false); setIsAccountDropdownOpen(false) }} className="w-full flex items-center gap-3 px-4 py-3 transition hover:bg-gray-50">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${!isLiveMode ? 'bg-purple-100' : 'bg-gray-100'}`}>
                        {!isLiveMode ? <span className="text-purple-600 text-sm">✓</span> : <span className="text-yellow-500 text-sm">⚠️</span>}
                      </div>
                      <div className="flex-1 text-left">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-sm text-gray-900">Demo account</span>
                          <span className="font-bold text-sm text-yellow-500">${demoBalance.toFixed(2)}</span>
                        </div>
                      </div>
                    </button>
                  </div>
                </>
              )}
            </div>

            <button className="hidden md:flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold bg-purple-600 text-white hover:bg-purple-700 transition shadow-md shadow-purple-500/20">
              <ArrowDownToLine className="w-4 h-4" /> Deposit
            </button>

            <Link href="/profile" className="w-9 h-9 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold text-sm hover:bg-purple-700 transition ring-2 ring-purple-300 ring-offset-1">
              {userInitial}
            </Link>
            
            <button onClick={() => setTheme(isDark ? 'light' : 'dark')} className="w-9 h-9 rounded-full flex items-center justify-center transition hidden md:flex bg-gray-100 text-gray-500 hover:bg-gray-200">
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            
            <button onClick={handleLogout} className="w-9 h-9 rounded-full flex items-center justify-center transition hidden md:flex bg-gray-100 text-gray-500 hover:bg-gray-200">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </nav>

      {/* ── MAIN CONTENT ───────────────────────────── */}
      <div className="flex-1 px-4 md:px-6 py-6 max-w-5xl mx-auto w-full space-y-4 relative z-10">
        
        {/* Profile Header Card */}
        <div className="rounded-3xl border p-6 bg-white/60 backdrop-blur-xl border-white/40 shadow-xl shadow-gray-200/50">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center text-white font-bold text-2xl shadow-lg shadow-purple-500/30">
                {userInitial}
              </div>
              <div className="flex-1 min-w-0 pt-1">
                <h2 className="text-xl font-bold truncate text-gray-900 uppercase">{fullName}</h2>
                <p className="text-sm truncate text-gray-500">{userEmail}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-[11px] font-bold text-gray-600 bg-white px-2 py-0.5 rounded border border-gray-200">{accountNumber}</span>
                  <button onClick={() => copyToClipboard(accountNumber)} className="text-gray-400 hover:text-gray-600">
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>
            
            <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-200">
              <ShieldCheck className="w-3.5 h-3.5" /> Live account
            </div>
          </div>
        </div>

        {/* Account Details */}
        <div className="rounded-3xl border p-6 bg-white/70 backdrop-blur-xl border-white/40 shadow-xl shadow-gray-200/50">
          <h3 className="font-bold mb-4 text-gray-900">Account details</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex items-center gap-4 bg-white/60 border border-white/60 rounded-xl p-3 shadow-sm">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-white border border-gray-200 shadow-sm">
                <Mail className="w-4 h-4 text-gray-400" />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-0.5">Email</div>
                <div className="text-sm font-semibold truncate text-gray-900">{userEmail}</div>
              </div>
            </div>
            
            <div className="flex items-center gap-4 bg-white/60 border border-white/60 rounded-xl p-3 shadow-sm">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-white border border-gray-200 shadow-sm">
                <Globe className="w-4 h-4 text-gray-400" />
              </div>
              <div>
                <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-0.5">Country</div>
                <div className="text-sm font-semibold text-gray-900">🇰🇪 Kenya</div>
              </div>
            </div>
            
            <div className="flex items-center gap-4 bg-white/60 border border-white/60 rounded-xl p-3 shadow-sm">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-white border border-gray-200 shadow-sm">
                <Hash className="w-4 h-4 text-gray-400" />
              </div>
              <div>
                <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-0.5">Account Number</div>
                <div className="text-sm font-semibold text-gray-900">{accountNumber}</div>
              </div>
            </div>
            
            <div className="flex items-center gap-4 bg-white/60 border border-white/60 rounded-xl p-3 shadow-sm">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-white border border-gray-200 shadow-sm">
                <Calendar className="w-4 h-4 text-gray-400" />
              </div>
              <div>
                <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-0.5">Member Since</div>
                <div className="text-sm font-semibold text-gray-900">{memberSince}</div>
              </div>
            </div>
            
            <div className="flex items-center gap-4 bg-white/60 border border-white/60 rounded-xl p-3 shadow-sm sm:col-span-2 sm:w-1/2 sm:pr-2">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-white border border-gray-200 shadow-sm">
                <TrendingUp className="w-4 h-4 text-gray-400" />
              </div>
              <div>
                <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-0.5">Balance</div>
                <div className="text-sm font-semibold text-emerald-600">${balance.toFixed(2)}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Phone Number */}
        <div className="rounded-3xl border p-6 bg-white/70 backdrop-blur-xl border-white/40 shadow-xl shadow-gray-200/50">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-gray-900">Phone number</h3>
            {phoneNumber && (
              <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-200">
                <ShieldCheck className="w-3 h-3" /> Verified
              </div>
            )}
          </div>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-purple-50 text-purple-600 shadow-sm">
                <Phone className="w-5 h-5" />
              </div>
              <div>
                <div className="text-lg font-bold text-gray-900">
                  {phoneNumber || 'Not set'}
                </div>
                <div className="text-[11px] text-gray-500">Used to authorize your M-Pesa deposits & withdrawals.</div>
              </div>
            </div>
            <button 
              onClick={() => {
                setNewPhoneNumber(phoneNumber || '');
                setIsPhoneModalOpen(true);
              }}
              className="px-4 py-2 rounded-lg text-xs font-semibold border border-gray-200 bg-white hover:bg-gray-50 transition text-gray-700 whitespace-nowrap shadow-sm"
            >
              Change number
            </button>
          </div>
        </div>

        {/* Your Trading */}
        <div className="rounded-3xl border p-6 bg-white/70 backdrop-blur-xl border-white/40 shadow-xl shadow-gray-200/50">
          <h3 className="font-bold mb-4 text-gray-900">Your trading</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div className="p-4 rounded-xl border bg-white/60 border-white/60 shadow-sm">
              <div className="text-[10px] text-gray-500 font-bold tracking-wider mb-1">DEPOSITED</div>
              <div className="text-xl font-bold text-gray-900">${liveBalance.toFixed(2)}</div>
            </div>
            <div className="p-4 rounded-xl border bg-white/60 border-white/60 shadow-sm">
              <div className="text-[10px] text-gray-500 font-bold tracking-wider mb-1">WITHDRAWN</div>
              <div className="text-xl font-bold text-yellow-500">$0.00</div>
            </div>
            <div className="p-4 rounded-xl border bg-white/60 border-white/60 shadow-sm">
              <div className="text-[10px] text-gray-500 font-bold tracking-wider mb-1">TRADES</div>
              <div className="text-xl font-bold text-gray-900">0</div>
            </div>
            <div className="p-4 rounded-xl border bg-white/60 border-white/60 shadow-sm">
              <div className="text-[10px] text-gray-500 font-bold tracking-wider mb-1">WIN RATE</div>
              <div className="text-xl font-bold text-purple-600">0%</div>
            </div>
            <div className="p-4 rounded-xl border bg-white/60 border-white/60 shadow-sm">
              <div className="text-[10px] text-gray-500 font-bold tracking-wider mb-1">WINS</div>
              <div className="text-xl font-bold text-emerald-500">0</div>
            </div>
            <div className="p-4 rounded-xl border bg-white/60 border-white/60 shadow-sm">
              <div className="text-[10px] text-gray-500 font-bold tracking-wider mb-1">NET P&L</div>
              <div className="text-xl font-bold text-emerald-500">$0.00</div>
            </div>
          </div>
        </div>

        {/* Logout Button */}
        <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-sm transition bg-red-50/80 backdrop-blur-md text-red-500 border border-red-100 hover:bg-red-100">
          <LogOut className="w-4 h-4" /> Log out
        </button>

      </div>

      {/* CHANGE PHONE MODAL */}
      {isPhoneModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-sm rounded-2xl border p-6 bg-white border-gray-200">
            <h3 className="font-bold text-lg mb-4 text-gray-900">Change Phone Number</h3>
            <div className="mb-4">
              <label className="text-xs block mb-2 font-semibold text-gray-600">New Phone Number</label>
              <input 
                type="tel" 
                value={newPhoneNumber} 
                onChange={(e) => setNewPhoneNumber(e.target.value)} 
                placeholder="0712 345 678"
                className="w-full rounded-lg px-4 py-3 outline-none border text-sm bg-gray-50 text-gray-900 border-gray-200 focus:border-purple-500" 
              />
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => setIsPhoneModalOpen(false)} 
                className="flex-1 py-2.5 rounded-lg font-semibold text-sm bg-gray-100 text-gray-700"
              >
                Cancel
              </button>
              <button 
                onClick={handleUpdatePhone} 
                disabled={isUpdatingPhone}
                className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-lg font-bold text-sm"
              >
                {isUpdatingPhone ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}