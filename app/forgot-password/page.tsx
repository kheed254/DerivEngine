'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/update-password`,
    })

    if (error) {
      setError(error.message)
    } else {
      setMessage('Password reset link sent! Check your email.')
    }
    setLoading(false)
  }

  return (
    <main className="min-h-screen bg-[#f8f9fc] flex items-center justify-center p-4">
      <div className="w-full max-w-[420px] bg-white rounded-3xl shadow-xl shadow-gray-200/50 p-8">
        
        {/* Logo - CHANGED TO DERIVENGINE */}
        <div className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 rounded-lg bg-[#7c3aed] flex items-center justify-center">
            <span className="text-white font-bold text-lg italic">~</span>
          </div>
          <span className="font-bold text-xl text-gray-900 tracking-tight">DerivEngine</span>
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Forgot password</h1>
        <p className="text-sm text-gray-500 mb-6 leading-relaxed">
          Enter your email and we'll send you a reset link.
        </p>

        {/* Form */}
        <form onSubmit={handleReset} className="space-y-4">
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

          {error && <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>}
          {message && <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg text-sm">{message}</div>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-semibold py-3 rounded-xl transition disabled:opacity-50"
          >
            {loading ? 'Sending...' : 'Send reset link'}
          </button>
        </form>

        {/* Footer */}
        <div className="text-center mt-6 text-sm text-gray-500">
          Remembered it?{' '}
          <Link href="/login" className="text-[#7c3aed] font-medium hover:underline">
            Sign in
          </Link>
        </div>

      </div>
    </main>
  )
}