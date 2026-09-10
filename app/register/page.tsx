'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function RegisterPage() {
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [country, setCountry] = useState('Kenya')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          phone: phone,
          country: country,
        },
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/login')
    }
  }

  return (
    <main className="min-h-screen bg-[#0a0613] flex items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-[#0d0818] rounded-3xl border border-purple-500/20 overflow-hidden shadow-2xl">
        <div className="grid grid-cols-1 md:grid-cols-2">

          {/* LEFT PANEL - Purple Gradient */}
          <div className="relative bg-gradient-to-br from-purple-500 via-purple-600 to-purple-700 p-10 flex flex-col items-center justify-center text-center min-h-[500px]">
            {/* Logo */}
            <div className="mb-6">
              <div className="text-5xl mb-3">📈</div>
              <h1 className="text-white text-2xl font-bold">DerivEngine</h1>
            </div>

            {/* Welcome Text */}
            <h2 className="text-white text-2xl font-bold mb-3">Welcome back!</h2>
            <p className="text-purple-100 text-sm mb-8 max-w-xs">
              Already trading with us? Sign in to your account.
            </p>

            {/* Sign in Button */}
            <Link
              href="/login"
              className="px-10 py-3 border-2 border-white text-white font-medium rounded-full hover:bg-white hover:text-purple-600 transition"
            >
              Sign in
            </Link>
          </div>

          {/* RIGHT PANEL - Form */}
          <div className="bg-[#0d0818] p-10">
            <h2 className="text-white text-2xl font-bold mb-1">Create account</h2>
            <p className="text-gray-400 text-sm mb-6">Start trading in minutes.</p>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm p-3 rounded-lg mb-4">
                {error}
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-3">
              <input
                type="text"
                placeholder="Full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-[#150d24] text-white rounded-lg px-4 py-3.5 outline-none border border-purple-500/20 focus:border-purple-500/50 transition text-sm placeholder-gray-500"
                required
              />

              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#150d24] text-white rounded-lg px-4 py-3.5 outline-none border border-purple-500/20 focus:border-purple-500/50 transition text-sm placeholder-gray-500"
                required
              />

              <input
                type="tel"
                placeholder="Phone number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-[#150d24] text-white rounded-lg px-4 py-3.5 outline-none border border-purple-500/20 focus:border-purple-500/50 transition text-sm placeholder-gray-500"
              />

              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#150d24] text-white rounded-lg px-4 py-3.5 outline-none border border-purple-500/20 focus:border-purple-500/50 transition text-sm placeholder-gray-500"
                required
                minLength={6}
              />

              <div>
                <input
                  type="text"
                  placeholder="🇰🇪 Kenya"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full bg-[#150d24] text-white rounded-lg px-4 py-3.5 outline-none border border-purple-500/20 focus:border-purple-500/50 transition text-sm placeholder-gray-500"
                  required
                />
                <p className="text-xs text-gray-500 mt-1.5">This sets your deposit & withdrawal options.</p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-purple-600 hover:bg-purple-700 rounded-lg font-bold text-white transition disabled:opacity-50 text-sm mt-2"
              >
                {loading ? 'Creating account...' : 'Create account'}
              </button>
            </form>

            <p className="text-center text-sm text-gray-400 mt-5">
              Already have an account?{' '}
              <Link href="/login" className="text-purple-400 hover:underline">
                Sign in
              </Link>
            </p>
          </div>

        </div>
      </div>
    </main>
  )
}