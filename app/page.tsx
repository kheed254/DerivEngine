'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { DerivClient } from '@/lib/derivClient'
import { Loader2, ChevronDown, LogOut } from 'lucide-react'

export default function HomePage() {
  const [price, setPrice] = useState(730.69)
  const [lastDigit, setLastDigit] = useState(9)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [isDerivConnected, setIsDerivConnected] = useState(false)
  const [balance, setBalance] = useState(10000)
  const [isLiveMode, setIsLiveMode] = useState(false)
  const [stake, setStake] = useState(10)
  const [selectedMarket, setSelectedMarket] = useState('Volatility 100 (1s) Index')
  const [isTrading, setIsTrading] = useState(false)
  const [tradeResult, setTradeResult] = useState<string | null>(null)
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')
  const [openPositions, setOpenPositions] = useState<any[]>([])
  const [closedPositions, setClosedPositions] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState<'open' | 'closed'>('open')
  const [tradeType, setTradeType] = useState<'rise-fall' | 'digits' | 'multipliers'>('rise-fall')
  const [digitMode, setDigitMode] = useState<'over-under' | 'even-odd' | 'matches-differs'>('over-under')
  const [selectedDigit, setSelectedDigit] = useState<number>(5)
  const [showDashboard, setShowDashboard] = useState(false)
  const [digitHistory] = useState<number[]>([0, 1, 2, 3, 4, 5, 6, 7, 8, 9])
  const [digitPercentages] = useState<number[]>([4, 12, 10, 12, 20, 8, 8, 18, 0, 14])

  const chartRef = useRef<HTMLDivElement>(null)
  const chartInstance = useRef<any>(null)
  const seriesRef = useRef<any>(null)
  const priceHistoryRef = useRef<{ time: number; value: number }[]>([])

  const isDark = theme === 'dark'

  // Check auth
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

  // Reset price when market changes
  useEffect(() => {
    if (!showDashboard) return
    const basePrices: { [key: string]: number } = {
      'Volatility 100 (1s) Index': 730,
      'Volatility 100 Index': 1500,
      'Volatility 75 (1s) Index': 98000,
      'Volatility 75 Index': 98000,
      'Volatility 50 (1s) Index': 240,
      'Volatility 50 Index': 240,
      'Volatility 25 (1s) Index': 2800,
      'Volatility 25 Index': 2800,
      'Volatility 10 (1s) Index': 6500,
      'Volatility 10 Index': 6500,
    }
    const base = basePrices[selectedMarket] || 730
    setPrice(base)
    const digit = Math.floor(base * 100) % 10
    setLastDigit(digit)
  }, [selectedMarket, showDashboard])

  // Connect to Deriv + always-on simulation
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
          const digit = Math.floor(newPrice * 100) % 10
          setLastDigit(digit)
        })
        await derivClient.subscribeToTicks('1HZ100V')
        setIsDerivConnected(true)
      } catch (error) {
        setIsDerivConnected(false)
      }

      fallbackInterval = setInterval(() => {
        if (!isMounted) return
        setPrice((prev) => {
          const next = Math.max(100, prev + (Math.random() - 0.5) * 2)
          const digit = Math.floor(next * 100) % 10
          setLastDigit(digit)
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

  // Setup chart — re-runs when market changes
  useEffect(() => {
    if (!showDashboard) return

    let timeout: NodeJS.Timeout

    const initChart = async () => {
      try {
        const container = chartRef.current
        if (!container) {
          timeout = setTimeout(initChart, 500)
          return
        }

        const lib: any = await import('lightweight-charts')
        const createChart = lib.createChart
        const LineStyle = lib.LineStyle
        const LineSeries = lib.LineSeries

        if (chartInstance.current) {
          chartInstance.current.remove()
          chartInstance.current = null
        }

        const chart = createChart(container, {
          width: container.clientWidth,
          height: 400,
          layout: {
            background: { color: 'transparent' },
            textColor: '#9ca3af',
          },
          grid: {
            vertLines: { color: 'rgba(255, 255, 255, 0.05)', style: LineStyle?.Dotted ?? 2 },
            horzLines: { color: 'rgba(255, 255, 255, 0.05)', style: LineStyle?.Dotted ?? 2 },
          },
          rightPriceScale: {
            borderColor: 'rgba(255, 255, 255, 0.1)',
            scaleMargins: { top: 0.1, bottom: 0.1 },
          },
          timeScale: {
            borderColor: 'rgba(255, 255, 255, 0.1)',
            timeVisible: true,
            secondsVisible: true,
          },
          crosshair: {
            mode: 1,
          },
        })

        let lineSeries: any
        if (typeof chart.addSeries === 'function' && LineSeries) {
          lineSeries = chart.addSeries(LineSeries, {
            color: '#a855f7',
            lineWidth: 2,
            priceLineVisible: false,
            lastValueVisible: true,
          })
        } else if (typeof chart.addLineSeries === 'function') {
          lineSeries = chart.addLineSeries({
            color: '#a855f7',
            lineWidth: 2,
            priceLineVisible: false,
            lastValueVisible: true,
          })
        } else {
          throw new Error('No compatible chart series method found')
        }

        const basePrices: { [key: string]: number } = {
          'Volatility 100 (1s) Index': 730,
          'Volatility 100 Index': 1500,
          'Volatility 75 (1s) Index': 98000,
          'Volatility 75 Index': 98000,
          'Volatility 50 (1s) Index': 240,
          'Volatility 50 Index': 240,
          'Volatility 25 (1s) Index': 2800,
          'Volatility 25 Index': 2800,
          'Volatility 10 (1s) Index': 6500,
          'Volatility 10 Index': 6500,
        }
        const startPrice = basePrices[selectedMarket] || 730
        const volatility = Math.max(1, startPrice * 0.005)

        const now = Math.floor(Date.now() / 1000)
        const initialData: { time: number; value: number }[] = []
        let basePrice = startPrice
        for (let i = 200; i >= 0; i--) {
          basePrice = basePrice + (Math.random() - 0.5) * volatility
          initialData.push({
            time: now - i * 3,
            value: Math.round(basePrice * 100) / 100,
          })
        }

        lineSeries.setData(initialData as any)
        seriesRef.current = lineSeries
        chartInstance.current = chart
        priceHistoryRef.current = initialData

        console.log('✅ Chart initialized for', selectedMarket)
      } catch (err) {
        console.error('❌ Chart init error:', err)
      }
    }

    timeout = setTimeout(initChart, 300)

    const handleResize = () => {
      const container = chartRef.current
      if (container && chartInstance.current) {
        chartInstance.current.applyOptions({
          width: container.clientWidth,
        })
      }
    }
    window.addEventListener('resize', handleResize)

    return () => {
      clearTimeout(timeout)
      window.removeEventListener('resize', handleResize)
      if (chartInstance.current) {
        chartInstance.current.remove()
        chartInstance.current = null
        seriesRef.current = null
      }
    }
  }, [showDashboard, isLoggedIn, selectedMarket])

  // Update chart with live price
  useEffect(() => {
    if (!showDashboard) return

    const tick = () => {
      if (!seriesRef.current) return
      const now = Math.floor(Date.now() / 1000)
      const lastPoint = priceHistoryRef.current[priceHistoryRef.current.length - 1]

      if (!lastPoint || now > lastPoint.time) {
        const newPoint = { time: now, value: Math.round(price * 100) / 100 }
        priceHistoryRef.current = [...priceHistoryRef.current.slice(-200), newPoint]
        try {
          seriesRef.current.update(newPoint as any)
        } catch (e) {
          // ignore
        }
      }
    }

    const interval = setInterval(tick, 1000)
    tick()
    return () => clearInterval(interval)
  }, [showDashboard, price, selectedMarket])

  // Execute a trade
  const executeTrade = async (prediction: 'RISE' | 'FALL' | 'DIGIT' | 'OVER' | 'UNDER') => {
    setIsTrading(true)
    setTradeResult(null)

    try {
      const result = Math.random() > 0.5 ? 'WIN' : 'LOSS'
      const payout = result === 'WIN' ? stake * 1.9 : 0

      const contract = {
        id: Math.random().toString(36).substring(2, 10),
        market: selectedMarket,
        type: prediction === 'DIGIT' ? `Digits ${selectedDigit}` : 
              prediction === 'OVER' ? `Over ${selectedDigit}` :
              prediction === 'UNDER' ? `Under ${selectedDigit}` :
              prediction,
        stake: stake,
        entryPrice: price,
        result: result,
        payout: result === 'WIN' ? payout : -stake,
        time: new Date().toLocaleTimeString(),
      }

      if (result === 'WIN') {
        setBalance((prev) => prev + payout)
        setTradeResult(`🎉 You won! +$${payout.toFixed(2)}`)
      } else {
        setBalance((prev) => prev - stake)
        setTradeResult(`😢 You lost. -$${stake.toFixed(2)}`)
      }

      setOpenPositions((prev) => [contract, ...prev])
      setTimeout(() => {
        setOpenPositions((prev) => prev.filter((c) => c.id !== contract.id))
        setClosedPositions((prev) => [contract, ...prev])
      }, 5000)

      setIsTrading(false)
    } catch (error: any) {
      setTradeResult(`❌ Error: ${error.message || 'Unknown error'}`)
      setIsTrading(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setShowDashboard(false)
  }

  const toggleTheme = () => setTheme(isDark ? 'light' : 'dark')

  const markets = [
    'Volatility 100 (1s) Index',
    'Volatility 100 Index',
    'Volatility 75 (1s) Index',
    'Volatility 75 Index',
    'Volatility 50 (1s) Index',
    'Volatility 50 Index',
    'Volatility 25 (1s) Index',
    'Volatility 25 Index',
    'Volatility 10 (1s) Index',
    'Volatility 10 Index',
  ]

  // ═══════════════════════════════════════════════
  // LANDING PAGE
  // ═══════════════════════════════════════════════
  if (!showDashboard) {
    return (
      <main className={`min-h-screen transition-colors ${isDark ? 'bg-[#0a0613] text-white' : 'bg-gray-50 text-gray-900'}`}>
        <header className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center">
              <span className="text-white font-bold text-sm">D</span>
            </div>
            <span className={`font-bold text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>DerivEngine</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className={`w-9 h-9 rounded-full border flex items-center justify-center ${isDark ? 'bg-white/5 border-white/10' : 'bg-gray-100 border-gray-200'}`}
            >
              <span className="text-sm">{isDark ? '☀️' : '🌙'}</span>
            </button>
            <Link href="/login" className={`px-4 py-2 text-sm border rounded-lg ${isDark ? 'text-white border-white/20' : 'text-gray-900 border-gray-300'}`}>
              Sign in
            </Link>
            <Link href="/register" className="px-4 py-2 text-sm text-white bg-purple-600 hover:bg-purple-700 rounded-lg font-medium">
              Get started
            </Link>
          </div>
        </header>

        <section className="max-w-7xl mx-auto px-6 py-16 lg:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-purple-500/10 border border-purple-500/30 rounded-full text-xs text-purple-400 mb-6">
                <span>⚡</span>
                Live volatility index trading
              </div>
              <h1 className={`text-5xl lg:text-6xl font-bold leading-tight mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Trade the markets.<br />
                <span className="bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent">Yours.</span>
              </h1>
              <p className={`text-base max-w-md mb-8 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Predict whether a Volatility Index will rise or fall. Win up to 1.9× your stake.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link href="/register" className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition">
                  Start trading →
                </Link>
                <Link href="/login" className={`px-6 py-3 border font-medium rounded-lg ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-gray-200 text-gray-900'}`}>
                  I have an account
                </Link>
              </div>
            </div>
            <div className="lg:justify-self-end">
              <div className={`border rounded-2xl p-6 w-full max-w-sm ${isDark ? 'bg-[#150d24] border-purple-500/20' : 'bg-white border-purple-200'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Volatility 100 Index</div>
                    <div className={`text-3xl font-bold mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>{price.toFixed(2)}</div>
                  </div>
                  <div className="text-xs text-purple-400 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-pulse"></span>
                    Live market
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    )
  }

  // ═══════════════════════════════════════════════
  // DASHBOARD
  // ═══════════════════════════════════════════════
  return (
    <main className={`min-h-screen ${isDark ? 'bg-[#0a0613] text-white' : 'bg-gray-50 text-gray-900'}`}>
      {/* Top Navigation */}
      <nav className={`border-b ${isDark ? 'border-purple-500/20 bg-[#0d0818]' : 'border-gray-200 bg-white'}`}>
        <div className="px-6 py-3 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center">
                <span className="text-white font-bold text-sm">D</span>
              </div>
              <span className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>DerivEngine</span>
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

            <button
              onClick={() => setIsLiveMode(!isLiveMode)}
              className={`hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs ${isDark ? 'bg-white/5' : 'bg-gray-100'}`}
            >
              <span className="text-purple-400 font-bold">$</span>
              <span className={isDark ? 'text-white' : 'text-gray-900'}>{balance.toFixed(2)}</span>
              <ChevronDown className="w-3 h-3 text-gray-400" />
            </button>

            <button className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium flex items-center gap-2">
              <span>↓</span> Deposit
            </button>

            <button
              onClick={toggleTheme}
              className={`w-8 h-8 rounded-lg flex items-center justify-center ${isDark ? 'bg-white/5' : 'bg-gray-100'}`}
            >
              <span className="text-sm">{isDark ? '☀️' : '🌙'}</span>
            </button>

            <button
              onClick={handleLogout}
              className={`w-8 h-8 rounded-lg flex items-center justify-center ${isDark ? 'bg-white/5' : 'bg-gray-100'}`}
            >
              <LogOut className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="px-4 py-4 grid grid-cols-1 lg:grid-cols-12 gap-4 max-w-[1600px] mx-auto">

        {/* LEFT: Positions Panel */}
        <div className={`lg:col-span-2 rounded-2xl border p-4 ${isDark ? 'bg-[#0d0818] border-purple-500/20' : 'bg-white border-gray-200'}`}>
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setActiveTab('open')}
              className={`flex-1 py-2 rounded-lg text-xs font-medium ${activeTab === 'open' ? 'bg-purple-500/20 text-purple-400' : isDark ? 'text-gray-400' : 'text-gray-600'}`}
            >
              Open ({openPositions.length})
            </button>
            <button
              onClick={() => setActiveTab('closed')}
              className={`flex-1 py-2 rounded-lg text-xs font-medium ${activeTab === 'closed' ? 'bg-purple-500/20 text-purple-400' : isDark ? 'text-gray-400' : 'text-gray-600'}`}
            >
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

        {/* MIDDLE: Chart + Digits */}
        <div className={`lg:col-span-7 rounded-2xl border p-4 ${isDark ? 'bg-[#0d0818] border-purple-500/20' : 'bg-white border-gray-200'}`}>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <select
                value={selectedMarket}
                onChange={(e) => setSelectedMarket(e.target.value)}
                className={`font-semibold outline-none cursor-pointer bg-transparent ${isDark ? 'text-white' : 'text-gray-900'}`}
              >
                {markets.map((m) => (
                  <option key={m} value={m} className={isDark ? 'bg-[#150d24]' : 'bg-white'}>{m}</option>
                ))}
              </select>
              <span className="text-xs bg-purple-500/10 text-purple-400 px-2 py-1 rounded-full flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-pulse"></span>
                LIVE
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
            <div className={isDark ? 'text-gray-400' : 'text-gray-600'}>
              High <span className="text-purple-400">{(price + 5).toFixed(2)}</span>
            </div>
            <div className={isDark ? 'text-gray-400' : 'text-gray-600'}>
              Low <span className="text-purple-400">{(price - 5).toFixed(2)}</span>
            </div>
          </div>

          <div
            ref={chartRef}
            className="w-full rounded-lg overflow-hidden"
            style={{ height: '400px', minHeight: '400px' }}
          />

          <div className="mt-4">
            <div className="flex justify-between items-center mb-3">
              <div className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                <span className="text-purple-400">#</span> LIVE LAST DIGITS
              </div>
              <div className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>tap a number to set your barrier</div>
            </div>
            <div className="grid grid-cols-10 gap-1">
              {digitHistory.map((digit, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedDigit(digit)}
                  className={`aspect-square rounded-full border-2 flex flex-col items-center justify-center text-sm font-bold transition ${
                    selectedDigit === digit
                      ? 'border-purple-500 bg-purple-500/20 text-purple-400'
                      : isDark
                      ? 'border-gray-700 bg-[#150d24] text-gray-300 hover:border-purple-500/50'
                      : 'border-gray-300 bg-white text-gray-700 hover:border-purple-400'
                  }`}
                >
                  <span>{digit}</span>
                  <span className="text-[8px] font-normal opacity-70">{digitPercentages[i]}%</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT: Trading Panel */}
        <div className={`lg:col-span-3 rounded-2xl border p-4 ${isDark ? 'bg-[#0d0818] border-purple-500/20' : 'bg-white border-gray-200'}`}>
          <div className="flex gap-2 mb-4">
            <button className="flex-1 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium">Manual</button>
            <button className={`flex-1 py-2 rounded-lg text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Auto</button>
            <button className={`flex-1 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              ✨ AI
            </button>
          </div>

          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setTradeType('rise-fall')}
              className={`flex-1 py-2 rounded-lg text-xs font-medium ${tradeType === 'rise-fall' ? 'bg-purple-500/20 text-purple-400' : isDark ? 'bg-[#150d24] text-gray-400' : 'bg-gray-100 text-gray-600'}`}
            >
              Rise/Fall
            </button>
            <button
              onClick={() => setTradeType('digits')}
              className={`flex-1 py-2 rounded-lg text-xs font-medium ${tradeType === 'digits' ? 'bg-purple-500/20 text-purple-400' : isDark ? 'bg-[#150d24] text-gray-400' : 'bg-gray-100 text-gray-600'}`}
            >
              Digits
            </button>
            <button
              onClick={() => setTradeType('multipliers')}
              className={`flex-1 py-2 rounded-lg text-xs font-medium ${tradeType === 'multipliers' ? 'bg-purple-500/20 text-purple-400' : isDark ? 'bg-[#150d24] text-gray-400' : 'bg-gray-100 text-gray-600'}`}
            >
              Multipliers
            </button>
          </div>

          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Stake (USD)</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setStake(Math.max(1, stake - 1))}
                className={`w-10 h-12 rounded-lg text-xl font-bold ${isDark ? 'bg-[#150d24] text-white' : 'bg-gray-100 text-gray-900'}`}
              >
                −
              </button>
              <input
                type="number"
                value={stake}
                onChange={(e) => setStake(Math.max(1, Number(e.target.value)))}
                min={1}
                className={`flex-1 text-center text-xl font-bold rounded-lg py-3 outline-none border ${isDark ? 'bg-[#150d24] text-white border-purple-500/20' : 'bg-gray-50 text-gray-900 border-gray-200'}`}
              />
              <button
                onClick={() => setStake(stake + 1)}
                className={`w-10 h-12 rounded-lg text-xl font-bold ${isDark ? 'bg-[#150d24] text-white' : 'bg-gray-100 text-gray-900'}`}
              >
                +
              </button>
            </div>
          </div>

          {/* Quick stake buttons */}
          <div className="grid grid-cols-6 gap-1.5 mb-2">
            {[1, 5, 10, 25, 50, 100].map((val) => (
              <button
                key={val}
                onClick={() => setStake(val)}
                className={`py-2 rounded-lg text-xs font-medium ${stake === val ? 'bg-purple-600 text-white' : isDark ? 'bg-[#150d24] text-gray-300' : 'bg-gray-100 text-gray-700'}`}
              >
                {val}
              </button>
            ))}
          </div>

          <div className={`text-right text-xs mb-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            ≈ KES {(stake * 130).toLocaleString()}
          </div>

          {tradeType === 'rise-fall' && (
            <>
              <div className="grid grid-cols-3 gap-2 mb-4">
                <button className={`py-2 rounded-lg text-xs font-medium ${isDark ? 'bg-[#150d24] text-gray-400' : 'bg-gray-100 text-gray-600'}`}>
                  Over / Under
                </button>
                <button className={`py-2 rounded-lg text-xs font-medium ${isDark ? 'bg-[#150d24] text-gray-400' : 'bg-gray-100 text-gray-600'}`}>
                  Even / Odd
                </button>
                <button className={`py-2 rounded-lg text-xs font-medium ${isDark ? 'bg-[#150d24] text-gray-400' : 'bg-gray-100 text-gray-600'}`}>
                  Matches / Differs
                </button>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => executeTrade('RISE')}
                  disabled={isTrading}
                  className="flex-1 py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold text-sm transition disabled:opacity-50"
                >
                  {isTrading ? '...' : 'RISE'}
                  <div className="text-[10px] font-normal opacity-90">Payout ${(stake * 1.9).toFixed(2)}</div>
                </button>
                <button
                  onClick={() => executeTrade('FALL')}
                  disabled={isTrading}
                  className="flex-1 py-4 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold text-sm transition disabled:opacity-50"
                >
                  {isTrading ? '...' : 'FALL'}
                  <div className="text-[10px] font-normal opacity-90">Payout ${(stake * 1.9).toFixed(2)}</div>
                </button>
              </div>
            </>
          )}

          {tradeType === 'digits' && (
            <>
              {/* Digit mode selector */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                <button
                  onClick={() => setDigitMode('over-under')}
                  className={`py-2 rounded-lg text-xs font-medium ${digitMode === 'over-under' ? 'bg-purple-600 text-white' : isDark ? 'bg-[#150d24] text-gray-400' : 'bg-gray-100 text-gray-600'}`}
                >
                  Over / Under
                </button>
                <button
                  onClick={() => setDigitMode('even-odd')}
                  className={`py-2 rounded-lg text-xs font-medium ${digitMode === 'even-odd' ? 'bg-purple-600 text-white' : isDark ? 'bg-[#150d24] text-gray-400' : 'bg-gray-100 text-gray-600'}`}
                >
                  Even / Odd
                </button>
                <button
                  onClick={() => setDigitMode('matches-differs')}
                  className={`py-2 rounded-lg text-xs font-medium ${digitMode === 'matches-differs' ? 'bg-purple-600 text-white' : isDark ? 'bg-[#150d24] text-gray-400' : 'bg-gray-100 text-gray-600'}`}
                >
                  Matches / Differs
                </button>
              </div>

              {/* Barrier digit */}
              <div className={`flex items-center justify-between p-3 rounded-lg mb-4 ${isDark ? 'bg-[#150d24]' : 'bg-gray-50'}`}>
                <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Barrier digit</span>
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-lg bg-purple-600 text-white font-bold flex items-center justify-center">
                    {selectedDigit}
                  </span>
                  <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>tap chart digits</span>
                </div>
              </div>

              {/* Trade buttons based on mode */}
              {digitMode === 'over-under' && (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => executeTrade('OVER')}
                    disabled={isTrading}
                    className="py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold text-sm transition disabled:opacity-50"
                  >
                    <div className="flex items-center justify-between px-2">
                      <span className="font-bold">OVER {selectedDigit}</span>
                      <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded">+138%</span>
                    </div>
                    <div className="text-[10px] font-normal opacity-90 mt-0.5 px-2 text-left">
                      Payout ${(stake * 2.38).toFixed(2)}
                    </div>
                  </button>
                  <button
                    onClick={() => executeTrade('UNDER')}
                    disabled={isTrading}
                    className="py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold text-sm transition disabled:opacity-50"
                  >
                    <div className="flex items-center justify-between px-2">
                      <span className="font-bold">UNDER {selectedDigit}</span>
                      <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded">+90%</span>
                    </div>
                    <div className="text-[10px] font-normal opacity-90 mt-0.5 px-2 text-left">
                      Payout ${(stake * 1.9).toFixed(2)}
                    </div>
                  </button>
                </div>
              )}

              {digitMode === 'even-odd' && (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => executeTrade('DIGIT')}
                    disabled={isTrading}
                    className="py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold text-sm transition disabled:opacity-50"
                  >
                    <div className="flex items-center justify-between px-2">
                      <span className="font-bold">EVEN</span>
                      <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded">+95%</span>
                    </div>
                    <div className="text-[10px] font-normal opacity-90 mt-0.5 px-2 text-left">
                      Payout ${(stake * 1.95).toFixed(2)}
                    </div>
                  </button>
                  <button
                    onClick={() => executeTrade('DIGIT')}
                    disabled={isTrading}
                    className="py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold text-sm transition disabled:opacity-50"
                  >
                    <div className="flex items-center justify-between px-2">
                      <span className="font-bold">ODD</span>
                      <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded">+95%</span>
                    </div>
                    <div className="text-[10px] font-normal opacity-90 mt-0.5 px-2 text-left">
                      Payout ${(stake * 1.95).toFixed(2)}
                    </div>
                  </button>
                </div>
              )}

              {digitMode === 'matches-differs' && (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => executeTrade('DIGIT')}
                    disabled={isTrading}
                    className="py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold text-sm transition disabled:opacity-50"
                  >
                    <div className="flex items-center justify-between px-2">
                      <span className="font-bold">MATCHES {selectedDigit}</span>
                      <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded">+800%</span>
                    </div>
                    <div className="text-[10px] font-normal opacity-90 mt-0.5 px-2 text-left">
                      Payout ${(stake * 9).toFixed(2)}
                    </div>
                  </button>
                  <button
                    onClick={() => executeTrade('DIGIT')}
                    disabled={isTrading}
                    className="py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold text-sm transition disabled:opacity-50"
                  >
                    <div className="flex items-center justify-between px-2">
                      <span className="font-bold">DIFFERS</span>
                      <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded">+9%</span>
                    </div>
                    <div className="text-[10px] font-normal opacity-90 mt-0.5 px-2 text-left">
                      Payout ${(stake * 1.09).toFixed(2)}
                    </div>
                  </button>
                </div>
              )}
            </>
          )}

          {tradeType === 'multipliers' && (
            <div className={`p-4 rounded-xl text-center text-xs ${isDark ? 'bg-[#150d24] text-gray-400' : 'bg-gray-50 text-gray-500'}`}>
              Multipliers coming soon
            </div>
          )}

          {tradeResult && (
            <div className={`mt-4 p-3 rounded-lg text-center text-sm ${tradeResult.includes('won') ? 'bg-purple-500/20 text-purple-300' : 'bg-red-500/20 text-red-300'}`}>
              {tradeResult}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}