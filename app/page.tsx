'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { DerivClient } from '@/lib/derivClient'
import { ChevronDown, LogOut, Clock, Zap, Play, X, Search, Sparkles } from 'lucide-react'

export default function HomePage() {
  const [price, setPrice] = useState(730.69)
  const [lastDigit, setLastDigit] = useState(9)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [isDerivConnected, setIsDerivConnected] = useState(false)
  const [balance, setBalance] = useState(10000)
  const [isLiveMode, setIsLiveMode] = useState(false)
  const [stake, setStake] = useState(0)
  const [duration, setDuration] = useState(60)
  const [multiplier, setMultiplier] = useState(100)
  const [selectedMarket, setSelectedMarket] = useState('Volatility 100 (1s) Index')
  const [isTrading, setIsTrading] = useState(false)
  const [tradeResult, setTradeResult] = useState<string | null>(null)
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')
  const [openPositions, setOpenPositions] = useState<any[]>([])
  const [closedPositions, setClosedPositions] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState<'open' | 'closed'>('open')
  const [tradeType, setTradeType] = useState<'rise-fall' | 'digits' | 'multipliers'>('rise-fall')
  const [digitMode, setDigitMode] = useState<'over-under' | 'even-odd' | 'matches-differs'>('over-under')
  const [selectedDigit, setSelectedDigit] = useState<number>(8)
  const [digitSide, setDigitSide] = useState<string>('OVER')
  const [showDashboard, setShowDashboard] = useState(false)
  const [digitHistory] = useState<number[]>([0, 1, 2, 3, 4, 5, 6, 7, 8, 9])
  const [digitPercentages] = useState<number[]>([4, 12, 10, 12, 20, 8, 8, 18, 0, 14])

  // Manual / Auto / AI
  const [tradeMode, setTradeMode] = useState<'manual' | 'auto' | 'ai'>('manual')

  // Auto bot settings
  const [botTrade, setBotTrade] = useState<string>('RISE')
  const [martingale, setMartingale] = useState(2)
  const [maxRuns, setMaxRuns] = useState(50)
  const [targetProfit, setTargetProfit] = useState(50)
  const [stopLoss, setStopLoss] = useState(30)
  const [isBotRunning, setIsBotRunning] = useState(false)

  // AI Scanner
  const [aiTradeType, setAiTradeType] = useState('Even / Odd')
  const [aiScanProgress, setAiScanProgress] = useState(0)
  const [aiScanning, setAiScanning] = useState(false)
  const [aiScannedMarkets, setAiScannedMarkets] = useState<string[]>([])
  const [aiBestMarket, setAiBestMarket] = useState<string>('Volatility 100 (1s) Index')
  const [aiPrediction, setAiPrediction] = useState('Even')

  const chartRef = useRef<HTMLDivElement>(null)
  const chartInstance = useRef<any>(null)
  const seriesRef = useRef<any>(null)
  const priceHistoryRef = useRef<{ time: number; value: number }[]>([])

  const isDark = theme === 'dark'

  const aiMarkets = ['V10', 'V25', 'V50', 'V75', 'V100', 'V10 1s', 'V25 1s', 'V50 1s', 'V75 1s', 'V100 1s']

  const getOverMultiplier = (d: number) => ({ 0: 1.11, 1: 1.25, 2: 1.43, 3: 1.67, 4: 2.00, 5: 2.50, 6: 3.33, 7: 5.00, 8: 10.00 }[d] ?? 2.00)
  const getUnderMultiplier = (d: number) => ({ 1: 10.00, 2: 5.00, 3: 3.33, 4: 2.50, 5: 2.00, 6: 1.67, 7: 1.43, 8: 1.25, 9: 1.11 }[d] ?? 2.00)
  const getOverPercent = (d: number) => ({ 0: 11, 1: 25, 2: 43, 3: 67, 4: 100, 5: 150, 6: 233, 7: 400, 8: 900 }[d] ?? 100)
  const getUnderPercent = (d: number) => ({ 1: 900, 2: 400, 3: 233, 4: 150, 5: 100, 6: 67, 7: 43, 8: 25, 9: 11 }[d] ?? 100)
  const overMultiplier = getOverMultiplier(selectedDigit)
  const underMultiplier = getUnderMultiplier(selectedDigit)
  const overPercent = getOverPercent(selectedDigit)
  const underPercent = getUnderPercent(selectedDigit)

  // Auth
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) { setIsLoggedIn(true); setUser(session.user); setShowDashboard(true) }
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) { setIsLoggedIn(true); setUser(session.user); setShowDashboard(true) }
      else { setIsLoggedIn(false); setUser(null); setShowDashboard(false) }
    })
    return () => subscription.unsubscribe()
  }, [])

  // Reset price on market change
  useEffect(() => {
    if (!showDashboard) return
    const basePrices: { [key: string]: number } = {
      'Volatility 100 (1s) Index': 730, 'Volatility 100 Index': 1500,
      'Volatility 75 (1s) Index': 98000, 'Volatility 75 Index': 98000,
      'Volatility 50 (1s) Index': 240, 'Volatility 50 Index': 240,
      'Volatility 25 (1s) Index': 2800, 'Volatility 25 Index': 2800,
      'Volatility 10 (1s) Index': 6500, 'Volatility 10 Index': 6500,
    }
    const base = basePrices[selectedMarket] || 730
    setPrice(base)
    setLastDigit(Math.floor(base * 100) % 10)
  }, [selectedMarket, showDashboard])

  // Deriv + simulation
  useEffect(() => {
    let derivClient: DerivClient
    let isMounted = true
    let fallbackInterval: NodeJS.Timeout
    const connectDeriv = async () => {
      try {
        derivClient = new DerivClient()
        derivClient.setOnTick((newPrice: number) => {
          if (!isMounted) return
          setPrice(newPrice)
          setLastDigit(Math.floor(newPrice * 100) % 10)
        })
        await derivClient.subscribeToTicks('1HZ100V')
        setIsDerivConnected(true)
      } catch (error) { setIsDerivConnected(false) }
      fallbackInterval = setInterval(() => {
        if (!isMounted) return
        setPrice((prev) => {
          const next = Math.max(100, prev + (Math.random() - 0.5) * 2)
          setLastDigit(Math.floor(next * 100) % 10)
          return next
        })
      }, 1000)
    }
    connectDeriv()
    return () => {
      isMounted = false
      if (fallbackInterval) clearInterval(fallbackInterval)
      if (derivClient) derivClient.unsubscribeFromTicks()
    }
  }, [])

  // Chart setup
  useEffect(() => {
    if (!showDashboard) return
    let timeout: NodeJS.Timeout
    const initChart = async () => {
      try {
        const container = chartRef.current
        if (!container) { timeout = setTimeout(initChart, 500); return }
        const lib: any = await import('lightweight-charts')
        const createChart = lib.createChart
        const LineStyle = lib.LineStyle
        const LineSeries = lib.LineSeries
        if (chartInstance.current) { chartInstance.current.remove(); chartInstance.current = null }
        const chart = createChart(container, {
          width: container.clientWidth, height: 400,
          layout: { background: { color: 'transparent' }, textColor: '#9ca3af' },
          grid: { vertLines: { color: 'rgba(255, 255, 255, 0.05)', style: LineStyle?.Dotted ?? 2 }, horzLines: { color: 'rgba(255, 255, 255, 0.05)', style: LineStyle?.Dotted ?? 2 } },
          rightPriceScale: { borderColor: 'rgba(255, 255, 255, 0.1)', scaleMargins: { top: 0.1, bottom: 0.1 } },
          timeScale: { borderColor: 'rgba(255, 255, 255, 0.1)', timeVisible: true, secondsVisible: true },
          crosshair: { mode: 1 },
        })
        let lineSeries: any
        if (typeof chart.addSeries === 'function' && LineSeries) {
          lineSeries = chart.addSeries(LineSeries, { color: '#a855f7', lineWidth: 2, priceLineVisible: false, lastValueVisible: true })
        } else if (typeof chart.addLineSeries === 'function') {
          lineSeries = chart.addLineSeries({ color: '#a855f7', lineWidth: 2, priceLineVisible: false, lastValueVisible: true })
        }
        const basePrices: { [key: string]: number } = {
          'Volatility 100 (1s) Index': 730, 'Volatility 100 Index': 1500,
          'Volatility 75 (1s) Index': 98000, 'Volatility 75 Index': 98000,
          'Volatility 50 (1s) Index': 240, 'Volatility 50 Index': 240,
          'Volatility 25 (1s) Index': 2800, 'Volatility 25 Index': 2800,
          'Volatility 10 (1s) Index': 6500, 'Volatility 10 Index': 6500,
        }
        const startPrice = basePrices[selectedMarket] || 730
        const volatility = Math.max(1, startPrice * 0.005)
        const now = Math.floor(Date.now() / 1000)
        const initialData: { time: number; value: number }[] = []
        let basePrice = startPrice
        for (let i = 200; i >= 0; i--) {
          basePrice = basePrice + (Math.random() - 0.5) * volatility
          initialData.push({ time: now - i * 3, value: Math.round(basePrice * 100) / 100 })
        }
        lineSeries.setData(initialData as any)
        seriesRef.current = lineSeries
        chartInstance.current = chart
        priceHistoryRef.current = initialData
      } catch (err) { console.error('❌ Chart init error:', err) }
    }
    timeout = setTimeout(initChart, 300)
    const handleResize = () => {
      const container = chartRef.current
      if (container && chartInstance.current) { chartInstance.current.applyOptions({ width: container.clientWidth }) }
    }
    window.addEventListener('resize', handleResize)
    return () => {
      clearTimeout(timeout)
      window.removeEventListener('resize', handleResize)
      if (chartInstance.current) { chartInstance.current.remove(); chartInstance.current = null; seriesRef.current = null }
    }
  }, [showDashboard, isLoggedIn, selectedMarket])

  // Chart live update
  useEffect(() => {
    if (!showDashboard) return
    const tick = () => {
      if (!seriesRef.current) return
      const now = Math.floor(Date.now() / 1000)
      const lastPoint = priceHistoryRef.current[priceHistoryRef.current.length - 1]
      if (!lastPoint || now > lastPoint.time) {
        const newPoint = { time: now, value: Math.round(price * 100) / 100 }
        priceHistoryRef.current = [...priceHistoryRef.current.slice(-200), newPoint]
        try { seriesRef.current.update(newPoint as any) } catch (e) {}
      }
    }
    const interval = setInterval(tick, 1000)
    tick()
    return () => clearInterval(interval)
  }, [showDashboard, price, selectedMarket])

  const executeTrade = async (prediction: string) => {
    setIsTrading(true)
    setTradeResult(null)
    try {
      const result = Math.random() > 0.5 ? 'WIN' : 'LOSS'
      let payoutRate = 1.9
      if (prediction === 'OVER') payoutRate = overMultiplier
      else if (prediction === 'UNDER') payoutRate = underMultiplier
      else if (prediction === 'MATCHES') payoutRate = 9
      else if (prediction === 'DIFFERS') payoutRate = 1.09
      else if (prediction === 'EVEN' || prediction === 'ODD') payoutRate = 1.95
      else if (prediction === 'UP' || prediction === 'DOWN') payoutRate = 2.0
      const payout = result === 'WIN' ? stake * payoutRate : 0
      const contract = {
        id: Math.random().toString(36).substring(2, 10),
        market: selectedMarket, type: prediction, stake, entryPrice: price, result,
        payout: result === 'WIN' ? payout : -stake,
        time: new Date().toLocaleTimeString(),
      }
      if (result === 'WIN') { setBalance((prev) => prev + payout); setTradeResult(`🎉 You won! +$${payout.toFixed(2)}`) }
      else { setBalance((prev) => prev - stake); setTradeResult(`😢 You lost. -$${stake.toFixed(2)}`) }
      setOpenPositions((prev) => [contract, ...prev])
      setTimeout(() => {
        setOpenPositions((prev) => prev.filter((c) => c.id !== contract.id))
        setClosedPositions((prev) => [contract, ...prev])
      }, 5000)
      setIsTrading(false)
    } catch (error: any) { setTradeResult(`❌ Error: ${error.message}`); setIsTrading(false) }
  }

  const handleLogout = async () => { await supabase.auth.signOut(); setShowDashboard(false) }
  const resetDemo = () => { setBalance(10000); setTradeResult('Demo account reset to $10,000') }
  const toggleTheme = () => setTheme(isDark ? 'dark' : 'dark') // placeholder
  const potentialPayout = stake * 1.9

  const runDeepScan = async () => {
    setAiScanning(true)
    setAiScanProgress(0)
    setAiScannedMarkets([])

    for (let i = 0; i < aiMarkets.length; i++) {
      await new Promise((r) => setTimeout(r, 500))
      setAiScannedMarkets((prev) => [...prev, aiMarkets[i]])
      setAiScanProgress(i + 1)
    }

    // Pick a "best market" at random
    const best = aiMarkets[Math.floor(Math.random() * aiMarkets.length)]
    setAiBestMarket(best)
    setAiPrediction(Math.random() > 0.5 ? 'Even' : 'Odd')
    setAiScanning(false)
  }

  const loadScannerBot = () => {
    setSelectedMarket(aiBestMarket === 'V100 1s' ? 'Volatility 100 (1s) Index' :
                      aiBestMarket === 'V100' ? 'Volatility 100 Index' :
                      aiBestMarket === 'V75 1s' ? 'Volatility 75 (1s) Index' :
                      aiBestMarket === 'V75' ? 'Volatility 75 Index' :
                      aiBestMarket === 'V50 1s' ? 'Volatility 50 (1s) Index' :
                      aiBestMarket === 'V50' ? 'Volatility 50 Index' :
                      aiBestMarket === 'V25 1s' ? 'Volatility 25 (1s) Index' :
                      aiBestMarket === 'V25' ? 'Volatility 25 Index' :
                      aiBestMarket === 'V10 1s' ? 'Volatility 10 (1s) Index' :
                      aiBestMarket === 'V10' ? 'Volatility 10 Index' :
                      'Volatility 100 (1s) Index')
    setTradeMode('auto')
    setTradeType('digits')
    setDigitMode(aiTradeType === 'Match / Differ' ? 'matches-differs' :
                 aiTradeType === 'Over / Under' ? 'over-under' :
                 aiTradeType === 'Even / Odd' ? 'even-odd' : 'over-under')
    setBotTrade(aiPrediction === 'Even' ? 'EVEN' :
                aiPrediction === 'Odd' ? 'ODD' : 'OVER')
    setTradeResult(`✅ Loaded ${aiBestMarket} Bot with ${aiTradeType}`)
  }

  const markets = [
    'Volatility 100 (1s) Index', 'Volatility 100 Index',
    'Volatility 75 (1s) Index', 'Volatility 75 Index',
    'Volatility 50 (1s) Index', 'Volatility 50 Index',
    'Volatility 25 (1s) Index', 'Volatility 25 Index',
    'Volatility 10 (1s) Index', 'Volatility 10 Index',
  ]

  // Landing
  if (!showDashboard) {
    return (
      <main className={`min-h-screen ${isDark ? 'bg-[#0a0613] text-white' : 'bg-gray-50 text-gray-900'}`}>
        <header className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center">
              <span className="text-white font-bold text-sm">D</span>
            </div>
            <span className="font-bold text-lg">DerivEngine</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className={`px-4 py-2 text-sm border rounded-lg ${isDark ? 'border-white/20' : 'border-gray-300'}`}>Sign in</Link>
            <Link href="/register" className="px-4 py-2 text-sm text-white bg-purple-600 hover:bg-purple-700 rounded-lg font-medium">Get started</Link>
          </div>
        </header>
        <section className="max-w-7xl mx-auto px-6 py-16 lg:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-purple-500/10 border border-purple-500/30 rounded-full text-xs text-purple-400 mb-6">
                <span>⚡</span> Live volatility index trading
              </div>
              <h1 className="text-5xl lg:text-6xl font-bold leading-tight mb-4">
                Trade the markets.<br />
                <span className="bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent">Yours.</span>
              </h1>
              <p className={`text-base max-w-md mb-8 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Predict whether a Volatility Index will rise or fall. Win up to 1.9× your stake.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link href="/register" className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg">Start trading →</Link>
                <Link href="/login" className={`px-6 py-3 border font-medium rounded-lg ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-gray-200 text-gray-900'}`}>I have an account</Link>
              </div>
            </div>
            <div className="lg:justify-self-end">
              <div className={`border rounded-2xl p-6 w-full max-w-sm ${isDark ? 'bg-[#150d24] border-purple-500/20' : 'bg-white border-purple-200'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Volatility 100 Index</div>
                    <div className="text-3xl font-bold mt-1">{price.toFixed(2)}</div>
                  </div>
                  <div className="text-xs text-purple-400 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-pulse"></span> Live market
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    )
  }

  // Dashboard
  return (
    <main className={`min-h-screen ${isDark ? 'bg-[#0a0613] text-white' : 'bg-gray-50 text-gray-900'}`}>
      <nav className={`border-b ${isDark ? 'border-purple-500/20 bg-[#0d0818]' : 'border-gray-200 bg-white'}`}>
        <div className="px-6 py-3 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center">
                <span className="text-white font-bold text-sm">D</span>
              </div>
              <span className="font-bold">DerivEngine</span>
            </div>
            <div className="hidden md:flex items-center gap-1">
              <button className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 ${isDark ? 'bg-purple-500/20 text-purple-300' : 'bg-purple-100 text-purple-700'}`}>
                <span>📊</span> Trade
              </button>
              <button className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 ${isDark ? 'text-gray-400 hover:bg-white/5' : 'text-gray-600 hover:bg-gray-100'}`}>
                <span>💰</span> Wallet
              </button>
              <button className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 ${isDark ? 'text-gray-400 hover:bg-white/5' : 'text-gray-600 hover:bg-gray-100'}`}>
                <span>🕐</span> History
              </button>
              <button className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 ${isDark ? 'text-gray-400 hover:bg-white/5' : 'text-gray-600 hover:bg-gray-100'}`}>
                <span>🎁</span> Refer
              </button>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className={`hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs ${isDark ? 'bg-purple-500/10 border border-purple-500/30' : 'bg-purple-50 border border-purple-200'}`}>
              <span className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></span>
              <span className="text-purple-400 font-medium">{isLiveMode ? 'LIVE ACCOUNT' : 'DEMO ACCOUNT'}</span>
            </div>
            <button onClick={() => setIsLiveMode(!isLiveMode)} className={`hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs ${isDark ? 'bg-white/5' : 'bg-gray-100'}`}>
              <span className="text-purple-400 font-bold">$</span>
              <span>{balance.toFixed(2)}</span>
              <ChevronDown className="w-3 h-3 text-gray-400" />
            </button>
            <button className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium flex items-center gap-2">
              <span>↓</span> Deposit
            </button>
            <button onClick={handleLogout} className={`w-8 h-8 rounded-lg flex items-center justify-center ${isDark ? 'bg-white/5' : 'bg-gray-100'}`}>
              <LogOut className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </div>
      </nav>

      <div className="px-4 py-4 grid grid-cols-1 lg:grid-cols-12 gap-4 max-w-[1600px] mx-auto">
        {/* Positions */}
        <div className={`lg:col-span-2 rounded-2xl border p-4 ${isDark ? 'bg-[#0d0818] border-purple-500/20' : 'bg-white border-gray-200'}`}>
          <div className="flex gap-2 mb-4">
            <button onClick={() => setActiveTab('open')} className={`flex-1 py-2 rounded-lg text-xs font-medium ${activeTab === 'open' ? 'bg-purple-500/20 text-purple-400' : isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Open ({openPositions.length})
            </button>
            <button onClick={() => setActiveTab('closed')} className={`flex-1 py-2 rounded-lg text-xs font-medium ${activeTab === 'closed' ? 'bg-purple-500/20 text-purple-400' : isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Closed ({closedPositions.length})
            </button>
          </div>
          <div className={`text-center py-12 text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            {activeTab === 'open' && openPositions.length === 0 && 'No open positions yet.'}
            {activeTab === 'closed' && closedPositions.length === 0 && 'No closed positions yet.'}
            {activeTab === 'open' && openPositions.map((pos) => (
              <div key={pos.id} className={`mb-2 p-2 rounded-lg text-left ${isDark ? 'bg-[#150d24]' : 'bg-gray-50'}`}>
                <div className="flex justify-between text-xs">
                  <span>{pos.market}</span>
                  <span className={pos.result === 'WIN' ? 'text-purple-400' : 'text-red-400'}>
                    {pos.result === 'WIN' ? '+' : ''}${pos.payout.toFixed(2)}
                  </span>
                </div>
                <div className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>{pos.type} · ${pos.stake}</div>
              </div>
            ))}
            {activeTab === 'closed' && closedPositions.map((pos) => (
              <div key={pos.id} className={`mb-2 p-2 rounded-lg text-left ${isDark ? 'bg-[#150d24]' : 'bg-gray-50'}`}>
                <div className="flex justify-between text-xs">
                  <span>{pos.market}</span>
                  <span className={pos.result === 'WIN' ? 'text-purple-400' : 'text-red-400'}>
                    {pos.result === 'WIN' ? '+' : ''}${pos.payout.toFixed(2)}
                  </span>
                </div>
                <div className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>{pos.type} · ${pos.stake}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Chart */}
        <div className={`lg:col-span-7 rounded-2xl border p-4 ${isDark ? 'bg-[#0d0818] border-purple-500/20' : 'bg-white border-gray-200'}`}>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <select value={selectedMarket} onChange={(e) => setSelectedMarket(e.target.value)} className={`font-semibold outline-none cursor-pointer bg-transparent ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {markets.map((m) => (
                  <option key={m} value={m} className={isDark ? 'bg-[#150d24]' : 'bg-white'}>{m}</option>
                ))}
              </select>
              <span className="text-xs bg-purple-500/10 text-purple-400 px-2 py-1 rounded-full flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-pulse"></span> LIVE
              </span>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>LAST DIGIT</div>
                <div className="text-purple-400 text-2xl font-bold">{lastDigit}</div>
              </div>
              <div className="text-right">
                <div className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>PRICE</div>
                <div className="text-2xl font-bold">{price.toFixed(2)}</div>
              </div>
            </div>
          </div>
          <div className="flex gap-4 text-xs mb-3">
            <div className={isDark ? 'text-gray-400' : 'text-gray-600'}>High <span className="text-purple-400">{(price + 5).toFixed(2)}</span></div>
            <div className={isDark ? 'text-gray-400' : 'text-gray-600'}>Low <span className="text-purple-400">{(price - 5).toFixed(2)}</span></div>
          </div>
          <div ref={chartRef} className="w-full rounded-lg overflow-hidden" style={{ height: '400px', minHeight: '400px' }} />
          <div className="mt-4">
            <div className="flex justify-between items-center mb-3">
              <div className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                <span className="text-purple-400">#</span> LIVE LAST DIGITS
              </div>
              <div className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>tap a number to set your barrier</div>
            </div>
            <div className="grid grid-cols-10 gap-1">
              {digitHistory.map((digit, i) => (
                <button key={i} onClick={() => setSelectedDigit(digit)}
                  className={`aspect-square rounded-full border-2 flex flex-col items-center justify-center text-sm font-bold transition ${
                    selectedDigit === digit
                      ? 'border-purple-500 bg-purple-500/20 text-purple-400'
                      : isDark
                      ? 'border-gray-700 bg-[#150d24] text-gray-300 hover:border-purple-500/50'
                      : 'border-gray-300 bg-white text-gray-700 hover:border-purple-400'
                  }`}>
                  <span>{digit}</span>
                  <span className="text-[8px] font-normal opacity-70">{digitPercentages[i]}%</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Trading Panel */}
        <div className={`lg:col-span-3 rounded-2xl border p-4 ${isDark ? 'bg-[#0d0818] border-purple-500/20' : 'bg-white border-gray-200'}`}>
          <div className="flex gap-2 mb-3">
            <button onClick={() => setTradeMode('manual')}
              className={`flex-1 py-2 rounded-lg text-sm font-medium ${tradeMode === 'manual' ? 'bg-purple-600 text-white' : isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Manual
            </button>
            <button onClick={() => setTradeMode('auto')}
              className={`flex-1 py-2 rounded-lg text-sm font-medium ${tradeMode === 'auto' ? 'bg-purple-600 text-white' : isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Auto
            </button>
            <button onClick={() => setTradeMode('ai')}
              className={`flex-1 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-1 ${tradeMode === 'ai' ? 'bg-purple-600 text-white' : isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              ✨ AI
            </button>
          </div>

          <div className="flex gap-2 mb-3">
            <button onClick={() => setTradeType('rise-fall')} className={`flex-1 py-2 rounded-lg text-xs font-medium ${tradeType === 'rise-fall' ? 'bg-purple-600 text-white' : isDark ? 'bg-[#150d24] text-gray-400' : 'bg-gray-100 text-gray-600'}`}>Rise/Fall</button>
            <button onClick={() => setTradeType('digits')} className={`flex-1 py-2 rounded-lg text-xs font-medium ${tradeType === 'digits' ? 'bg-purple-600 text-white' : isDark ? 'bg-[#150d24] text-gray-400' : 'bg-gray-100 text-gray-600'}`}>Digits</button>
            {tradeMode !== 'auto' && (
              <button onClick={() => setTradeType('multipliers')} className={`flex-1 py-2 rounded-lg text-xs font-medium ${tradeType === 'multipliers' ? 'bg-purple-600 text-white' : isDark ? 'bg-[#150d24] text-gray-400' : 'bg-gray-100 text-gray-600'}`}>Multipliers</button>
            )}
          </div>

          <div className="flex justify-between items-center mb-2">
            <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Stake (USD)</span>
            <div className="flex items-center gap-2">
              <button onClick={resetDemo} className="text-[10px] px-2 py-0.5 border border-yellow-500/50 text-yellow-400 rounded">Reset demo</button>
              <div className={`flex items-center gap-1 text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                <span>💵</span>
                <span>${balance.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 mb-3">
            <button onClick={() => setStake(Math.max(0, stake - 1))} className={`w-10 h-12 rounded-lg text-xl font-bold ${isDark ? 'bg-[#150d24] text-white' : 'bg-gray-100 text-gray-900'}`}>−</button>
            <input type="number" value={stake} onChange={(e) => setStake(Math.max(0, Number(e.target.value)))} min={0}
              className={`flex-1 text-center text-xl font-bold rounded-lg py-3 outline-none border ${isDark ? 'bg-[#150d24] text-white border-purple-500/20' : 'bg-gray-50 text-gray-900 border-gray-200'}`} />
            <button onClick={() => setStake(stake + 1)} className={`w-10 h-12 rounded-lg text-xl font-bold ${isDark ? 'bg-[#150d24] text-white' : 'bg-gray-100 text-gray-900'}`}>+</button>
          </div>

          <div className="grid grid-cols-6 gap-1.5 mb-4">
            {[1, 5, 10, 25, 50, 100].map((val) => (
              <button key={val} onClick={() => setStake(val)}
                className={`py-2 rounded-lg text-xs font-medium ${stake === val ? 'bg-purple-600 text-white' : isDark ? 'bg-[#150d24] text-gray-300' : 'bg-gray-100 text-gray-700'}`}>
                {val}
              </button>
            ))}
          </div>

          {/* AUTO */}
          {tradeMode === 'auto' && (
            <>
              {tradeType === 'rise-fall' && (
                <>
                  <div className="mb-3">
                    <div className={`text-xs mb-2 flex items-center gap-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      <Clock className="w-3 h-3" /> Duration
                    </div>
                    <div className="grid grid-cols-5 gap-1.5">
                      {[{ v: 15, l: '15s' }, { v: 30, l: '30s' }, { v: 60, l: '1m' }, { v: 120, l: '2m' }, { v: 300, l: '5m' }].map((d) => (
                        <button key={d.v} onClick={() => setDuration(d.v)}
                          className={`py-2 rounded-lg text-xs font-medium ${duration === d.v ? 'bg-purple-600 text-white' : isDark ? 'bg-[#150d24] text-gray-300' : 'bg-gray-100 text-gray-700'}`}>
                          {d.l}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="mb-3">
                    <div className={`text-xs mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Bot trades</div>
                    <div className="grid grid-cols-2 gap-2">
                      <button onClick={() => setBotTrade('RISE')}
                        className={`py-3 rounded-lg text-xs font-bold ${botTrade === 'RISE' ? 'bg-purple-600 text-white' : isDark ? 'bg-[#150d24] text-gray-300' : 'bg-gray-100 text-gray-700'}`}>
                        RISE
                      </button>
                      <button onClick={() => setBotTrade('FALL')}
                        className={`py-3 rounded-lg text-xs font-bold ${botTrade === 'FALL' ? 'bg-purple-600 text-white' : isDark ? 'bg-[#150d24] text-gray-300' : 'bg-gray-100 text-gray-700'}`}>
                        FALL
                      </button>
                    </div>
                  </div>
                </>
              )}

              {tradeType === 'digits' && (
                <>
                  <div className="grid grid-cols-3 gap-1.5 mb-3">
                    <button onClick={() => setDigitMode('over-under')}
                      className={`py-2 rounded-lg text-xs font-medium ${digitMode === 'over-under' ? 'bg-purple-600 text-white' : isDark ? 'bg-[#150d24] text-gray-400' : 'bg-gray-100 text-gray-600'}`}>
                      Over / Under
                    </button>
                    <button onClick={() => setDigitMode('even-odd')}
                      className={`py-2 rounded-lg text-xs font-medium ${digitMode === 'even-odd' ? 'bg-purple-600 text-white' : isDark ? 'bg-[#150d24] text-gray-400' : 'bg-gray-100 text-gray-600'}`}>
                      Even / Odd
                    </button>
                    <button onClick={() => setDigitMode('matches-differs')}
                      className={`py-2 rounded-lg text-xs font-medium ${digitMode === 'matches-differs' ? 'bg-purple-600 text-white' : isDark ? 'bg-[#150d24] text-gray-400' : 'bg-gray-100 text-gray-600'}`}>
                      Matches / Differs
                    </button>
                  </div>
                  <div className={`flex items-center justify-between p-3 rounded-lg mb-3 ${isDark ? 'bg-[#150d24]' : 'bg-gray-50'}`}>
                    <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {digitMode === 'matches-differs' ? 'Target digit' : 'Barrier digit'}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="w-8 h-8 rounded-lg bg-purple-600 text-white font-bold flex items-center justify-center">{selectedDigit}</span>
                      <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>tap chart digits</span>
                    </div>
                  </div>
                  <div className="mb-3">
                    <div className={`text-xs mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Bot trades</div>
                    {digitMode === 'over-under' && (
                      <div className="grid grid-cols-2 gap-2">
                        <button onClick={() => setBotTrade('OVER')}
                          className={`py-3 rounded-lg text-xs font-bold ${botTrade === 'OVER' ? 'bg-purple-600 text-white' : isDark ? 'bg-[#150d24] text-gray-300' : 'bg-gray-100 text-gray-700'}`}>
                          OVER {selectedDigit}
                        </button>
                        <button onClick={() => setBotTrade('UNDER')}
                          className={`py-3 rounded-lg text-xs font-bold ${botTrade === 'UNDER' ? 'bg-purple-600 text-white' : isDark ? 'bg-[#150d24] text-gray-300' : 'bg-gray-100 text-gray-700'}`}>
                          UNDER {selectedDigit}
                        </button>
                      </div>
                    )}
                    {digitMode === 'even-odd' && (
                      <div className="grid grid-cols-2 gap-2">
                        <button onClick={() => setBotTrade('EVEN')}
                          className={`py-3 rounded-lg text-xs font-bold ${botTrade === 'EVEN' ? 'bg-purple-600 text-white' : isDark ? 'bg-[#150d24] text-gray-300' : 'bg-gray-100 text-gray-700'}`}>
                          EVEN
                        </button>
                        <button onClick={() => setBotTrade('ODD')}
                          className={`py-3 rounded-lg text-xs font-bold ${botTrade === 'ODD' ? 'bg-purple-600 text-white' : isDark ? 'bg-[#150d24] text-gray-300' : 'bg-gray-100 text-gray-700'}`}>
                          ODD
                        </button>
                      </div>
                    )}
                    {digitMode === 'matches-differs' && (
                      <div className="grid grid-cols-2 gap-2">
                        <button onClick={() => setBotTrade('MATCHES')}
                          className={`py-3 rounded-lg text-xs font-bold ${botTrade === 'MATCHES' ? 'bg-purple-600 text-white' : isDark ? 'bg-[#150d24] text-gray-300' : 'bg-gray-100 text-gray-700'}`}>
                          MATCHES {selectedDigit}
                        </button>
                        <button onClick={() => setBotTrade('DIFFERS')}
                          className={`py-3 rounded-lg text-xs font-bold ${botTrade === 'DIFFERS' ? 'bg-purple-600 text-white' : isDark ? 'bg-[#150d24] text-gray-300' : 'bg-gray-100 text-gray-700'}`}>
                          DIFFERS {selectedDigit}
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}

              <div className="grid grid-cols-2 gap-2 mb-3">
                <div>
                  <div className={`text-xs mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Martingale x</div>
                  <input type="number" value={martingale} onChange={(e) => setMartingale(Number(e.target.value))}
                    className={`w-full rounded-lg px-3 py-2 outline-none border text-sm ${isDark ? 'bg-[#150d24] text-white border-purple-500/20' : 'bg-gray-50 text-gray-900 border-gray-200'}`} />
                </div>
                <div>
                  <div className={`text-xs mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Max runs</div>
                  <input type="number" value={maxRuns} onChange={(e) => setMaxRuns(Number(e.target.value))}
                    className={`w-full rounded-lg px-3 py-2 outline-none border text-sm ${isDark ? 'bg-[#150d24] text-white border-purple-500/20' : 'bg-gray-50 text-gray-900 border-gray-200'}`} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-3">
                <div>
                  <div className={`text-xs mb-1 flex items-center gap-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    <span className="text-emerald-400">◉</span> Target profit ($)
                  </div>
                  <input type="number" value={targetProfit} onChange={(e) => setTargetProfit(Number(e.target.value))}
                    className={`w-full rounded-lg px-3 py-2 outline-none border text-sm ${isDark ? 'bg-[#150d24] text-white border-purple-500/20' : 'bg-gray-50 text-gray-900 border-gray-200'}`} />
                </div>
                <div>
                  <div className={`text-xs mb-1 flex items-center gap-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    <span className="text-red-400">◉</span> Stop loss ($)
                  </div>
                  <input type="number" value={stopLoss} onChange={(e) => setStopLoss(Number(e.target.value))}
                    className={`w-full rounded-lg px-3 py-2 outline-none border text-sm ${isDark ? 'bg-[#150d24] text-white border-purple-500/20' : 'bg-gray-50 text-gray-900 border-gray-200'}`} />
                </div>
              </div>

              <button onClick={() => setIsBotRunning(!isBotRunning)}
                className="w-full py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-xl font-bold text-sm transition flex items-center justify-center gap-2 mb-2">
                <Play className="w-4 h-4" /> {isBotRunning ? 'Stop bot' : 'Start bot'}
              </button>

              <p className={`text-[10px] leading-relaxed ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                ℹ️ The bot auto-places trades and multiplies your stake after a loss (martingale). It stops at your target profit, stop loss, or max runs. Keep this tab open while it runs.
              </p>
            </>
          )}

          {/* MANUAL */}
          {tradeMode === 'manual' && (
            <>
              {tradeType === 'rise-fall' && (
                <>
                  <div className="mb-3">
                    <div className={`text-xs mb-2 flex items-center gap-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      <Clock className="w-3 h-3" /> Duration
                    </div>
                    <div className="grid grid-cols-5 gap-1.5">
                      {[{ v: 15, l: '15s' }, { v: 30, l: '30s' }, { v: 60, l: '1m' }, { v: 120, l: '2m' }, { v: 300, l: '5m' }].map((d) => (
                        <button key={d.v} onClick={() => setDuration(d.v)}
                          className={`py-2 rounded-lg text-xs font-medium ${duration === d.v ? 'bg-purple-600 text-white' : isDark ? 'bg-[#150d24] text-gray-300' : 'bg-gray-100 text-gray-700'}`}>
                          {d.l}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className={`flex justify-between items-center p-3 rounded-lg mb-3 ${isDark ? 'bg-[#150d24]' : 'bg-gray-50'}`}>
                    <div className={`text-xs flex items-center gap-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      <Zap className="w-3 h-3 text-purple-400" /> Potential payout
                    </div>
                    <div className="text-purple-400 font-bold">${potentialPayout.toFixed(2)}</div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => executeTrade('RISE')} disabled={isTrading}
                      className="py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition disabled:opacity-50">
                      <div className="flex flex-col items-center">
                        <span className="font-bold text-sm">↑ RISE</span>
                        <span className="text-[10px] opacity-80">higher</span>
                      </div>
                    </button>
                    <button onClick={() => executeTrade('FALL')} disabled={isTrading}
                      className="py-4 bg-red-600 hover:bg-red-500 text-white rounded-xl transition disabled:opacity-50">
                      <div className="flex flex-col items-center">
                        <span className="font-bold text-sm">↓ FALL</span>
                        <span className="text-[10px] opacity-80">lower</span>
                      </div>
                    </button>
                  </div>
                </>
              )}

              {tradeType === 'digits' && (
                <>
                  <div className="grid grid-cols-3 gap-1.5 mb-3">
                    <button onClick={() => setDigitMode('over-under')}
                      className={`py-2 rounded-lg text-xs font-medium ${digitMode === 'over-under' ? 'bg-purple-600 text-white' : isDark ? 'bg-[#150d24] text-gray-400' : 'bg-gray-100 text-gray-600'}`}>
                      Over / Under
                    </button>
                    <button onClick={() => setDigitMode('even-odd')}
                      className={`py-2 rounded-lg text-xs font-medium ${digitMode === 'even-odd' ? 'bg-purple-600 text-white' : isDark ? 'bg-[#150d24] text-gray-400' : 'bg-gray-100 text-gray-600'}`}>
                      Even / Odd
                    </button>
                    <button onClick={() => setDigitMode('matches-differs')}
                      className={`py-2 rounded-lg text-xs font-medium ${digitMode === 'matches-differs' ? 'bg-purple-600 text-white' : isDark ? 'bg-[#150d24] text-gray-400' : 'bg-gray-100 text-gray-600'}`}>
                      Matches / Differs
                    </button>
                  </div>
                  <div className={`flex items-center justify-between p-3 rounded-lg mb-3 ${isDark ? 'bg-[#150d24]' : 'bg-gray-50'}`}>
                    <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {digitMode === 'matches-differs' ? 'Target digit' : 'Barrier digit'}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="w-8 h-8 rounded-lg bg-purple-600 text-white font-bold flex items-center justify-center">{selectedDigit}</span>
                      <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>tap chart digits</span>
                    </div>
                  </div>
                  {digitMode === 'over-under' && (
                    <div className="grid grid-cols-2 gap-2">
                      <button onClick={() => { setDigitSide('OVER'); executeTrade('OVER') }} disabled={isTrading}
                        className={`py-3 text-white rounded-xl transition disabled:opacity-50 ${digitSide === 'OVER' ? 'bg-emerald-500 ring-2 ring-emerald-400' : 'bg-emerald-600 hover:bg-emerald-500'}`}>
                        <div className="flex items-center justify-between px-2">
                          <span className="font-bold text-xs">OVER {selectedDigit}</span>
                          <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded">+{overPercent}%</span>
                        </div>
                        <div className="text-[10px] opacity-90 mt-0.5 px-2 text-left">Payout ${(stake * overMultiplier).toFixed(2)}</div>
                      </button>
                      <button onClick={() => { setDigitSide('UNDER'); executeTrade('UNDER') }} disabled={isTrading}
                        className={`py-3 text-white rounded-xl transition disabled:opacity-50 ${digitSide === 'UNDER' ? 'bg-red-500 ring-2 ring-red-400' : 'bg-red-600 hover:bg-red-500'}`}>
                        <div className="flex items-center justify-between px-2">
                          <span className="font-bold text-xs">UNDER {selectedDigit}</span>
                          <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded">+{underPercent}%</span>
                        </div>
                        <div className="text-[10px] opacity-90 mt-0.5 px-2 text-left">Payout ${(stake * underMultiplier).toFixed(2)}</div>
                      </button>
                    </div>
                  )}
                  {digitMode === 'even-odd' && (
                    <div className="grid grid-cols-2 gap-2">
                      <button onClick={() => { setDigitSide('EVEN'); executeTrade('EVEN') }} disabled={isTrading}
                        className={`py-3 text-white rounded-xl transition disabled:opacity-50 ${digitSide === 'EVEN' ? 'bg-emerald-500 ring-2 ring-emerald-400' : 'bg-emerald-600 hover:bg-emerald-500'}`}>
                        <div className="flex items-center justify-between px-2">
                          <span className="font-bold text-xs">EVEN</span>
                          <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded">+95%</span>
                        </div>
                        <div className="text-[10px] opacity-90 mt-0.5 px-2 text-left">Payout ${(stake * 1.95).toFixed(2)}</div>
                      </button>
                      <button onClick={() => { setDigitSide('ODD'); executeTrade('ODD') }} disabled={isTrading}
                        className={`py-3 text-white rounded-xl transition disabled:opacity-50 ${digitSide === 'ODD' ? 'bg-red-500 ring-2 ring-red-400' : 'bg-red-600 hover:bg-red-500'}`}>
                        <div className="flex items-center justify-between px-2">
                          <span className="font-bold text-xs">ODD</span>
                          <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded">+95%</span>
                        </div>
                        <div className="text-[10px] opacity-90 mt-0.5 px-2 text-left">Payout ${(stake * 1.95).toFixed(2)}</div>
                      </button>
                    </div>
                  )}
                  {digitMode === 'matches-differs' && (
                    <div className="grid grid-cols-2 gap-2">
                      <button onClick={() => { setDigitSide('MATCHES'); executeTrade('MATCHES') }} disabled={isTrading}
                        className={`py-3 text-white rounded-xl transition disabled:opacity-50 ${digitSide === 'MATCHES' ? 'bg-emerald-500 ring-2 ring-emerald-400' : 'bg-emerald-600 hover:bg-emerald-500'}`}>
                        <div className="flex items-center justify-between px-2">
                          <span className="font-bold text-xs">MATCHES {selectedDigit}</span>
                          <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded">+800%</span>
                        </div>
                        <div className="text-[10px] opacity-90 mt-0.5 px-2 text-left">Payout ${(stake * 9).toFixed(2)}</div>
                      </button>
                      <button onClick={() => { setDigitSide('DIFFERS'); executeTrade('DIFFERS') }} disabled={isTrading}
                        className={`py-3 text-white rounded-xl transition disabled:opacity-50 ${digitSide === 'DIFFERS' ? 'bg-red-500 ring-2 ring-red-400' : 'bg-red-600 hover:bg-red-500'}`}>
                        <div className="flex items-center justify-between px-2">
                          <span className="font-bold text-xs">DIFFERS</span>
                          <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded">+9%</span>
                        </div>
                        <div className="text-[10px] opacity-90 mt-0.5 px-2 text-left">Payout ${(stake * 1.09).toFixed(2)}</div>
                      </button>
                    </div>
                  )}
                </>
              )}

              {tradeType === 'multipliers' && (
                <>
                  <div className="mb-3">
                    <div className={`text-xs mb-2 flex items-center gap-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      📈 Multiplier
                    </div>
                    <div className="grid grid-cols-4 gap-1.5">
                      {[100, 200, 400, 1000].map((m) => (
                        <button key={m} onClick={() => setMultiplier(m)}
                          className={`py-2 rounded-lg text-xs font-medium ${multiplier === m ? 'bg-purple-600 text-white' : isDark ? 'bg-[#150d24] text-gray-300' : 'bg-gray-100 text-gray-700'}`}>
                          x{m}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className={`p-3 rounded-lg mb-3 ${isDark ? 'bg-[#150d24]' : 'bg-gray-50'}`}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>P&L moves</span>
                      <span className="text-purple-400 font-medium">{multiplier}x market</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Stop out at</span>
                      <span className="text-red-400 font-medium">
                        {multiplier === 100 ? '1.00% move' :
                         multiplier === 200 ? '0.50% move' :
                         multiplier === 400 ? '0.25% move' :
                         multiplier === 1000 ? '0.10% move' : '1.00% move'}
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => executeTrade('UP')} disabled={isTrading}
                      className="py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition disabled:opacity-50">
                      <div className="flex flex-col items-center">
                        <span className="font-bold text-sm">↑ UP</span>
                        <span className="text-[10px] opacity-80">higher</span>
                      </div>
                    </button>
                    <button onClick={() => executeTrade('DOWN')} disabled={isTrading}
                      className="py-4 bg-red-600 hover:bg-red-500 text-white rounded-xl transition disabled:opacity-50">
                      <div className="flex flex-col items-center">
                        <span className="font-bold text-sm">↓ DOWN</span>
                        <span className="text-[10px] opacity-80">lower</span>
                      </div>
                    </button>
                  </div>
                </>
              )}
            </>
          )}

          {tradeResult && (
            <div className={`mt-3 p-3 rounded-lg text-center text-sm ${tradeResult.includes('won') ? 'bg-purple-500/20 text-purple-300' : 'bg-red-500/20 text-red-300'}`}>
              {tradeResult}
            </div>
          )}
        </div>
      </div>

      {/* AI Entry Scanner Modal */}
      {tradeMode === 'ai' && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className={`w-full max-w-md rounded-2xl border ${isDark ? 'bg-white border-gray-200' : 'bg-white border-gray-200'}`}>
            {/* Header */}
            <div className="flex items-start justify-between p-5 border-b border-gray-200">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-gray-900">Entry Scanner</h3>
                  <p className="text-xs text-gray-500">
                    Deep-scans 10 markets for the best entry
                  </p>
                </div>
              </div>
              <button
                onClick={() => setTradeMode('manual')}
                className="w-8 h-8 rounded-lg flex items-center justify-center bg-gray-100 hover:bg-gray-200"
              >
                <X className="w-4 h-4 text-gray-600" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5">
              {/* Trade type */}
              <div className="mb-4">
                <label className="text-xs block mb-2 text-gray-600">Trade type</label>
                <select
                  value={aiTradeType}
                  onChange={(e) => setAiTradeType(e.target.value)}
                  className="w-full rounded-lg px-4 py-3 outline-none border text-sm font-medium bg-gray-50 text-gray-900 border-gray-200"
                >
                  <option>Match / Differ</option>
                  <option>Over / Under</option>
                  <option>Even / Odd</option>
                  <option>Rise / Fall</option>
                </select>
              </div>

              {/* Scanning State */}
              {aiScanning && (
                <>
                  <div className="mb-4 p-5 rounded-2xl bg-purple-50 border border-purple-100 text-center">
                    <div className="w-14 h-14 mx-auto rounded-full bg-purple-500/20 flex items-center justify-center mb-3 animate-pulse">
                      <Sparkles className="w-6 h-6 text-purple-600" />
                    </div>
                    <div className="text-gray-900 font-bold">Deep scanning</div>
                    <div className="text-xs text-gray-500 mb-3">Volatility 75 (1s) Index</div>
                    <div className="flex flex-wrap justify-center gap-1">
                      {aiMarkets.map((m) => (
                        <span key={m}
                          className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                            aiScannedMarkets.includes(m)
                              ? 'bg-emerald-500/20 text-emerald-600 line-through'
                              : 'bg-purple-500/20 text-purple-600'
                          }`}>
                          ✓ {m}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs text-gray-500">Analyzing...</span>
                      <span className="text-xs font-medium text-gray-600">{aiScanProgress}/10</span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden bg-gray-100">
                      <div
                        className="h-full bg-purple-500 transition-all duration-300"
                        style={{ width: `${(aiScanProgress / 10) * 100}%` }}
                      />
                    </div>
                  </div>

                  <button
                    disabled
                    className="w-full py-3.5 bg-purple-400/60 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 mb-3 cursor-not-allowed"
                  >
                    <Search className="w-4 h-4" />
                    Scanning...
                  </button>

                  <button
                    disabled
                    className="w-full py-3.5 rounded-xl font-bold text-sm bg-gray-100 text-gray-400 cursor-not-allowed"
                  >
                    Load Scanner Bot
                  </button>
                </>
              )}

              {/* Done State */}
              {!aiScanning && aiScanProgress === 10 && (
                <>
                  <div className="mb-4">
                    <label className="text-xs block mb-2 text-gray-600">Selected market</label>
                    <div className="w-full rounded-lg px-4 py-3 border text-sm font-medium bg-gray-50 text-gray-900 border-gray-200">
                      {aiBestMarket === 'V100 1s' ? 'Volatility 100 (1s) Index' :
                       aiBestMarket === 'V100' ? 'Volatility 100 Index' :
                       aiBestMarket === 'V75 1s' ? 'Volatility 75 (1s) Index' :
                       aiBestMarket === 'V75' ? 'Volatility 75 Index' :
                       aiBestMarket === 'V50 1s' ? 'Volatility 50 (1s) Index' :
                       aiBestMarket === 'V50' ? 'Volatility 50 Index' :
                       aiBestMarket === 'V25 1s' ? 'Volatility 25 (1s) Index' :
                       aiBestMarket === 'V25' ? 'Volatility 25 Index' :
                       aiBestMarket === 'V10 1s' ? 'Volatility 10 (1s) Index' :
                       aiBestMarket === 'V10' ? 'Volatility 10 Index' :
                       'Volatility 100 (1s) Index'}
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="text-xs block mb-2 text-gray-600">Trade type</label>
                    <div className="w-full rounded-lg px-4 py-3 border text-sm font-medium bg-gray-50 text-gray-900 border-gray-200">
                      {aiTradeType}
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="text-xs block mb-2 text-gray-600">Prediction (auto)</label>
                    <div className="w-full rounded-lg px-4 py-3 border text-sm font-medium bg-gray-50 text-gray-900 border-gray-200">
                      {aiPrediction}
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs text-gray-500">Scan complete</span>
                      <span className="text-xs font-medium text-gray-600">{aiScanProgress}/10</span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden bg-gray-100">
                      <div className="h-full bg-purple-500 w-full" />
                    </div>
                  </div>

                  <button
                    onClick={runDeepScan}
                    className="w-full py-3.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold text-sm transition flex items-center justify-center gap-2 mb-3"
                  >
                    <Search className="w-4 h-4" />
                    Re-scan for Best Market
                  </button>

                  <button
                    onClick={loadScannerBot}
                    className="w-full py-3.5 rounded-xl font-bold text-sm bg-white text-purple-600 border border-purple-300 hover:bg-purple-50 transition"
                  >
                    Load {aiBestMarket} Bot
                  </button>
                </>
              )}

              {/* Initial State */}
              {!aiScanning && aiScanProgress === 0 && (
                <>
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs text-gray-500">Ready to scan</span>
                      <span className="text-xs font-medium text-gray-600">0/10</span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden bg-gray-100" />
                  </div>

                  <button
                    onClick={runDeepScan}
                    className="w-full py-3.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold text-sm transition flex items-center justify-center gap-2 mb-3"
                  >
                    <Search className="w-4 h-4" />
                    Deep Scan for Best Market
                  </button>

                  <button
                    disabled
                    className="w-full py-3.5 rounded-xl font-bold text-sm bg-gray-100 text-gray-400 cursor-not-allowed"
                  >
                    Load Scanner Bot
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  )
}