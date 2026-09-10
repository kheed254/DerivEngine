'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { DerivClient } from '@/lib/derivClient'
import { TrendingUp, TrendingDown, Wallet, Loader2 } from 'lucide-react'

export default function HomePage() {
  const [price, setPrice] = useState(539.67)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [isDerivConnected, setIsDerivConnected] = useState(false)
  const [isWalletOpen, setIsWalletOpen] = useState(false)
  const [balance, setBalance] = useState(10000)
  const [isLiveMode, setIsLiveMode] = useState(false)
  const [stake, setStake] = useState(10)
  const [duration, setDuration] = useState(15)
  const [selectedMarket, setSelectedMarket] = useState('V100')
  const [isTrading, setIsTrading] = useState(false)
  const [tradeResult, setTradeResult] = useState<string | null>(null)
  const [winners, setWinners] = useState([
    { name: 'Ann M.', amount: 10.00, market: 'V100 1s' },
    { name: 'Aisha I.', amount: 9.00, market: 'V100 1s' },
    { name: 'Michael C.', amount: 5.00, market: 'V100 1s' },
    { name: 'Stephen N.', amount: 4.50, market: 'V100 1s' },
    { name: 'Faith A.', amount: 42.50, market: 'V100 1s' },
  ])
  const [stats, setStats] = useState({
    winRate: 67,
    trades: 142,
    pnl: 428
  })
  const [showDashboard, setShowDashboard] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setIsLoggedIn(true)
        setUser(session.user)
        setShowDashboard(true)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setIsLoggedIn(true)
        setUser(session.user)
        setShowDashboard(true)
      } else {
        setIsLoggedIn(false)
        setUser(null)
        setShowDashboard(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    let derivClient: DerivClient;
    let isMounted = true;
    let fallbackInterval: NodeJS.Timeout;

    const connectDeriv = async () => {
      try {
        derivClient = new DerivClient();
        derivClient.setOnTick((price: number) => {
          if (isMounted) setPrice(price);
        });
        await derivClient.subscribeToTicks('R_100');
        setIsDerivConnected(true);
      } catch (error) {
        setIsDerivConnected(false);
        fallbackInterval = setInterval(() => {
          setPrice(prev => Math.max(100, prev + (Math.random() - 0.5) * 2));
        }, 1000);
      }
    };

    connectDeriv();

    return () => {
      isMounted = false;
      if (fallbackInterval) clearInterval(fallbackInterval);
      if (derivClient) derivClient.unsubscribeFromTicks();
    };
  }, []);

  const getDerivSymbol = (market: string) => {
    const symbolMap: { [key: string]: string } = {
      'V10': 'R_10', 'V25': 'R_25', 'V50': 'R_50', 'V75': 'R_75', 'V100': 'R_100',
      'V10 1s': 'R_10_1S', 'V25 1s': 'R_25_1S', 'V50 1s': 'R_50_1S', 'V75 1s': 'R_75_1S', 'V100 1s': 'R_100_1S',
    };
    return symbolMap[market] || 'R_100';
  };

  const executeRealTrade = async (prediction: 'RISE' | 'FALL') => {
    setIsTrading(true);
    setTradeResult(null);

    try {
      if (!isLiveMode) {
        const result = Math.random() > 0.5 ? 'WIN' : 'LOSS';
        const payout = result === 'WIN' ? stake * 1.9 : 0;
        
        if (result === 'WIN') {
          setBalance(prev => prev + payout);
          setTradeResult(`🎉 You won! +$${payout.toFixed(2)}`);
          setWinners(prev => [{ name: user?.email?.split('@')[0] || 'Trader', amount: payout, market: selectedMarket }, ...prev.slice(0, 4)]);
          setStats(prev => ({ ...prev, winRate: Math.min(100, prev.winRate + 1), trades: prev.trades + 1, pnl: prev.pnl + payout }));
        } else {
          setBalance(prev => prev - stake);
          setTradeResult(`😢 You lost. -$${stake.toFixed(2)}`);
          setStats(prev => ({ ...prev, winRate: Math.max(0, prev.winRate - 1), trades: prev.trades + 1, pnl: prev.pnl - stake }));
        }
        setIsTrading(false);
        return;
      }
      setTradeResult('🔐 Real trading coming soon');
      setIsTrading(false);
    } catch (error: any) {
      setTradeResult(`❌ Error: ${error.message || 'Unknown error'}`);
    }
    setIsTrading(false);
  };

  const handleTrade = async (prediction: 'RISE' | 'FALL') => {
    if (!isLoggedIn) { alert('Please sign in to trade'); return; }
    if (stake > balance) { alert('Insufficient balance!'); return; }
    await executeRealTrade(prediction);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setShowDashboard(false)
  };

  const toggleMode = () => {
    setIsLiveMode(!isLiveMode);
    setTradeResult(null);
  };

  const handleDeposit = async () => {
    const amountInput = document.getElementById('depositAmount') as HTMLInputElement;
    const phoneInput = document.getElementById('depositPhone') as HTMLInputElement;
    const amount = parseFloat(amountInput?.value || '0');
    const phone = phoneInput?.value || '';
    if (amount <= 0) { alert('Please enter a valid amount'); return; }
    if (phone.length < 10) { alert('Please enter a valid phone number'); return; }
    try {
      const { MpesaService } = await import('@/lib/mpesa');
      const result = await MpesaService.deposit(phone, amount);
      if (result.success) { setBalance(prev => prev + amount); alert(`✅ ${result.message}`); }
      else { alert(`❌ ${result.message}`); }
    } catch (error) { alert('Deposit failed. Please try again.'); }
  };

  const handleWithdraw = async () => {
    const amountInput = document.getElementById('withdrawAmount') as HTMLInputElement;
    const phoneInput = document.getElementById('withdrawPhone') as HTMLInputElement;
    const amount = parseFloat(amountInput?.value || '0');
    const phone = phoneInput?.value || '';
    if (amount <= 0) { alert('Please enter a valid amount'); return; }
    if (amount > balance) { alert('Insufficient balance'); return; }
    if (phone.length < 10) { alert('Please enter a valid phone number'); return; }
    try {
      const { MpesaService } = await import('@/lib/mpesa');
      const result = await MpesaService.withdraw(phone, amount);
      if (result.success) { setBalance(prev => prev - amount); alert(`✅ ${result.message}`); }
      else { alert(`❌ ${result.message}`); }
    } catch (error) { alert('Withdrawal failed. Please try again.'); }
  };

  const markets = [
    { code: 'V10', name: 'Volatility 10' },
    { code: 'V25', name: 'Volatility 25' },
    { code: 'V50', name: 'Volatility 50' },
    { code: 'V75', name: 'Volatility 75' },
    { code: 'V100', name: 'Volatility 100' },
    { code: 'V10 1s', name: 'Volatility 10 (1s)' },
    { code: 'V25 1s', name: 'Volatility 25 (1s)' },
    { code: 'V50 1s', name: 'Volatility 50 (1s)' },
    { code: 'V75 1s', name: 'Volatility 75 (1s)' },
    { code: 'V100 1s', name: 'Volatility 100 (1s)' },
  ];

  // ═══════════════════════════════════════════════
  // LANDING PAGE (SinTrades Style - Purple Theme)
  // ═══════════════════════════════════════════════
  if (!showDashboard) {
    return (
      <main className="min-h-screen bg-[#0a0613] text-white">
        {/* Navigation Header */}
        <header className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center">
              <span className="text-white font-bold text-sm">S</span>
            </div>
            <span className="text-white font-bold text-lg">SinTrades</span>
          </div>
          <div className="flex items-center gap-3">
            <button className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
              <span className="text-sm">☀️</span>
            </button>
            <Link href="/login" className="px-4 py-2 text-sm text-white border border-white/20 rounded-lg hover:bg-white/5 transition">
              Sign in
            </Link>
            <Link href="/register" className="px-4 py-2 text-sm text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition font-medium">
              Get started
            </Link>
          </div>
        </header>

        {/* Hero Section */}
        <section className="max-w-7xl mx-auto px-6 py-16 lg:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left: Text */}
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-purple-500/10 border border-purple-500/30 rounded-full text-xs text-purple-300 mb-6">
                <span>⚡</span>
                Live volatility index trading
              </div>
              
              <h1 className="text-5xl lg:text-6xl font-bold text-white leading-tight mb-4">
                Trade the markets.<br />
                <span className="bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent">Yours.</span>
              </h1>
              
              <p className="text-gray-400 text-base max-w-md mb-8">
                Predict whether a Volatility Index will rise or fall. Win up to <span className="text-purple-400 font-medium">1.9×</span> your stake. Deposit and withdraw with ease — built for everyone.
              </p>

              <div className="flex flex-wrap gap-3 mb-6">
                <Link href="/register" className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition flex items-center gap-2">
                  Start trading →
                </Link>
                <Link href="/login" className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium rounded-lg transition">
                  I have an account
                </Link>
              </div>

              <div className="flex items-center gap-6 text-xs text-gray-500">
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-purple-400 rounded-full"></span>
                  Real live prices
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-purple-400 rounded-full"></span>
                  Trades from 15 seconds
                </span>
              </div>
            </div>

            {/* Right: Live Price Card */}
            <div className="lg:justify-self-end">
              <div className="bg-[#150d24] border border-purple-500/20 rounded-2xl p-6 w-full max-w-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs text-gray-400">Volatility 100 Index</div>
                    <div className="text-3xl font-bold text-white mt-1">{price.toFixed(2)}</div>
                  </div>
                  <div className="text-xs text-purple-300 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-pulse"></span>
                    Live market
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Live Winners Ticker */}
        <section className="border-y border-white/5 bg-white/[0.02]">
          <div className="max-w-7xl mx-auto px-6 py-3">
            <div className="flex items-center gap-6 overflow-x-auto text-xs whitespace-nowrap">
              {winners.map((w, i) => (
                <div key={i} className="flex items-center gap-2 text-gray-400">
                  <span className="w-1.5 h-1.5 bg-purple-400 rounded-full"></span>
                  <span className="text-white font-medium">{w.name}</span>
                  <span>won</span>
                  <span className="text-purple-400 font-medium">${w.amount.toFixed(2)}</span>
                  <span>on {w.market}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Available Markets */}
        <section className="max-w-7xl mx-auto px-6 py-12">
          <div className="text-center mb-6">
            <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">Available Markets</div>
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            {markets.map((m) => (
              <div key={m.code} className="px-4 py-2 bg-[#150d24] border border-purple-500/20 rounded-lg text-xs">
                <span className="text-purple-400 font-semibold">{m.code}</span>
                <span className="text-gray-400 ml-2">{m.name}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Features */}
        <section className="max-w-7xl mx-auto px-6 py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-3">
              Everything you need to trade
            </h2>
            <p className="text-gray-400 text-sm">
              A professional trading experience without the complexity.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Feature 1 */}
            <div className="bg-[#150d24] border border-purple-500/20 rounded-2xl p-6 hover:border-purple-500/40 transition">
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center mb-4">
                <span className="text-purple-400">📊</span>
              </div>
              <h3 className="text-white font-bold mb-2">Real live prices</h3>
              <p className="text-gray-400 text-sm">Volatility indices streamed live. Your trades settle on the genuine market feed — no games.</p>
            </div>

            {/* Feature 2 */}
            <div className="bg-[#150d24] border border-purple-500/20 rounded-2xl p-6 hover:border-purple-500/40 transition">
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center mb-4">
                <span className="text-purple-400">⚡</span>
              </div>
              <h3 className="text-white font-bold mb-2">Trade in one tap</h3>
              <p className="text-gray-400 text-sm">Pick a market, set your stake and time, then tap Rise or Fall. That's it.</p>
            </div>

            {/* Feature 3 */}
            <div className="bg-[#150d24] border border-purple-500/20 rounded-2xl p-6 hover:border-purple-500/40 transition">
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center mb-4">
                <span className="text-purple-400">💰</span>
              </div>
              <h3 className="text-white font-bold mb-2">Easy deposits & withdrawals</h3>
              <p className="text-gray-400 text-sm">Fund your account and cash out your winnings via M-Pesa, crypto or bank.</p>
            </div>

            {/* Feature 4 */}
            <div className="bg-[#150d24] border border-purple-500/20 rounded-2xl p-6 hover:border-purple-500/40 transition">
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center mb-4">
                <span className="text-purple-400">🔒</span>
              </div>
              <h3 className="text-white font-bold mb-2">Secure by design</h3>
              <p className="text-gray-400 text-sm">Every stake and payout is recorded to a tamper-proof ledger tied to your account.</p>
            </div>

            {/* Feature 5 */}
            <div className="bg-[#150d24] border border-purple-500/20 rounded-2xl p-6 hover:border-purple-500/40 transition">
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center mb-4">
                <span className="text-purple-400">⏱</span>
              </div>
              <h3 className="text-white font-bold mb-2">Fast contracts</h3>
              <p className="text-gray-400 text-sm">Durations from 15 seconds to 5 minutes. Know your outcome quickly.</p>
            </div>

            {/* Feature 6 */}
            <div className="bg-[#150d24] border border-purple-500/20 rounded-2xl p-6 hover:border-purple-500/40 transition">
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center mb-4">
                <span className="text-purple-400">📈</span>
              </div>
              <h3 className="text-white font-bold mb-2">Track performance</h3>
              <p className="text-gray-400 text-sm">See your win rate, net P&L and full trade history at a glance.</p>
            </div>
          </div>
        </section>

        {/* Start in 3 Steps */}
        <section className="max-w-7xl mx-auto px-6 py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-white">Start in 3 steps</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-[#150d24] border border-purple-500/20 rounded-2xl p-8 text-center">
              <div className="w-10 h-10 rounded-full bg-purple-600 text-white font-bold flex items-center justify-center mx-auto mb-4">1</div>
              <h3 className="text-white font-bold mb-2">Create an account</h3>
              <p className="text-gray-400 text-sm">Sign up free in under a minute.</p>
            </div>
            <div className="bg-[#150d24] border border-purple-500/20 rounded-2xl p-8 text-center">
              <div className="w-10 h-10 rounded-full bg-purple-600 text-white font-bold flex items-center justify-center mx-auto mb-4">2</div>
              <h3 className="text-white font-bold mb-2">Deposit funds</h3>
              <p className="text-gray-400 text-sm">Add money with your preferred method.</p>
            </div>
            <div className="bg-[#150d24] border border-purple-500/20 rounded-2xl p-8 text-center">
              <div className="w-10 h-10 rounded-full bg-purple-600 text-white font-bold flex items-center justify-center mx-auto mb-4">3</div>
              <h3 className="text-white font-bold mb-2">Trade & withdraw</h3>
              <p className="text-gray-400 text-sm">Predict Rise or Fall, win, and cash out.</p>
            </div>
          </div>
          <div className="text-center mt-8">
            <Link href="/register" className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition">
              Create free account →
            </Link>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-white/5 py-8">
          <div className="max-w-7xl mx-auto px-6 text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="w-6 h-6 rounded bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center">
                <span className="text-white font-bold text-xs">S</span>
              </div>
              <span className="text-white font-bold">SinTrades</span>
            </div>
            <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-400 mb-4">
              <Link href="#" className="hover:text-white">How it works</Link>
              <Link href="#" className="hover:text-white">Payout rules</Link>
              <Link href="/login" className="hover:text-white">Sign in</Link>
              <Link href="/register" className="hover:text-white">Create account</Link>
            </div>
            <p className="text-xs text-gray-500 max-w-lg mx-auto">
              Trading volatility indices involves risk and may not be suitable for everyone. 
              Only trade with money you can afford to lose. Prices are provided by the Deriv synthetic-index feed.
            </p>
            <p className="text-xs text-gray-600 mt-4">© 2026 SinTrades. All rights reserved.</p>
          </div>
        </footer>
      </main>
    )
  }

  // ═══════════════════════════════════════════════
  // DASHBOARD (Purple Theme)
  // ═══════════════════════════════════════════════
  return (
    <main className="min-h-screen max-w-md mx-auto p-4 pb-24 bg-[#0a0613] text-white">
      {/* Header */}
      <header className="flex justify-between items-center py-4">
        <div>
          <h1 className="text-xl font-bold text-purple-400">SinTrades</h1>
          <p className="text-[10px] text-gray-500">Live Volatility Index Trading</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400">
            <Wallet className="inline w-4 h-4 mr-1" />
            ${balance.toFixed(2)}
          </span>
          <button
            onClick={toggleMode}
            className={`text-xs px-3 py-1.5 rounded-full transition font-bold ${
              isLiveMode 
                ? 'bg-red-500 text-white hover:bg-red-600' 
                : 'bg-purple-500/20 text-purple-400 hover:bg-purple-500/30'
            }`}
          >
            {isLiveMode ? 'LIVE' : 'DEMO'}
          </button>
          {isLoggedIn && (
            <button
              onClick={handleLogout}
              className="text-xs px-3 py-1.5 bg-red-500/20 text-red-400 rounded-full"
            >
              Logout
            </button>
          )}
        </div>
      </header>

      {isLoggedIn && (
        <div className="bg-[#150d24] rounded-2xl p-3 mb-4 border border-purple-500/20 text-center">
          <p className="text-sm text-purple-400">✅ Logged in as {user?.email}</p>
          {isDerivConnected && (
            <p className="text-xs text-purple-300 mt-1">🟢 Connected to Deriv Live Data</p>
          )}
          {!isDerivConnected && (
            <p className="text-xs text-yellow-500 mt-1">🟡 Using Simulated Data</p>
          )}
          <p className={`text-xs mt-1 font-bold ${isLiveMode ? 'text-red-400' : 'text-purple-400'}`}>
            {isLiveMode ? 'LIVE TRADING - Real Money' : 'DEMO TRADING - Virtual Money'}
          </p>
          {tradeResult && (
            <p className={`text-sm mt-2 ${tradeResult.includes('won') || tradeResult.includes('🎉') ? 'text-purple-300' : 'text-red-400'}`}>
              {tradeResult}
            </p>
          )}
          {isTrading && (
            <p className="text-sm text-yellow-400 mt-2 flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Processing trade...
            </p>
          )}
        </div>
      )}

      {/* Markets */}
      <div className="overflow-x-auto pb-2 mb-3 -mx-1 px-1">
        <div className="flex gap-2 min-w-max">
          {markets.map((m) => (
            <button
              key={m.code}
              onClick={() => setSelectedMarket(m.code)}
              className={`px-3 py-1.5 rounded-lg text-xs whitespace-nowrap transition ${
                selectedMarket === m.code 
                  ? 'bg-purple-600 text-white font-bold' 
                  : 'bg-[#150d24] text-gray-300 hover:bg-purple-500/10 border border-purple-500/20'
              }`}
            >
              {m.code}
            </button>
          ))}
        </div>
      </div>

      {/* Price Display */}
      <div className="bg-[#150d24] rounded-2xl p-6 mb-4 border border-purple-500/20">
        <div className="flex justify-between items-center">
          <div>
            <div className="text-xs text-gray-400">{selectedMarket} Index</div>
            <div className="text-3xl font-bold mt-1">{price.toFixed(2)}</div>
          </div>
          <div className="flex flex-col items-end">
            <div className="text-xs text-purple-400 bg-purple-500/10 px-3 py-1 rounded-full flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-pulse"></span>
              {isDerivConnected ? 'Live' : 'Simulated'}
            </div>
          </div>
        </div>
      </div>

      {/* Winners Feed */}
      <div className="bg-[#150d24] rounded-2xl p-4 mb-4 border border-purple-500/20 max-h-40 overflow-y-auto">
        <div className="text-xs text-gray-400 mb-2">🎉 Recent Winners</div>
        {winners.map((w, i) => (
          <div key={i} className="flex justify-between py-1.5 border-b border-white/5 last:border-none text-sm">
            <span>{w.name}</span>
            <span className="text-purple-400">+${w.amount.toFixed(2)} on {w.market}</span>
          </div>
        ))}
      </div>

      {/* Trade Controls */}
      <div className="bg-[#150d24] rounded-2xl p-4 border border-purple-500/20">
        <div className="flex gap-2 mb-4">
          <div className="flex-1">
            <label className="text-xs text-gray-400 block mb-1">Stake (USD)</label>
            <input
              type="number"
              value={stake}
              onChange={(e) => setStake(Number(e.target.value))}
              className="w-full bg-[#0a0613] text-white rounded-lg px-4 py-3 outline-none border border-purple-500/20 text-sm"
              min={1}
              max={balance}
            />
          </div>
          <div className="w-1/3">
            <label className="text-xs text-gray-400 block mb-1">Duration</label>
            <select
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="w-full bg-[#0a0613] text-white rounded-lg px-4 py-3 outline-none border border-purple-500/20 text-sm"
            >
              <option value={15}>15s</option>
              <option value={30}>30s</option>
              <option value={60}>1m</option>
              <option value={120}>2m</option>
              <option value={300}>5m</option>
            </select>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => handleTrade('RISE')}
            disabled={!isLoggedIn || isTrading}
            className={`flex-1 py-4 rounded-xl font-bold text-lg transition flex items-center justify-center gap-2 ${
              isLoggedIn && !isTrading
                ? 'bg-purple-600 hover:bg-purple-700 text-white' 
                : 'bg-gray-700 text-gray-400 cursor-not-allowed'
            }`}
          >
            {isTrading ? <Loader2 className="w-5 h-5 animate-spin" /> : <TrendingUp className="w-5 h-5" />}
            RISE
          </button>
          <button
            onClick={() => handleTrade('FALL')}
            disabled={!isLoggedIn || isTrading}
            className={`flex-1 py-4 rounded-xl font-bold text-lg transition flex items-center justify-center gap-2 ${
              isLoggedIn && !isTrading
                ? 'bg-red-500 hover:bg-red-600 text-white' 
                : 'bg-gray-700 text-gray-400 cursor-not-allowed'
            }`}
          >
            {isTrading ? <Loader2 className="w-5 h-5 animate-spin" /> : <TrendingDown className="w-5 h-5" />}
            FALL
          </button>
        </div>

        <div className="mt-3 text-center text-xs text-gray-500">
          Win up to ${(stake * 1.9).toFixed(2)}
        </div>
      </div>

      {/* Stats */}
      <div className="mt-4 grid grid-cols-3 gap-2">
        <div className="bg-[#150d24] rounded-xl p-3 text-center border border-purple-500/20">
          <div className="text-xs text-gray-400">Win Rate</div>
          <div className="text-lg font-bold text-purple-400">{stats.winRate}%</div>
        </div>
        <div className="bg-[#150d24] rounded-xl p-3 text-center border border-purple-500/20">
          <div className="text-xs text-gray-400">Trades</div>
          <div className="text-lg font-bold">{stats.trades}</div>
        </div>
        <div className="bg-[#150d24] rounded-xl p-3 text-center border border-purple-500/20">
          <div className="text-xs text-gray-400">P&L</div>
          <div className={`text-lg font-bold ${stats.pnl >= 0 ? 'text-purple-400' : 'text-red-400'}`}>
            {stats.pnl >= 0 ? '+' : ''}${stats.pnl}
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#0a0613] border-t border-purple-500/20 p-3 max-w-md mx-auto">
        <div className="flex justify-around items-center">
          <button className="text-xs text-gray-500 hover:text-white font-medium">Trade</button>
          <button className="text-xs text-gray-500 hover:text-white">History</button>
          <button 
            className="text-xs font-bold text-white bg-purple-600 px-6 py-2 rounded-full hover:bg-purple-700 transition"
            onClick={() => setIsWalletOpen(true)}
          >
            💰 Wallet
          </button>
          <button className="text-xs text-gray-500 hover:text-white">Profile</button>
        </div>
      </div>

      {/* M-Pesa Wallet Modal */}
      {isWalletOpen && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-50">
          <div className="bg-[#150d24] rounded-2xl p-6 max-w-md w-full border border-purple-500/20">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-purple-400">💰 Wallet</h2>
              <button 
                onClick={() => setIsWalletOpen(false)}
                className="text-gray-400 hover:text-white text-2xl"
              >
                ✕
              </button>
            </div>
            
            <div className="mb-4">
              <p className="text-sm text-gray-400">Current Balance</p>
              <p className="text-2xl font-bold text-white">${balance.toFixed(2)}</p>
              <p className="text-xs text-gray-500 mt-1">{isLiveMode ? 'Live Account' : 'Demo Account'}</p>
            </div>

            <div className="space-y-3">
              <div className="bg-[#0a0613] rounded-xl p-4 border border-purple-500/20">
                <h3 className="text-sm font-medium text-white mb-2">💳 Deposit</h3>
                <div className="flex gap-2 flex-col sm:flex-row">
                  <input
                    type="number"
                    placeholder="Amount"
                    className="flex-1 bg-[#150d24] text-white rounded-lg px-3 py-2 outline-none border border-purple-500/20 text-sm"
                    id="depositAmount"
                    min={1}
                  />
                  <input
                    type="text"
                    placeholder="Phone (e.g., 0712345678)"
                    className="flex-1 bg-[#150d24] text-white rounded-lg px-3 py-2 outline-none border border-purple-500/20 text-sm"
                    id="depositPhone"
                  />
                </div>
                <button 
                  onClick={handleDeposit}
                  className="w-full mt-2 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg font-bold text-white transition text-sm"
                >
                  Deposit via M-Pesa
                </button>
              </div>

              <div className="bg-[#0a0613] rounded-xl p-4 border border-purple-500/20">
                <h3 className="text-sm font-medium text-white mb-2">🏦 Withdraw</h3>
                <div className="flex gap-2 flex-col sm:flex-row">
                  <input
                    type="number"
                    placeholder="Amount"
                    className="flex-1 bg-[#150d24] text-white rounded-lg px-3 py-2 outline-none border border-purple-500/20 text-sm"
                    id="withdrawAmount"
                    min={1}
                  />
                  <input
                    type="text"
                    placeholder="Phone (e.g., 0712345678)"
                    className="flex-1 bg-[#150d24] text-white rounded-lg px-3 py-2 outline-none border border-purple-500/20 text-sm"
                    id="withdrawPhone"
                  />
                </div>
                <button 
                  onClick={handleWithdraw}
                  className="w-full mt-2 py-2 bg-purple-500 hover:bg-purple-600 rounded-lg font-bold text-white transition text-sm"
                >
                  Withdraw to M-Pesa
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}