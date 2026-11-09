'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { 
  ChevronDown, LogOut, Wallet, ArrowDownToLine, ArrowUpFromLine, 
  TrendingUp, History, Gift, BarChart3, ShieldCheck, Copy, Check,
  Sun, Moon, Mail, Globe, Hash, Calendar, Phone, AlertCircle
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
        router.push('/login') // Redirect if not logged in
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
  const memberSince = user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'October 2026'
  const userEmail = user?.email || 'user@example.com'
  const fullName = user?.user_metadata?.full_name || userEmail.split('@')[0].toUpperCase()
  const phoneNumber = user?.user_metadata?.phone || user?.phone || null

  return (
    <main className={`min-h-screen pb-20 flex flex-col ${isDark ? 'bg-[#0a0613] text-white' : 'bg-[#f8f9fc] text-gray-900'}`}>
      
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
              <Link href="/history" className={`px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 flex items-center gap-2 ${isDark ? 'text-gray-400 hover:bg-white/5' : 'text-gray-500'}`}>
                <History className="w-4 h-4" /> History
              </Link>
              <button className={`px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 flex items-center gap-2 ${isDark ? 'text-gray-400 hover:bg-white/5' : 'text-gray-500'}`}>
                <Gift className="w-4 h-4" /> Refer
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-shrink-0">
            <div className={`hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs border ${isDark ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-600'}`}>
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
              <span className="font-medium tracking-wide">LIVE ACCOUNT</span>
              <span className="opacity-50 ml-1">|</span>
              <span>{accountNumber}</span>
            </div>

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
                      </div>
                    </button>
                  </div>
                </>
              )}
            </div>

            <button className="hidden md:flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold bg-purple-600 text-white hover:bg-purple-700 transition">
              <ArrowUpFromLine className="w-4 h-4" /> Withdraw
            </button>

            <Link href="/profile" className="w-9 h-9 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold text-sm hover:bg-purple-700 transition">
              {userInitial}
            </Link>
            
            <button onClick={() => setTheme(isDark ? 'light' : 'dark')} className={`w-9 h-9 rounded-full flex items-center justify-center transition hidden md:flex ${isDark ? 'bg-white/5 text-gray-400 hover:bg-white/10' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            
            <button onClick={handleLogout} className={`w-9 h-9 rounded-full flex items-center justify-center transition hidden md:flex ${isDark ? 'bg-white/5 text-gray-400 hover:bg-white/10' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </nav>

      {/* ── MAIN CONTENT ───────────────────────────── */}
      <div className="flex-1 px-4 md:px-6 py-6 max-w-2xl mx-auto w-full space-y-4">
        
        {/* Profile Header Card */}
        <div className={`rounded-3xl border p-6 ${isDark ? 'bg-[#130a21] border-[#2a1b40]' : 'bg-white border-gray-200'}`}>
          <div className="flex items-start gap-4 mb-6">
            <div className="w-16 h-16 rounded-2xl bg-purple-600 flex items-center justify-center text-white font-bold text-2xl shadow-lg shadow-purple-500/30">
              {userInitial}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className={`text-xl font-bold truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>{fullName}</h2>
              <p className={`text-sm truncate ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{userEmail}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs font-bold text-gray-400">ACCOUNT NO.</span>
                <span className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{accountNumber}</span>
                <button onClick={() => copyToClipboard(accountNumber)} className="text-gray-400 hover:text-gray-600">
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>
          <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${isLiveMode ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20'}`}>
            <ShieldCheck className="w-3.5 h-3.5" /> {isLiveMode ? 'Live account' : 'Demo account'}
          </div>
        </div>

        {/* Account Details */}
        <div className={`rounded-3xl border p-6 ${isDark ? 'bg-[#130a21] border-[#2a1b40]' : 'bg-white border-gray-200'}`}>
          <h3 className={`font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>Account details</h3>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? 'bg-[#1f1433]' : 'bg-gray-100'}`}>
                <Mail className="w-4 h-4 text-gray-400" />
              </div>
              <div>
                <div className="text-xs text-gray-500 font-semibold">EMAIL</div>
                <div className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{userEmail}</div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? 'bg-[#1f1433]' : 'bg-gray-100'}`}>
                <Globe className="w-4 h-4 text-gray-400" />
              </div>
              <div>
                <div className="text-xs text-gray-500 font-semibold">COUNTRY</div>
                <div className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>🇰🇪 Kenya</div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? 'bg-[#1f1433]' : 'bg-gray-100'}`}>
                <Hash className="w-4 h-4 text-gray-400" />
              </div>
              <div>
                <div className="text-xs text-gray-500 font-semibold">ACCOUNT NUMBER</div>
                <div className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{accountNumber}</div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? 'bg-[#1f1433]' : 'bg-gray-100'}`}>
                <Calendar className="w-4 h-4 text-gray-400" />
              </div>
              <div>
                <div className="text-xs text-gray-500 font-semibold">MEMBER SINCE</div>
                <div className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{memberSince}</div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? 'bg-[#1f1433]' : 'bg-gray-100'}`}>
                <TrendingUp className="w-4 h-4 text-gray-400" />
              </div>
              <div>
                <div className="text-xs text-gray-500 font-semibold">BALANCE</div>
                <div className={`text-sm font-medium text-emerald-500`}>${balance.toFixed(2)}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Phone Number */}
        <div className={`rounded-3xl border p-6 ${isDark ? 'bg-[#130a21] border-[#2a1b40]' : 'bg-white border-gray-200'}`}>
          <div className="flex justify-between items-center mb-4">
            <h3 className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Phone number</h3>
            {phoneNumber ? (
              <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                <ShieldCheck className="w-3 h-3" /> Verified
              </div>
            ) : (
              <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-500/10 text-red-500 border border-red-500/20">
                <AlertCircle className="w-3 h-3" /> Missing
              </div>
            )}
          </div>
          <div className="flex items-start gap-4 mb-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? 'bg-[#1f1433]' : 'bg-gray-100'}`}>
              <Phone className="w-4 h-4 text-purple-500" />
            </div>
            <div>
              <div className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {phoneNumber || 'Not set'}
              </div>
              <div className="text-xs text-gray-500 mt-1">Used to authorize your M-Pesa deposits & withdrawals.</div>
            </div>
          </div>
          <button 
            onClick={() => {
              setNewPhoneNumber(phoneNumber || '');
              setIsPhoneModalOpen(true);
            }}
            className={`px-4 py-2 rounded-lg text-sm font-semibold border transition ${isDark ? 'border-[#2a1b40] hover:bg-white/5' : 'border-gray-200 hover:bg-gray-50'}`}
          >
            Change number
          </button>
        </div>

        {/* Logout Button */}
        <button onClick={handleLogout} className={`w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-sm transition ${isDark ? 'bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20' : 'bg-red-50 text-red-500 border border-red-100 hover:bg-red-100'}`}>
          <LogOut className="w-4 h-4" /> Log out
        </button>

      </div>

      {/* CHANGE PHONE MODAL */}
      {isPhoneModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className={`w-full max-w-sm rounded-2xl border p-6 ${isDark ? 'bg-[#0d0818] border-purple-500/20' : 'bg-white border-gray-200'}`}>
            <h3 className={`font-bold text-lg mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>Change Phone Number</h3>
            <div className="mb-4">
              <label className={`text-xs block mb-2 font-semibold ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>New Phone Number</label>
              <input 
                type="tel" 
                value={newPhoneNumber} 
                onChange={(e) => setNewPhoneNumber(e.target.value)} 
                placeholder="0712 345 678"
                className={`w-full rounded-lg px-4 py-3 outline-none border text-sm ${isDark ? 'bg-[#150d24] text-white border-purple-500/20 focus:border-purple-500' : 'bg-gray-50 text-gray-900 border-gray-200 focus:border-purple-500'}`} 
              />
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => setIsPhoneModalOpen(false)} 
                className={`flex-1 py-2.5 rounded-lg font-semibold text-sm ${isDark ? 'bg-[#150d24] text-white' : 'bg-gray-100 text-gray-700'}`}
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