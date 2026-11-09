'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message)
    } else {
      router.push('/')
      router.refresh()
    }
    setLoading(false)
  }

  const handleGoogleLogin = async () => {
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) {
      setError(error.message)
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#f8f9fc] flex items-center justify-center p-4">
      <div className="w-full max-w-[420px] bg-white rounded-3xl shadow-xl shadow-gray-200/50 p-8">
        
        {/* Logo */}
        <div className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 rounded-lg bg-[#7c3aed] flex items-center justify-center">
            <span className="text-white font-bold text-lg italic">~</span>
          </div>
          <span className="font-bold text-xl text-gray-900 tracking-tight">DerivEngine</span>
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome back</h1>
        <p className="text-sm text-gray-500 mb-6 leading-relaxed">
          Sign in to your account to continue.
        </p>

        {/* Google Button */}
        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-700 font-semibold py-3 rounded-xl hover:bg-gray-50 transition mb-6 disabled:opacity-50"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="h-px bg-gray-200 flex-1"></div>
          <span className="text-xs text-gray-400 font-medium">OR</span>
          <div className="h-px bg-gray-200 flex-1"></div>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-[#f8f9fc] border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:border-[#7c3aed] focus:ring-1 focus:ring-[#7c3aed] outline-none transition"
            />
          </div>

          <div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-[#f8f9fc] border border-gray-200 rounded-xl px-4 py-3 pr-10 text-sm text-gray-900 focus:border-[#7c3aed] focus:ring-1 focus:ring-[#7c3aed] outline-none transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <div className="text-right mt-2">
              <Link href="/forgot-password" className="text-xs text-[#7c3aed] hover:text-[#6d28d9] font-medium transition">
                Forgot password?
              </Link>
            </div>
          </div>

          {error && <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-semibold py-3 rounded-xl transition disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        {/* Footer */}
        <div className="text-center mt-6 text-sm text-gray-500">
          Don't have an account?{' '}
          <Link href="/register" className="text-[#7c3aed] font-medium hover:underline">
            Sign up
          </Link>
        </div>

      </div>
    </main>
  )
}