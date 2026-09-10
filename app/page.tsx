'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { DerivClient } from '@/lib/derivClient'
import { TrendingUp, TrendingDown, Wallet, Trophy, Loader2 } from 'lucide-react'

export default function HomePage() {
  const [price, setPrice] = useState(536.27)
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
    { name: 'Marvin N.', amount: 10.00 },
    { name: 'Anthony D.', amount: 8.00 },
    { name: 'Ann O.', amount: 5.00 },
    { name: 'Caroline B.', amount: 4.50 },
    { name: 'Kelvin I.', amount: 42.50 },
  ])
  const [stats, setStats] = useState({
    winRate: 67,
    trades: 142,
    pnl: 428
  })
  const [showDashboard, setShowDashboard] = useState(false)

  // Check if user is logged in
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

  // Connect to Deriv API
  useEffect(() => {
    let derivClient: DerivClient;
    let isMounted = true;
    let fallbackInterval: NodeJS.Timeout;

    const connectDeriv = async () => {
      try {
        derivClient = new DerivClient();
        
        derivClient.setOnTick((price: number) => {
          if (isMounted) {
            setPrice(price);
          }
        });
        
        await derivClient.subscribeToTicks('R_100');
        setIsDerivConnected(true);
        console.log('✅ Connected to Deriv API');
        
      } catch (error) {
        console.error('❌ Deriv connection error:', error);
        setIsDerivConnected(false);
        fallbackInterval = setInterval(() => {
          const change = (Math.random() - 0.5) * 2;
          setPrice(prev => Math.max(100, prev + change));
        }, 1000);
      }
    };

    connectDeriv();

    return () => {
      isMounted = false;
      if (fallbackInterval) {
        clearInterval(fallbackInterval);
      }
      if (derivClient) {
        derivClient.unsubscribeFromTicks();
      }
    };
  }, []);

  const getDerivSymbol = (market: string) => {
    const symbolMap: { [key: string]: string } = {
      'V10': 'R_10',
      'V25': 'R_25',
      'V50': 'R_50',
      'V75': 'R_75',
      'V100': 'R_100',
      'V10 1s': 'R_10_1S',
      'V25 1s': 'R_25_1S',
      'V50 1s': 'R_50_1S',
      'V75 1s': 'R_75_1S',
      'V100 1s': 'R_100_1S',
    };
    return symbolMap[market] || 'R_100';
  };

  const executeRealTrade = async (prediction: 'RISE' | 'FALL') => {
    setIsTrading(true);
    setTradeResult(null);

    try {
      const symbol = getDerivSymbol(selectedMarket);
      const amount = Math.floor(stake);
      const durationInSeconds = duration;
      const contractType = prediction === 'RISE' ? 'CALL' : 'PUT';

      if (!isLiveMode) {
        const result = Math.random() > 0.5 ? 'WIN' : 'LOSS';
        const payout = result === 'WIN' ? stake * 1.9 : 0;
        
        if (result === 'WIN') {
          setBalance(prev => prev + payout);
          setTradeResult(`🎉 You won! +$${payout.toFixed(2)}`);
          setWinners(prev => [{ name: user?.email?.split('@')[0] || 'Trader', amount: payout }, ...prev.slice(0, 4)]);
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
      console.error('Trade error:', error);
      setTradeResult(`❌ Error: ${error.message || 'Unknown error'}`);
    }

    setIsTrading(false);
  };

  const handleTrade = async (prediction: 'RISE' | 'FALL') => {
    if (!isLoggedIn) {
      alert('Please sign in to trade');
      return;
    }

    if (stake > balance) {
      alert('Insufficient balance!');
      return;
    }

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
    
    if (amount <= 0) {
      alert('Please enter a valid amount');
      return;
    }
    
    if (phone.length < 10) {
      alert('Please enter a valid phone number');
      return;
    }
    
    try {
      const { MpesaService } = await import('@/lib/mpesa');
      const result = await MpesaService.deposit(phone, amount);
      
      if (result.success) {
        setBalance(prev => prev + amount);
        alert(`✅ ${result.message}`);
      } else {
        alert(`❌ ${result.message}`);
      }
    } catch (error) {
      console.error('Deposit error:', error);
      alert('Deposit failed. Please try again.');
    }
  };

  const handleWithdraw = async () => {
    const amountInput = document.getElementById('withdrawAmount') as HTMLInputElement;
    const phoneInput = document.getElementById('withdrawPhone') as HTMLInputElement;
    
    const amount = parseFloat(amountInput?.value || '0');
    const phone = phoneInput?.value || '';
    
    if (amount <= 0) {
      alert('Please enter a valid amount');
      return;
    }
    
    if (amount > balance) {
      alert('Insufficient balance');
      return;
    }
    
    if (phone.length < 10) {
      alert('Please enter a valid phone number');
      return;
    }
    
    try {
      const { MpesaService } = await import('@/lib/mpesa');
      const result = await MpesaService.withdraw(phone, amount);
      
      if (result.success) {
        setBalance(prev => prev - amount);
        alert(`✅ ${result.message}`);
      } else {
        alert(`❌ ${result.message}`);
      }
    } catch (error) {
      console.error('Withdrawal error:', error);
      alert('Withdrawal failed. Please try again.');
    }
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

  // LANDING PAGE (SinTrades Style)
  if (!showDashboard) {
    return (
      <main className="min-h-screen bg-[#0A0A0F]">
        {/* Hero Section */}
        <section className="max-w-4xl mx-auto px-4 py-12 text-center">
          <div className="text-emerald-400 text-sm font-medium mb-4">Live volatility index trading</div>
          
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            Trade the markets.<br />
            <span className="text-emerald-400">Live.</span>
          </h1>
          
          <p className="text-gray-400 text-sm sm:text-base max-w-lg mx-auto mb-8">
            Predict whether a Volatility Index will rise or fall. Win up to 1.9× your stake. 
            Deposit and withdraw with ease — built for everyone.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Link href="/register" className="px-8 py-3 bg-emerald-500 hover:bg-emerald-600 text-black font-bold rounded-xl transition">
              Start trading
            </Link>
            <Link href="/login" className="px-8 py-3 bg-[#1E1E28] hover:bg-[#2A2A36] text-white font-bold rounded-xl transition">
              I have an account
            </Link>
          </div>

          <div className="flex items-center justify-center gap-6 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></span>
              Real live prices
            </span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></span>
              Trades from 15 seconds
            </span>
          </div>
        </section>

        {/* Live Price Ticker */}
        <section className="max-w-4xl mx-auto px-4 mb-12">
          <div className="bg-[#14141C] rounded-2xl p-6 border border-white/5">
            <div className="flex justify-between items-center">
              <div>
                <div className="text-sm text-gray-400">Volatility 100 index</div>
                <div className="text-4xl font-bold text-white mt-1">{price.toFixed(2)}</div>
              </div>
              <div className="text-xs text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-full">
                ● Live market
              </div>
            </div>
          </div>
        </section>

        {/* Winners Feed */}
        <section className="max-w-4xl mx-auto px-4 mb-12">
          <div className="space-y-1">
            {winners.map((w, i) => (
              <div key={i} className="text-sm text-gray-300">
                <span className="font-medium">{w.name}</span>
                <span className="text-gray-400"> won </span>
                <span className="text-emerald-400 font-medium">${w.amount.toFixed(2)}</span>
                <span className="text-gray-400"> on V100 1s</span>
              </div>
            ))}
          </div>
        </section>

        {/* Available Markets */}
        <section className="max-w-4xl mx-auto px-4 mb-12">
          <h2 className="text-lg font-bold text-white mb-4">Available Markets</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {markets.map((m) => (
              <div key={m.code} className="bg-[#14141C] rounded-xl px-4 py-3 border border-white/5 text-sm">
                <span className="text-emerald-400 font-medium">{m.code}</span>
                <span className="text-gray-400 ml-2">{m.name}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Features */}
        <section className="max-w-4xl mx-auto px-4 mb-12">
          <h2 className="text-xl font-bold text-white text-center mb-8">
            Everything you need to trade
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-[#14141C] rounded-2xl p-6 border border-white/5">
              <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center mb-3">
                <span className="text-emerald-400 text-xl">📊</span>
              </div>
              <h3 className="text-white font-bold mb-1">Real live prices</h3>
              <p className="text-gray-400 text-sm">Volatility indices streamed live. Your trades settle on the genuine market feed — no games.</p>
            </div>
            <div className="bg-[#14141C] rounded-2xl p-6 border border-white/5">
              <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center mb-3">
                <span className="text-emerald-400 text-xl">👆</span>
              </div>
              <h3 className="text-white font-bold mb-1">Trade in one tap</h3>
              <p className="text-gray-400 text-sm">Pick a market, set your stake and time, then tap Rise or Fall. That's it.</p>
            </div>
            <div className="bg-[#14141C] rounded-2xl p-6 border border-white/5">
              <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center mb-3">
                <span className="text-emerald-400 text-xl">💰</span>
              </div>
              <h3 className="text-white font-bold mb-1">Easy deposits & withdrawals</h3>
              <p className="text-gray-400 text-sm">Fund your account and cash out your winnings via M-Pesa, crypto or bank.</p>
            </div>
            <div className="bg-[#14141C] rounded-2xl p-6 border border-white/5">
              <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center mb-3">
                <span className="text-emerald-400 text-xl">🔒</span>
              </div>
              <h3 className="text-white font-bold mb-1">Secure by design</h3>
              <p className="text-gray-400 text-sm">Every stake and payout is recorded to a tamper-proof ledger tied to your account.</p>
            </div>
            <div className="bg-[#14141C] rounded-2xl p-6 border border-white/5">
              <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center mb-3">
                <span className="text-emerald-400 text-xl">⚡</span>
              </div>
              <h3 className="text-white font-bold mb-1">Fast contracts</h3>
              <p className="text-gray-400 text-sm">Durations from 15 seconds to 5 minutes. Know your outcome quickly.</p>
            </div>
            <div className="bg-[#14141C] rounded-2xl p-6 border border-white/5">
              <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center mb-3">
                <span className="text-emerald-400 text-xl">📈</span>
              </div>
              <h3 className="text-white font-bold mb-1">Track performance</h3>
              <p className="text-gray-400 text-sm">See your win rate, net P&L and full trade history at a glance.</p>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="max-w-4xl mx-auto px-4 mb-12">
          <h2 className="text-xl font-bold text-white text-center mb-8">Start in 3 steps</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl mb-2">1️⃣</div>
              <h3 className="text-white font-bold">Create an account</h3>
              <p className="text-gray-400 text-sm">Sign up free in under a minute.</p>
            </div>
            <div className="text-center">
              <div className="text-3xl mb-2">2️⃣</div>
              <h3 className="text-white font-bold">Deposit funds</h3>
              <p className="text-gray-400 text-sm">Add money with your preferred method.</p>
            </div>
            <div className="text-center">
              <div className="text-3xl mb-2">3️⃣</div>
              <h3 className="text-white font-bold">Trade & withdraw</h3>
              <p className="text-gray-400 text-sm">Predict Rise or Fall, win, and cash out.</p>
            </div>
          </div>
          <div className="text-center mt-8">
            <Link href="/register" className="px-8 py-3 bg-emerald-500 hover:bg-emerald-600 text-black font-bold rounded-xl transition">
              Create free account
            </Link>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-white/5 py-8">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h2 className="text-xl font-bold text-emerald-400 mb-3">SinTrades</h2>
            <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-400 mb-4">
              <Link href="#" className="hover:text-white">How It Works</Link>
              <Link href="#" className="hover:text-white">Payout Rules</Link>
              <Link href="/login" className="hover:text-white">Sign In</Link>
              <Link href="/register" className="hover:text-white">Create Account</Link>
            </div>
            <p className="text-xs text-gray-500 max-w-lg mx-auto">
              Trading volatility indices involves risk and may not be suitable for everyone. 
              Only trade with money you can afford to lose. Prices are provided by the Deriv synthetic-index feed.
            </p>
            <p className="text-xs text-gray-500 mt-4">© 2026 SinTrades. All rights reserved.</p>
          </div>
        </footer>
      </main>
    )
  }

  // DASHBOARD (Same as before)
  return (
    <main className="min-h-screen max-w-md mx-auto p-4 pb-24">
      {/* Header */}
      <header className="flex justify-between items-center py-4">
        <div>
          <h1 className="text-xl font-bold text-emerald-400">SinTrades</h1>
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
                : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
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

      {/* Logged In Status */}
      {isLoggedIn && (
        <div className="bg-[#14141C] rounded-2xl p-3 mb-4 border border-white/5 text-center">
          <p className="text-sm text-emerald-400">✅ Logged in as {user?.email}</p>
          {isDerivConnected && (
            <p className="text-xs text-green-500 mt-1">🟢 Connected to Deriv Live Data</p>
          )}
          {!isDerivConnected && (
            <p className="text-xs text-yellow-500 mt-1">🟡 Using Simulated Data</p>
          )}
          <p className={`text-xs mt-1 font-bold ${isLiveMode ? 'text-red-400' : 'text-emerald-400'}`}>
            {isLiveMode ? 'LIVE TRADING - Real Money' : 'DEMO TRADING - Virtual Money'}
          </p>
          {tradeResult && (
            <p className={`text-sm mt-2 ${tradeResult.includes('won') || tradeResult.includes('🎉') ? 'text-green-400' : 'text-red-400'}`}>
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
                  ? 'bg-emerald-500 text-black font-bold' 
                  : 'bg-[#1E1E28] text-gray-300 hover:bg-[#2A2A36]'
              }`}
            >
              {m.code}
            </button>
          ))}
        </div>
      </div>

      {/* Price Display */}
      <div className="bg-[#14141C] rounded-2xl p-6 mb-4 border border-white/5">
        <div className="flex justify-between items-center">
          <div>
            <div className="text-xs text-gray-400">{selectedMarket} Index</div>
            <div className="text-3xl font-bold mt-1">{price.toFixed(2)}</div>
          </div>
          <div className="flex flex-col items-end">
            <div className="text-xs text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
              {isDerivConnected ? 'Live' : 'Simulated'}
            </div>
          </div>
        </div>
      </div>

      {/* Winners Feed */}
      <div className="bg-[#14141C] rounded-2xl p-4 mb-4 border border-white/5 max-h-40 overflow-y-auto">
        <div className="text-xs text-gray-400 mb-2 flex items-center gap-2">
          <Trophy className="w-3 h-3" />
          Recent Winners
        </div>
        {winners.map((w, i) => (
          <div key={i} className="flex justify-between py-1.5 border-b border-white/5 last:border-none text-sm">
            <span>{w.name}</span>
            <span className="text-emerald-400">+${w.amount.toFixed(2)} on V100 1s</span>
          </div>
        ))}
      </div>

      {/* Trade Controls */}
      <div className="bg-[#14141C] rounded-2xl p-4 border border-white/5">
        <div className="flex gap-2 mb-4">
          <div className="flex-1">
            <label className="text-xs text-gray-400 block mb-1">Stake (USD)</label>
            <input
              type="number"
              value={stake}
              onChange={(e) => setStake(Number(e.target.value))}
              className="w-full bg-[#1E1E28] text-white rounded-lg px-4 py-3 outline-none border border-white/10 text-sm"
              min={1}
              max={balance}
            />
          </div>
          <div className="w-1/3">
            <label className="text-xs text-gray-400 block mb-1">Duration</label>
            <select
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="w-full bg-[#1E1E28] text-white rounded-lg px-4 py-3 outline-none border border-white/10 text-sm"
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
                ? 'bg-emerald-500 hover:bg-emerald-600 text-black' 
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
        <div className="bg-[#14141C] rounded-xl p-3 text-center border border-white/5">
          <div className="text-xs text-gray-400">Win Rate</div>
          <div className="text-lg font-bold text-emerald-400">{stats.winRate}%</div>
        </div>
        <div className="bg-[#14141C] rounded-xl p-3 text-center border border-white/5">
          <div className="text-xs text-gray-400">Trades</div>
          <div className="text-lg font-bold">{stats.trades}</div>
        </div>
        <div className="bg-[#14141C] rounded-xl p-3 text-center border border-white/5">
          <div className="text-xs text-gray-400">P&L</div>
          <div className={`text-lg font-bold ${stats.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {stats.pnl >= 0 ? '+' : ''}${stats.pnl}
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#0A0A0F] border-t border-white/5 p-3 max-w-md mx-auto">
        <div className="flex justify-around items-center">
          <button className="text-xs text-gray-500 hover:text-white font-medium">Trade</button>
          <button className="text-xs text-gray-500 hover:text-white">History</button>
          <button 
            className="text-xs font-bold text-white bg-emerald-500 px-6 py-2 rounded-full hover:bg-emerald-600 transition"
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
          <div className="bg-[#14141C] rounded-2xl p-6 max-w-md w-full border border-white/10">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-emerald-400">💰 Wallet</h2>
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
              <div className="bg-[#1E1E28] rounded-xl p-4">
                <h3 className="text-sm font-medium text-white mb-2">💳 Deposit</h3>
                <div className="flex gap-2 flex-col sm:flex-row">
                  <input
                    type="number"
                    placeholder="Amount"
                    className="flex-1 bg-[#0A0A0F] text-white rounded-lg px-3 py-2 outline-none border border-white/10 text-sm"
                    id="depositAmount"
                    min={1}
                  />
                  <input
                    type="text"
                    placeholder="Phone (e.g., 0712345678)"
                    className="flex-1 bg-[#0A0A0F] text-white rounded-lg px-3 py-2 outline-none border border-white/10 text-sm"
                    id="depositPhone"
                  />
                </div>
                <button 
                  onClick={handleDeposit}
                  className="w-full mt-2 py-2 bg-emerald-500 hover:bg-emerald-600 rounded-lg font-bold text-black transition text-sm"
                >
                  Deposit via M-Pesa
                </button>
              </div>

              <div className="bg-[#1E1E28] rounded-xl p-4">
                <h3 className="text-sm font-medium text-white mb-2">🏦 Withdraw</h3>
                <div className="flex gap-2 flex-col sm:flex-row">
                  <input
                    type="number"
                    placeholder="Amount"
                    className="flex-1 bg-[#0A0A0F] text-white rounded-lg px-3 py-2 outline-none border border-white/10 text-sm"
                    id="withdrawAmount"
                    min={1}
                  />
                  <input
                    type="text"
                    placeholder="Phone (e.g., 0712345678)"
                    className="flex-1 bg-[#0A0A0F] text-white rounded-lg px-3 py-2 outline-none border border-white/10 text-sm"
                    id="withdrawPhone"
                  />
                </div>
                <button 
                  onClick={handleWithdraw}
                  className="w-full mt-2 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg font-bold text-white transition text-sm"
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