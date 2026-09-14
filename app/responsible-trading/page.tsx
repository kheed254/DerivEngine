'use client'

import Link from 'next/link'
import { ArrowLeft, AlertTriangle } from 'lucide-react'

export default function ResponsibleTradingPage() {
  return (
    <main className="min-h-screen bg-[#0a0613] text-white">
      <nav className="border-b border-purple-500/20 bg-[#0d0818] sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-3 flex items-center gap-4">
          <Link href="/" className="w-9 h-9 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition">
            <ArrowLeft className="w-4 h-4 text-gray-400" />
          </Link>
          <div>
            <div className="font-bold">Responsible Trading</div>
            <div className="text-[10px] text-gray-500">Your wellbeing comes first</div>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-10">
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-6 mb-8">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-yellow-400 flex-shrink-0 mt-0.5" />
            <div>
              <h2 className="font-bold text-yellow-300 mb-1">Trading involves risk</h2>
              <p className="text-sm text-gray-300">
                Trading volatility indices can be highly addictive and result in significant financial loss. Never trade money you cannot afford to lose.
              </p>
            </div>
          </div>
        </div>

        <h1 className="text-3xl font-bold mb-6">Trading Responsibly</h1>

        <Section title="1. Set Your Limits">
          Before you start trading, decide on:
          <ul className="list-disc pl-6 mt-2 space-y-1 text-gray-300 text-sm">
            <li><strong>A daily loss limit</strong> — the maximum you will lose in one day.</li>
            <li><strong>A time limit</strong> — how long you will trade each session.</li>
            <li><strong>A budget</strong> — money you can genuinely afford to lose.</li>
          </ul>
          Stick to these limits, no matter what.
        </Section>

        <Section title="2. Never Chase Losses">
          If you lose, do not immediately place a bigger trade to win it back. This is the most common way traders blow their accounts. Take a break and come back with a clear head.
        </Section>

        <Section title="3. Recognise the Warning Signs">
          Seek help if you:
          <ul className="list-disc pl-6 mt-2 space-y-1 text-gray-300 text-sm">
            <li>Trade with money meant for rent, food, or bills.</li>
            <li>Borrow money to trade.</li>
            <li>Feel anxious, depressed, or desperate about trading.</li>
            <li>Hide your trading from family or friends.</li>
            <li>Trade to escape stress or other problems.</li>
          </ul>
        </Section>

        <Section title="4. Take Breaks">
          Long trading sessions reduce focus and increase mistakes. Set an alarm. Walk away. Come back fresh.
        </Section>

        <Section title="5. Don't Trade Under the Influence">
          Alcohol, drugs, or extreme stress impair judgement. Do not trade when you are not in a clear state of mind.
        </Section>

        <Section title="6. Get Help">
          If you feel your trading is out of control, reach out to:
          <ul className="list-disc pl-6 mt-2 space-y-1 text-gray-300 text-sm">
            <li><strong>Befrienders Kenya</strong>: +254 722 178 177 (free, confidential)</li>
            <li><strong>Kenya Red Cross</strong>: 1199</li>
            <li>Or speak to a trusted friend or family member.</li>
          </ul>
        </Section>

        <Section title="7. Our Commitment">
          We will never pressure you to deposit more or trade more. If you ask us to close your account, we will do it. If you ask us to set a deposit limit, we will implement it.
        </Section>

        <Section title="8. Under 18? No Trading.">
          You must be at least 18 to use DerivEngine. If you are under 18, please leave the Platform immediately.
        </Section>

        <div className="mt-12 bg-purple-500/10 border border-purple-500/30 rounded-2xl p-6">
          <p className="text-sm text-gray-300">
            Trading is entertainment, not a way to make a living. Treat every trade as money you are willing to lose, and never bet more than your daily limit.
          </p>
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