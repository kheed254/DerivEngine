'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#0a0613] text-white">
      <nav className="border-b border-purple-500/20 bg-[#0d0818] sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-3 flex items-center gap-4">
          <Link href="/" className="w-9 h-9 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition">
            <ArrowLeft className="w-4 h-4 text-gray-400" />
          </Link>
          <div>
            <div className="font-bold">Privacy Policy</div>
            <div className="text-[10px] text-gray-500">Last updated: 14 September 2026</div>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-10">
        <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-gray-400 text-sm mb-8">Your privacy matters to us. This policy explains what data we collect and how we use it.</p>

        <Section title="1. Information We Collect">
          <ul className="list-disc pl-6 mt-2 space-y-1 text-gray-300 text-sm">
            <li><strong>Account data</strong>: email address, password (encrypted), username.</li>
            <li><strong>Transaction data</strong>: deposits, withdrawals, trades, phone numbers.</li>
            <li><strong>Technical data</strong>: IP address, device type, browser, session info.</li>
          </ul>
        </Section>

        <Section title="2. How We Use Your Information">
          <ul className="list-disc pl-6 mt-2 space-y-1 text-gray-300 text-sm">
            <li>To operate and secure your account.</li>
            <li>To process deposits, withdrawals, and trades.</li>
            <li>To comply with legal and regulatory requirements.</li>
            <li>To detect and prevent fraud or abuse.</li>
          </ul>
        </Section>

        <Section title="3. Data Sharing">
          We do not sell your personal data. We may share limited data with:
          <ul className="list-disc pl-6 mt-2 space-y-1 text-gray-300 text-sm">
            <li><strong>Safaricom</strong> — to process M-Pesa payments.</li>
            <li><strong>Supabase</strong> — our secure database provider.</li>
            <li><strong>Law enforcement</strong> — when legally required.</li>
          </ul>
        </Section>

        <Section title="4. Data Retention">
          We keep your data as long as your account is active and for a reasonable period afterward to comply with legal obligations. You may request account deletion by contacting us.
        </Section>

        <Section title="5. Security">
          We use industry-standard encryption, hashed passwords, and secure servers. However, no system is 100% secure — please keep your password safe and never share it.
        </Section>

        <Section title="6. Your Rights">
          You have the right to:
          <ul className="list-disc pl-6 mt-2 space-y-1 text-gray-300 text-sm">
            <li>Access a copy of your personal data.</li>
            <li>Request correction of inaccurate data.</li>
            <li>Request deletion of your account.</li>
            <li>Opt out of marketing emails (transactional emails are mandatory).</li>
          </ul>
        </Section>

        <Section title="7. Cookies">
          We use minimal cookies for authentication and security. We do not use third-party tracking or advertising cookies.
        </Section>

        <Section title="8. Children's Privacy">
          DerivEngine is not intended for anyone under 18. We do not knowingly collect data from minors. If we discover a minor has registered, we will close the account.
        </Section>

        <Section title="9. Changes to This Policy">
          We may update this policy from time to time. Material changes will be communicated via email or notice on the Platform.
        </Section>

        <Section title="10. Contact">
          For privacy-related questions, contact us at privacy@derivengine.com.
        </Section>

        <div className="mt-12 pt-6 border-t border-purple-500/20 text-xs text-gray-500">
          By using DerivEngine, you consent to the practices described in this Privacy Policy.
        </div>
      </div>
    </main>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-8">
      <h2 className="text-xl font-bold text-purple-300 mb-3">{title}</h2>
      <div className="text-gray-300 text-sm leading-relaxed">{children}</div>
    </div>
  )
}