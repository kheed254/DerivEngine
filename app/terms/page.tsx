'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#0a0613] text-white">
      <nav className="border-b border-purple-500/20 bg-[#0d0818] sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-3 flex items-center gap-4">
          <Link href="/" className="w-9 h-9 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition">
            <ArrowLeft className="w-4 h-4 text-gray-400" />
          </Link>
          <div>
            <div className="font-bold">Terms of Service</div>
            <div className="text-[10px] text-gray-500">Last updated: 14 September 2026</div>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-10 prose prose-invert">
        <h1 className="text-3xl font-bold mb-2">Terms of Service</h1>
        <p className="text-gray-400 text-sm mb-8">Please read these terms carefully before using DerivEngine.</p>

        <Section title="1. Acceptance of Terms">
          By accessing or using DerivEngine ("the Platform"), you agree to be bound by these Terms of Service. If you do not agree, you must not use the Platform.
        </Section>

        <Section title="2. Eligibility">
          You must be at least 18 years old and legally capable of entering into binding contracts. By using the Platform, you represent and warrant that you meet these requirements. We reserve the right to request proof of age at any time.
        </Section>

        <Section title="3. Account Registration">
          You must create an account to trade. You agree to provide accurate information, keep your credentials secure, and notify us immediately of any unauthorized access. You are responsible for all activity under your account.
        </Section>

        <Section title="4. Trading and Risk">
          Trading volatility indices involves substantial risk. You may lose some or all of your deposited funds. You acknowledge that:
          <ul className="list-disc pl-6 mt-2 space-y-1 text-gray-300">
            <li>Trading is speculative and not suitable for everyone.</li>
            <li>Past performance does not guarantee future results.</li>
            <li>You should only trade with money you can afford to lose.</li>
            <li>You are solely responsible for your trading decisions.</li>
          </ul>
        </Section>

        <Section title="5. Deposits and Withdrawals">
          Deposits are made via M-Pesa or supported cryptocurrency. Withdrawals are processed within 24 hours after admin review. We reserve the right to delay or refuse any withdrawal pending verification or investigation of suspicious activity.
        </Section>

        <Section title="6. Prohibited Activities">
          You agree not to:
          <ul className="list-disc pl-6 mt-2 space-y-1 text-gray-300">
            <li>Use the Platform for money laundering, fraud, or any illegal purpose.</li>
            <li>Attempt to manipulate prices, exploit bugs, or interfere with the Platform.</li>
            <li>Create multiple accounts to abuse promotions or evade bans.</li>
            <li>Use bots, scrapers, or automated tools without our written consent.</li>
          </ul>
        </Section>

        <Section title="7. Account Suspension and Termination">
          We may suspend or terminate your account at any time if we suspect fraud, abuse, or violation of these Terms. In such cases, any pending balance may be forfeited.
        </Section>

        <Section title="8. Limitation of Liability">
          To the maximum extent permitted by law, DerivEngine shall not be liable for any indirect, incidental, or consequential damages arising from your use of the Platform. Our total liability shall not exceed the amount you deposited in the 30 days preceding any claim.
        </Section>

        <Section title="9. Changes to Terms">
          We may update these Terms at any time. Continued use of the Platform after changes constitutes acceptance. It is your responsibility to review these Terms periodically.
        </Section>

        <Section title="10. Governing Law">
          These Terms are governed by the laws of Kenya. Any disputes shall be resolved in the courts of Nairobi, Kenya.
        </Section>

        <Section title="11. Contact">
          For questions about these Terms, contact us at support@derivengine.com.
        </Section>

        <div className="mt-12 pt-6 border-t border-purple-500/20 text-xs text-gray-500">
          If you do not agree to these Terms, please discontinue use of DerivEngine immediately.
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