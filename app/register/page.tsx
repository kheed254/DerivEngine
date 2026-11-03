'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff } from 'lucide-react'

export default function RegisterPage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [referral, setReferral] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          phone: phone,
          referral: referral,
          country: 'KE'
        },
      },
    })

    if (error) {
      setError(error.message)
    } else {
      router.push('/')
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <main className="min-h-screen bg-[#f0f2f5] flex items-center justify-center p-4">
      <div className="w-full max-w-[1000px] bg-white rounded-3xl shadow-2xl shadow-gray-300/50 overflow-hidden flex flex-col md:flex-row">
        
        {/* LEFT PANEL (Purple) */}
        <div className="w-full md:w-[40%] bg-gradient-to-br from-purple-500 to-purple-700 p-10 flex flex-col items-center justify-center text-center relative overflow-hidden">
          {/* Decorative background blur */}
          <div className="absolute top-0 left-0 w-full h-full bg-white/5 opacity-50"></div>
          
          <div className="relative z-10">
            <div className="w-12 h-12 rounded-full border-2 border-white/30 flex items-center justify-center mx-auto mb-6">
              <span className="text-white font-bold text-2xl italic">~</span>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">DerivEngine</h2>
            <h3 className="text-xl font-semibold text-white/90 mb-3">Welcome back!</h3>
            <p className="text-sm text-white/70 mb-8 max-w-[200px] mx-auto leading-relaxed">
              Already trading with us? Sign in to your account.
            </p>
            <Link href="/login" className="inline-block px-8 py-2.5 rounded-full border border-white/40 text-white font-medium hover:bg-white/10 transition">
              Sign in
            </Link>
          </div>
        </div>

        {/* RIGHT PANEL (Form) */}
        <div className="w-full md:w-[60%] p-8 md:p-12">
          <div className="max-w-sm mx-auto">
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Create account</h1>
            <p className="text-sm text-gray-500 mb-6">Start trading in minutes.</p>

            {error && <div className="mb-4 p-3 bg-red-50 border border-red-100 text-red-600 rounded-lg text-sm">{error}</div>}

            <form onSubmit={handleRegister} className="space-y-3">
              <div>
                <input
                  type="text"
                  placeholder="Full name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="w-full bg-[#f8f9fc] border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-900 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition"
                />
              </div>

              <div>
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full bg-[#f8f9fc] border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-900 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition"
                />
              </div>

              <div>
                <input
                  type="tel"
                  placeholder="Phone number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  className="w-full bg-[#f8f9fc] border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-900 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition"
                />
              </div>

              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full bg-[#f8f9fc] border border-gray-200 rounded-lg px-4 py-3 pr-10 text-sm text-gray-900 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <div>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm">🇰🇪</span>
                  <select className="w-full bg-[#f8f9fc] border border-gray-200 rounded-lg pl-10 pr-4 py-3 text-sm text-gray-900 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition appearance-none">
                    <option value="KE">Kenya</option>
                  </select>
                </div>
                <p className="text-[10px] text-gray-400 mt-1 ml-1">This sets your deposit & withdrawal options.</p>
              </div>

              <div>
                <input
                  type="text"
                  placeholder="Referral / promo code (optional)"
                  value={referral}
                  onChange={(e) => setReferral(e.target.value)}
                  className="w-full bg-[#f8f9fc] border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-900 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-medium py-3 rounded-lg transition disabled:opacity-50 mt-2"
              >
                {loading ? 'Creating account...' : 'Create account'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </main>
  )
}