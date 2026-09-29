'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { DerivClient } from '@/lib/derivClient'
import { ChevronDown, LogOut, Clock, Zap, Play, X, Search, Sparkles, Copy, Check, Wallet, ArrowDownToLine, ArrowUpFromLine, TrendingUp, History, Gift, User } from 'lucide-react'

export default function HomePage() {
  const [price, setPrice] = useState(730.69)
  const [prevPrice, setPrevPrice] = useState(730.69)
  const [lastDigit, setLastDigit] = useState(9)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [isDerivConnected, setIsDerivConnected] = useState(false)
  const [balance, setBalance] = useState(0)
  const [demoBalance, setDemoBalance] = useState(10000)
  const [liveBalance, setLiveBalance] = useState(0)
  const [balancePulse, setBalancePulse] = useState(false)
  const [isLiveMode, setIsLiveMode] = useState(true)
  const [isAccountDropdownOpen, setIsAccountDropdownOpen] = useState(false)
  const [stake, setStake] = useState(10)
  const [duration, setDuration] = useState(60)
  const [multiplier, setMultiplier] = useState(100)
  const [selectedMarket, setSelectedMarket] = useState('Volatility 100 (1s) Index')
  const [isTrading, setIsTrading] = useState(false)
  const [tradeResult, setTradeResult] = useState<string | null>(null)
  const [theme, setTheme] = useState<'dark' | 'light'>('light')
  const [openPositions, setOpenPositions] = useState<any[]>([])
  const [closedPositions, setClosedPositions] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState<'open' | 'closed'>('open')
  const [tradeType, setTradeType] = useState<'rise-fall' | 'digits' | 'multipliers'>('digits')
  const [digitMode, setDigitMode] = useState<'over-under' | 'even-odd' | 'matches-differs'>('even-odd')
  const [selectedDigit, setSelectedDigit] = useState<number>(5)
  const [digitSide, setDigitSide] = useState<string>('OVER')
  const [showDashboard, setShowDashboard] = useState(false)

  const [isWalletOpen, setIsWalletOpen] = useState(false)
  const [walletTab, setWalletTab] = useState<'deposit' | 'withdraw'>('deposit')
  const [paymentMethod, setPaymentMethod] = useState<'mpesa' | 'crypto'>('mpesa')
  const [depositAmount, setDepositAmount] = useState('')
  const [depositPhone, setDepositPhone] = useState('')
  const [cryptoCoin, setCryptoCoin] = useState('USDT')
  const [cryptoTxHash, setCryptoTxHash] = useState('')
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [withdrawPhone, setWithdrawPhone] = useState('')
  const [withdrawAddress, setWithdrawAddress] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [walletMessage, setWalletMessage] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const digitHistoryRef = useRef<number[]>([])
  const [digitPercentages, setDigitPercentages] = useState<number[]>(Array(10).fill(10))
  const MAX_HISTORY = 100

  const [tradeMode, setTradeMode] = useState<'manual' | 'auto' | 'ai'>('manual')
  const [botTrade, setBotTrade] = useState<string>('RISE')
  const [martingale, setMartingale] = useState(2)
  const [maxRuns, setMaxRuns] = useState(50)
  const [targetProfit, setTargetProfit] = useState(50)
  const [stopLoss, setStopLoss] = useState(30)
  const [isBotRunning, setIsBotRunning] = useState(false)

  const [aiTradeType, setAiTradeType] = useState('Even / Odd')
  const [aiScanProgress, setAiScanProgress] = useState(0)
  const [aiScanning, setAiScanning] = useState(false)
  const [aiScannedMarkets, setAiScannedMarkets] = useState<string[]>([])
  const [aiBestMarket, setAiBestMarket] = useState<string>('V100 1s')
  const [aiPrediction, setAiPrediction] = useState('Even')

  const chartRef = useRef<HTMLDivElement>(null)
  const chartInstance = useRef<any>(null)
  const seriesRef = useRef<any>(null)
  const priceHistoryRef = useRef<{ time: number; value: number }[]>([])

  const isDark = theme === 'dark'
  const aiMarkets = ['V10', 'V25', 'V50', 'V75', 'V100', 'V10 1s', 'V25 1s', 'V50 1s', 'V75 1s', 'V100 1s']

  const CRYPTO_ADDRESSES: { [key: string]: string } = {
    USDT: 'TLgyntXK3BLu1WU9qpqvyX2ir5zUGQnb1L',
    BTC: 'bc1qfvd367e86j2qvn2669p7hezlz582dphdmj5l7n',
    ETH: '0x08A59F383a575427D08DB0957BFd6d184C4cA762',
  }

  const CRYPTO_NETWORKS: { [key: string]: string } = {
    USDT: 'TRON (TRC-20)',
    BTC: 'Bitcoin',
    ETH: 'Ethereum (ERC-20)',
  }

  // Price change %
  const priceChangePct = prevPrice ? ((price - prevPrice) / prevPrice) * 100 : 0

  const getOverMultiplier = (d: number) => ({ 0: 1.11, 1: 1.25, 2: 1.43, 3: 1.67, 4: 2.00, 5: 2.50, 6: 3.33, 7: 5.00, 8: 10.00 }[d] ?? 2.00)
  const getUnderMultiplier = (d: number) => ({ 1: 10.00, 2: 5.00, 3: 3.33, 4: 2.50, 5: 2.00, 6: 1.67, 7: 1.43, 8: 1.25, 9: 1.11 }[d] ?? 2.00)
  const getOverPercent = (d: number) => ({ 0: 11, 1: 25, 2: 43, 3: 67, 4: 100, 5: 150, 6: 233, 7: 400, 8: 900 }[d] ?? 100)
  const getUnderPercent = (d: number) => ({ 1: 900, 2: 400, 3: 233, 4: 150, 5: 100, 6: 67, 7: 43, 8: 25, 9: 11 }[d] ?? 100)
  const overMultiplier = getOverMultiplier(selectedDigit)
  const underMultiplier = getUnderMultiplier(selectedDigit)
  const overPercent = getOverPercent(selectedDigit)
  const underPercent = getUnderPercent(selectedDigit)

  const recordDigit = (d: number) => {
    const arr = digitHistoryRef.current
    arr.push(d)
    if (arr.length > MAX_HISTORY) arr.shift()
    digitHistoryRef.current = arr
    const counts = Array(10).fill(0)
    arr.forEach((x) => { counts[x]++ })
    const total = arr.length || 1
    const pcts = counts.map((c) => Math.round((c / total) * 100))
    setDigitPercentages(pcts)
  }

  const updatePrice = (newPrice: number) => {
    setPrevPrice(price)
    setPrice(newPrice)
  }

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

  useEffect(() => {
    if (!isLoggedIn || !user?.id) return
    const loadBalance = async () => {
      const { data } = await supabase.from('balances').select('*').eq('user_id', user.id).single()
      if (data) {
        setDemoBalance(Number(data.demo_balance))
        setLiveBalance(Number(data.live_balance))
      }
    }
    loadBalance()
  }, [isLoggedIn, user?.id])

  useEffect(() => {
    setBalance(isLiveMode ? liveBalance : demoBalance)
  }, [isLiveMode, liveBalance, demoBalance])

  useEffect(() => {
    if (!isLoggedIn || !user?.id) return
    const loadTrades = async () => {
      try {
        const { data } = await supabase
          .from('trades').select('*').eq('user_id', user.id)
          .order('created_at', { ascending: false }).limit(50)
        if (data && data.length > 0) {
          const loaded = data.map((t: any) => ({
            id: t.id, market: t.market, type: t.prediction, stake: t.stake,
            entryPrice: t.entry_price, result: t.result, payout: t.payout,
            time: new Date(t.created_at).toLocaleTimeString(),
          }))
          setClosedPositions(loaded)
        }
      } catch (err) { console.error('❌ Loading trades:', err) }
    }
    loadTrades()
  }, [isLoggedIn, user?.id])

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
    setPrice(base); setPrevPrice(base)
    setLastDigit(Math.floor(base * 100) % 10)
    digitHistoryRef.current = []
    setDigitPercentages(Array(10).fill(10))
  }, [selectedMarket, showDashboard])

  useEffect(() => {
    let derivClient: DerivClient
    let isMounted = true
    let fallbackInterval: NodeJS.Timeout
    const connectDeriv = async () => {
      try {
        derivClient = new DerivClient()
        derivClient.setOnTick((newPrice: number) => {
          if (!isMounted) return
          updatePrice(newPrice)
          const d = Math.floor(newPrice * 100) % 10
          setLastDigit(d); recordDigit(d)
        })
        await derivClient.subscribeToTicks('1HZ100V')
        setIsDerivConnected(true)
      } catch (error) { setIsDerivConnected(false) }
      fallbackInterval = setInterval(() => {
        if (!isMounted) return
        setPrice((prev) => {
          const next = Math.max(100, prev + (Math.random() - 0.5) * 2)
          const d = Math.floor(next * 100) % 10
          setLastDigit(d); recordDigit(d)
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
        const isMobile = container.clientWidth < 768
        const chart = createChart(container, {
          width: container.clientWidth,
          height: isMobile ? 220 : 400,
          layout: { background: { color: 'transparent' }, textColor: isDark ? '#9ca3af' : '#6b7280' },
          grid: {
            vertLines: { color: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)', style: LineStyle?.Dotted ?? 2 },
            horzLines: { color: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)', style: LineStyle?.Dotted ?? 2 }
          },
          rightPriceScale: { borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)', scaleMargins: { top: 0.1, bottom: 0.1 } },
          timeScale: { borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)', timeVisible: true, secondsVisible: true },
          crosshair: { mode: 1 },
        })
        let lineSeries: any
        if (typeof chart.addSeries === 'function' && LineSeries) {
          lineSeries = chart.addSeries(LineSeries, { color: '#7c3aed', lineWidth: 2, priceLineVisible: false, lastValueVisible: false })
        } else if (typeof chart.addLineSeries === 'function') {
          lineSeries = chart.addLineSeries({ color: '#7c3aed', lineWidth: 2, priceLineVisible: false, lastValueVisible: false })
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
      if (container && chartInstance.current) {
        const isMobile = container.clientWidth < 768
        chartInstance.current.applyOptions({ width: container.clientWidth, height: isMobile ? 220 : 400 })
      }
    }
    window.addEventListener('resize', handleResize)
    return () => {
      clearTimeout(timeout)
      window.removeEventListener('resize', handleResize)
      if (chartInstance.current) { chartInstance.current.remove(); chartInstance.current = null; seriesRef.current = null }
    }
  }, [showDashboard, isLoggedIn, selectedMarket, isDark])

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

  const handleMpesaDeposit = async () => {
    setIsProcessing(true); setWalletMessage(null)
    try {
      const amount = parseFloat(depositAmount)
      if (!amount || amount <= 0) throw new Error('Enter a valid amount')
      if (!depositPhone || depositPhone.length < 10) throw new Error('Enter a valid phone number')
      const { data: depositRecord, error: depositErr } = await supabase
        .from('deposits').insert({ user_id: user.id, method: 'mpesa', amount, phone: depositPhone, status: 'pending' })
        .select().single()
      if (depositErr) throw depositErr
      const res = await fetch('/api/mpesa/stkpush', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: depositPhone, amount, depositId: depositRecord.id }),
      })
      const result = await res.json()
      if (result.success) {
        setWalletMessage(`✅ Check your phone (${depositPhone}) and enter your M-Pesa PIN.`)
        setIsLiveMode(true)
      } else {
        setWalletMessage(`❌ ${result.error || 'Failed to initiate M-Pesa payment'}`)
        await supabase.from('deposits').update({ status: 'failed' }).eq('id', depositRecord.id)
      }
    } catch (err: any) { setWalletMessage(`❌ ${err.message}`) }
    setIsProcessing(false)
  }

  const handleCryptoDeposit = async () => {
    setIsProcessing(true); setWalletMessage(null)
    try {
      const amount = parseFloat(depositAmount)
      if (!amount || amount <= 0) throw new Error('Enter a valid amount')
      if (!cryptoTxHash || cryptoTxHash.length < 10) throw new Error('Paste your transaction hash after sending crypto')
      const { error: depositErr } = await supabase.from('deposits').insert({
        user_id: user.id, method: 'crypto', amount, crypto_coin: cryptoCoin,
        crypto_address: CRYPTO_ADDRESSES[cryptoCoin], crypto_tx_hash: cryptoTxHash,
        status: 'pending', target_account: 'live',
      })
      if (depositErr) throw depositErr
      setWalletMessage(`✅ Deposit submitted. We'll verify TX ${cryptoTxHash.slice(0, 12)}... and credit your Live account within 24 hours.`)
      setIsLiveMode(true); setCryptoTxHash(''); setDepositAmount('')
    } catch (err: any) { setWalletMessage(`❌ ${err.message}`) }
    setIsProcessing(false)
  }

  const handleWithdraw = async () => {
    setIsProcessing(true); setWalletMessage(null)
    try {
      const amount = parseFloat(withdrawAmount)
      if (!amount || amount <= 0) throw new Error('Enter a valid amount')
      if (amount > liveBalance) throw new Error('Insufficient live balance')
      if (paymentMethod === 'mpesa' && (!withdrawPhone || withdrawPhone.length < 10)) throw new Error('Enter a valid phone number')
      if (paymentMethod === 'crypto' && !withdrawAddress) throw new Error('Enter a valid crypto address')
      const { error } = await supabase.from('withdrawals').insert({
        user_id: user.id, method: paymentMethod, amount,
        phone: paymentMethod === 'mpesa' ? withdrawPhone : null,
        crypto_address: paymentMethod === 'crypto' ? withdrawAddress : null,
        status: 'pending',
      })
      if (error) throw error
      const newLive = liveBalance - amount
      await supabase.from('balances').update({ live_balance: newLive, updated_at: new Date().toISOString() }).eq('user_id', user.id)
      setLiveBalance(newLive)
      await supabase.from('transactions').insert({
        user_id: user.id, type: 'withdrawal', amount: -amount, balance_after: newLive,
        description: `Withdrawal request (${paymentMethod})`,
      })
      setWalletMessage(`✅ Withdrawal request submitted. You will receive $${amount} after admin approval.`)
      setWithdrawAmount('')
    } catch (err: any) { setWalletMessage(`❌ ${err.message}`) }
    setIsProcessing(false)
  }

  const executeTrade = async (prediction: string) => {
    setIsTrading(true); setTradeResult(null)
    try {
      const result = Math.random() > 0.5 ? 'WIN' : 'LOSS'
      let payoutRate = 1.9
      if (prediction === 'OVER') payoutRate = overMultiplier
      else if (prediction === 'UNDER') payoutRate = underMultiplier
      else if (prediction === 'MATCHES') payoutRate = 9
      else if (prediction === 'DIFFERS') payoutRate = 1.09
      else if (prediction === 'EVEN' || prediction === 'ODD') payoutRate = 1.9
      else if (prediction === 'UP' || prediction === 'DOWN') payoutRate = 2.0
      const payout = result === 'WIN' ? stake * payoutRate : 0
      const contract = {
        id: Math.random().toString(36).substring(2, 10),
        market: selectedMarket, type: prediction, stake, entryPrice: price, result,
        payout: result === 'WIN' ? payout : -stake,
        time: new Date().toLocaleTimeString(),
      }
      const delta = result === 'WIN' ? payout : -stake
      if (isLiveMode) {
        const newLive = liveBalance + delta
        if (newLive < 0) { setTradeResult('❌ Insufficient live balance'); setIsTrading(false); return }
        setLiveBalance(newLive)
        await supabase.from('balances').update({ live_balance: newLive, updated_at: new Date().toISOString() }).eq('user_id', user.id)
      } else {
        const newDemo = demoBalance + delta
        setDemoBalance(newDemo)
        await supabase.from('balances').update({ demo_balance: newDemo, updated_at: new Date().toISOString() }).eq('user_id', user.id)
      }
      if (result === 'WIN') setTradeResult(`🎉 You won! +$${payout.toFixed(2)}`)
      else setTradeResult(`😢 You lost. -$${stake.toFixed(2)}`)
      setBalancePulse(true); setTimeout(() => setBalancePulse(false), 800)
      setOpenPositions((prev) => [contract, ...prev])
      try {
        await supabase.from('trades').insert({
          user_id: user.id, market: selectedMarket, trade_type: tradeType,
          prediction, stake, entry_price: price, result,
          payout: result === 'WIN' ? payout : -stake,
        })
      } catch (err) {}
      setTimeout(() => {
        setOpenPositions((prev) => prev.filter((c) => c.id !== contract.id))
        setClosedPositions((prev) => [contract, ...prev])
      }, 5000)
      setIsTrading(false)
    } catch (error: any) { setTradeResult(`❌ Error: ${error.message}`); setIsTrading(false) }
  }

  useEffect(() => {
    if (!isBotRunning || tradeMode !== 'auto') return
    if (!user?.id) return
    let cancelled = false
    let currentStake = stake
    let runs = 0
    let pnl = 0
    const runOne = async () => {
      if (cancelled) return
      if (runs >= maxRuns) { setTradeResult(`🛑 Bot stopped: max runs reached`); setIsBotRunning(false); return }
      if (pnl >= targetProfit) { setTradeResult(`✅ Target profit hit: +$${pnl.toFixed(2)}`); setIsBotRunning(false); return }
      if (pnl <= -stopLoss) { setTradeResult(`🛑 Stop loss hit: -$${Math.abs(pnl).toFixed(2)}`); setIsBotRunning(false); return }
      const result = Math.random() > 0.5 ? 'WIN' : 'LOSS'
      const delta = result === 'WIN' ? currentStake * 1.9 : -currentStake
      pnl += delta; runs += 1
      if (result === 'WIN') currentStake = stake
      else currentStake = currentStake * martingale
      setStake(Number(currentStake.toFixed(2)))
      await executeTrade(botTrade)
    }
    runOne()
    const interval = setInterval(runOne, 6000)
    return () => { cancelled = true; clearInterval(interval) }
  }, [isBotRunning, tradeMode, botTrade, martingale, maxRuns, targetProfit, stopLoss])

  const handleLogout = async () => { await supabase.auth.signOut(); setShowDashboard(false) }
  const resetDemo = async () => {
    setDemoBalance(10000)
    if (user?.id) await supabase.from('balances').update({ demo_balance: 10000 }).eq('user_id', user.id)
    setTradeResult('Demo account reset to $10,000')
  }
  const potentialPayout = stake * 1.9

  const runDeepScan = async () => {
    setAiScanning(true); setAiScanProgress(0); setAiScannedMarkets([])
    for (let i = 0; i < aiMarkets.length; i++) {
      await new Promise((r) => setTimeout(r, 500))
      setAiScannedMarkets((prev) => [...prev, aiMarkets[i]])
      setAiScanProgress(i + 1)
    }
    const best = aiMarkets[Math.floor(Math.random() * aiMarkets.length)]
    setAiBestMarket(best); setAiPrediction(Math.random() > 0.5 ? 'Even' : 'Odd'); setAiScanning(false)
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
                      aiBestMarket === 'V10' ? 'Volatility 10 Index' : 'Volatility 100 (1s) Index')
    setTradeMode('auto'); setTradeType('digits')
    setDigitMode(aiTradeType === 'Match / Differ' ? 'matches-differs' :
                 aiTradeType === 'Over / Under' ? 'over-under' :
                 aiTradeType === 'Even / Odd' ? 'even-odd' : 'over-under')
    setBotTrade(aiPrediction === 'Even' ? 'EVEN' : aiPrediction === 'Odd' ? 'ODD' : 'OVER')
    setTradeResult(`✅ Loaded ${aiBestMarket} Bot with ${aiTradeType}`)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text); setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const markets = [
    'Volatility 100 (1s) Index', 'Volatility 100 Index',
    'Volatility 75 (1s) Index', 'Volatility 75 Index',
    'Volatility 50 (1s) Index', 'Volatility 50 Index',
    'Volatility 25 (1s) Index', 'Volatility 25 Index',
    'Volatility 10 (1s) Index', 'Volatility 10 Index',
  ]

  // ═══════════════════════════════════════════════════════
  // LANDING PAGE (unchanged)
  // ═══════════════════════════════════════════════════════
  if (!showDashboard) {
    return (
      <main className="min-h-screen bg-gray-50 text-gray-900">
        <header className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center">
              <span className="text-white font-bold text-sm">D</span>
            </div>
            <span className="font-bold text-lg text-gray-900">DerivEngine</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-100 transition">Sign in</Link>
            <Link href="/register" className="px-4 py-2 text-sm text-white bg-purple-600 hover:bg-purple-700 rounded-lg font-medium transition">Get started</Link>
          </div>
        </header>
        <section className="max-w-7xl mx-auto px-6 py-16 lg:py-24 text-center">
          <h1 className="text-4xl lg:text-6xl font-bold mb-4">Trade the markets. On your terms.</h1>
          <p className="text-lg mb-8 text-gray-600 max-w-xl mx-auto">
            Predict Volatility Index movements. Win up to 1.9× your stake.
          </p>
          <Link href="/register" className="inline-block px-8 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl">Start trading free →</Link>
        </section>
      </main>
    )
  }

  // ═══════════════════════════════════════════════════════
  // DASHBOARD — new mobile-first design
  // ═══════════════════════════════════════════════════════
  const kesAmount = (stake * 130).toLocaleString()

  return (
    <main className={`min-h-screen pb-20 md:pb-0 ${isDark ? 'bg-[#0a0613] text-white' : 'bg-gray-50 text-gray-900'}`}>

      {/* ── TOP BAR (mobile-first) ───────────────────── */}
      <nav className={`border-b sticky top-0 z-30 ${isDark ? 'border-purple-500/20 bg-[#0d0818]' : 'border-gray-200 bg-white'}`}>
        <div className="px-4 md:px-6 py-3 flex items-center justify-between gap-3">
          {/* Logo */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center">
              <span className="text-white font-bold text-sm">D</span>
            </div>
            <span className="font-bold hidden sm:inline">DerivEngine</span>
          </div>

          {/* Account pill — clickable to switch */}
          <div className="relative flex-1 flex justify-center md:flex-none md:justify-start">
            <button
              onClick={() => setIsAccountDropdownOpen(!isAccountDropdownOpen)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs border transition ${
                isLiveMode ? 'bg-purple-500/10 border-purple-500/30' : (isDark ? 'bg-white/5 border-white/10' : 'bg-gray-100 border-gray-200')
              }`}
            >
              <div className="text-left">
                <div className={`text-[9px] font-bold tracking-wider uppercase ${isLiveMode ? 'text-purple-500' : 'text-gray-500'}`}>
                  {isLiveMode ? 'Real' : 'Demo'}
                </div>
                <div className={`font-bold text-sm transition ${balancePulse ? 'scale-110' : 'scale-100'} ${isLiveMode ? 'text-purple-600' : 'text-gray-900'}`}>
                  ${balance.toFixed(2)}
                </div>
              </div>
              <ChevronDown className={`w-3 h-3 text-gray-400 transition-transform ${isAccountDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {isAccountDropdownOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsAccountDropdownOpen(false)} />
                <div className={`absolute top-full mt-2 w-72 rounded-2xl border shadow-2xl z-50 overflow-hidden ${isDark ? 'bg-[#0d0818] border-purple-500/20' : 'bg-white border-gray-200'}`}>
                  <div className={`px-4 py-2 text-[10px] font-bold tracking-wider ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>SWITCH ACCOUNT</div>
                  <button onClick={() => { setIsLiveMode(true); setIsAccountDropdownOpen(false) }} className={`w-full flex items-center gap-3 px-4 py-3 transition ${isDark ? 'hover:bg-white/5' : 'hover:bg-gray-50'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isLiveMode ? 'bg-purple-500/20' : (isDark ? 'bg-white/5' : 'bg-gray-100')}`}>
                      {isLiveMode ? <span className="text-purple-500 text-sm">✓</span> : <span className="text-gray-400 text-sm">🔒</span>}
                    </div>
                    <div className="flex-1 text-left">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-sm">Real account</span>
                        <span className="font-bold text-sm text-purple-600">${liveBalance.toFixed(2)}</span>
                      </div>
                      <div className={`text-[11px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Your live funds</div>
                    </div>
                  </button>
                  <div className={`h-px ${isDark ? 'bg-purple-500/10' : 'bg-gray-100'}`} />
                  <button onClick={() => { setIsLiveMode(false); setIsAccountDropdownOpen(false) }} className={`w-full flex items-center gap-3 px-4 py-3 transition ${isDark ? 'hover:bg-white/5' : 'hover:bg-gray-50'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${!isLiveMode ? 'bg-purple-500/20' : (isDark ? 'bg-white/5' : 'bg-gray-100')}`}>
                      {!isLiveMode ? <span className="text-purple-500 text-sm">✓</span> : <span className="text-yellow-500 text-sm">⚠️</span>}
                    </div>
                    <div className="flex-1 text-left">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-sm">Demo account</span>
                        <span className="font-bold text-sm text-yellow-500">${demoBalance.toFixed(2)}</span>
                      </div>
                      <div className={`text-[11px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Practice · virtual funds</div>
                    </div>
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Right side actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => { setWalletTab('withdraw'); setIsWalletOpen(true) }}
              className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border ${isDark ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-gray-100 border-gray-200 hover:bg-gray-200'}`}
            >
              <ArrowUpFromLine className="w-3.5 h-3.5" /> Withdraw
            </button>
            <button
              onClick={() => { setWalletTab('deposit'); setIsWalletOpen(true); setIsLiveMode(true) }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white"
            >
              <ArrowDownToLine className="w-3.5 h-3.5" /> Deposit
            </button>
            <button onClick={handleLogout} className={`w-8 h-8 rounded-lg flex items-center justify-center md:hidden ${isDark ? 'bg-white/5' : 'bg-gray-100'}`}>
              <LogOut className="w-4 h-4 text-gray-400" />
            </button>
            <button onClick={handleLogout} className={`hidden md:flex w-8 h-8 rounded-lg items-center justify-center ${isDark ? 'bg-white/5' : 'bg-gray-100'}`}>
              <LogOut className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </div>
      </nav>

      <div className="px-3 md:px-4 py-3 md:py-4 grid grid-cols-1 lg:grid-cols-12 gap-3 md:gap-4 max-w-[1600px] mx-auto">

        {/* Positions panel — desktop only */}
        <div className={`hidden lg:block lg:col-span-2 rounded-2xl border p-4 ${isDark ? 'bg-[#0d0818] border-purple-500/20' : 'bg-white border-gray-200'}`}>
          <div className="flex gap-2 mb-4">
            <button onClick={() => setActiveTab('open')} className={`flex-1 py-2 rounded-lg text-xs font-medium ${activeTab === 'open' ? 'bg-purple-500/20 text-purple-500' : isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Open ({openPositions.length})
            </button>
            <button onClick={() => setActiveTab('closed')} className={`flex-1 py-2 rounded-lg text-xs font-medium ${activeTab === 'closed' ? 'bg-purple-500/20 text-purple-500' : isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Closed ({closedPositions.length})
            </button>
          </div>
          <div className={`text-center py-12 text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            {activeTab === 'open' && openPositions.length === 0 && <div>No open positions yet.</div>}
            {activeTab === 'closed' && closedPositions.length === 0 && <div>No closed positions yet.</div>}
          </div>
        </div>

        {/* Main trading panel */}
        <div className="lg:col-span-7 space-y-3">

          {/* Market header */}
          <div className={`rounded-2xl border p-3 md:p-4 ${isDark ? 'bg-[#0d0818] border-purple-500/20' : 'bg-white border-gray-200'}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <select
                    value={selectedMarket}
                    onChange={(e) => setSelectedMarket(e.target.value)}
                    className={`font-semibold text-sm md:text-base outline-none cursor-pointer bg-transparent ${isDark ? 'text-white' : 'text-gray-900'}`}
                  >
                    {markets.map((m) => (<option key={m} value={m} className={isDark ? 'bg-[#150d24]' : 'bg-white'}>{m}</option>))}
                  </select>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-600 px-1.5 py-0.5 rounded font-bold flex items-center gap-1 flex-shrink-0">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span> LIVE
                  </span>
                </div>
                <div className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>Very High volatility · synthetic index</div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className={`text-xl md:text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{price.toFixed(2)}</div>
                <div className={`text-xs font-semibold ${priceChangePct >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                  {priceChangePct >= 0 ? '▲' : '▼'} {Math.abs(priceChangePct).toFixed(2)}%
                </div>
              </div>
            </div>

            {/* Chart */}
            <div ref={chartRef} className="w-full mt-3 rounded-lg overflow-hidden" style={{ height: '220px' }} />
          </div>

          {/* Digits */}
          <div className={`rounded-2xl border p-3 md:p-4 ${isDark ? 'bg-[#0d0818] border-purple-500/20' : 'bg-white border-gray-200'}`}>
            <div className="flex justify-between items-center mb-3">
              <div className={`text-xs font-bold tracking-wide ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                <span className="text-purple-500">#</span> LIVE LAST DIGITS
                <span className={`ml-2 text-[10px] font-normal ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>({digitHistoryRef.current.length || 0} ticks)</span>
              </div>
            </div>
            <div className="grid grid-cols-10 gap-0.5 md:gap-1">
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => {
                const pct = digitPercentages[digit]
                const circumference = 2 * Math.PI * 18
                const offset = circumference - (Math.min(pct, 100) / 100) * circumference
                const isLast = digit === lastDigit
                const isSelected = selectedDigit === digit
                return (
                  <button key={digit} onClick={() => setSelectedDigit(digit)} className="flex flex-col items-center gap-1">
                    <div className="relative w-9 h-9 md:w-12 md:h-12 flex items-center justify-center">
                      <svg className="absolute inset-0 -rotate-90" width="36" height="36" viewBox="0 0 36 36">
                        <circle cx="18" cy="18" r="18" fill="none" stroke={isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'} strokeWidth="2.5" />
                        <circle cx="18" cy="18" r="18" fill="none" stroke={isLast ? '#7c3aed' : isSelected ? '#7c3aed' : (isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.2)')} strokeWidth="2.5" strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" className="transition-all duration-500" />
                      </svg>
                      <div className={`w-6 h-6 md:w-9 md:h-9 rounded-full flex items-center justify-center transition-all ${
                        isSelected ? (isDark ? 'bg-purple-500/30 ring-2 ring-purple-500' : 'bg-purple-100 ring-2 ring-purple-500') :
                        isLast ? 'ring-2 ring-emerald-500' :
                        (isDark ? 'bg-[#150d24]' : 'bg-white')
                      }`}>
                        <span className={`text-[10px] md:text-sm font-bold ${isSelected || isLast ? 'text-purple-600' : isDark ? 'text-gray-300' : 'text-gray-700'}`}>{digit}</span>
                      </div>
                    </div>
                    <span className={`text-[9px] md:text-[10px] font-medium ${isLast ? 'text-emerald-500' : isDark ? 'text-gray-500' : 'text-gray-500'}`}>{pct}%</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Trade panel */}
          <div className={`rounded-2xl border p-3 md:p-4 ${isDark ? 'bg-[#0d0818] border-purple-500/20' : 'bg-white border-gray-200'}`}>

            {/* Mode selector */}
            <div className={`grid grid-cols-3 gap-1 p-1 rounded-xl mb-3 ${isDark ? 'bg-[#150d24]' : 'bg-gray-100'}`}>
              <button onClick={() => setTradeMode('manual')} className={`py-2 rounded-lg text-xs md:text-sm font-semibold transition ${tradeMode === 'manual' ? 'bg-purple-600 text-white shadow' : isDark ? 'text-gray-400' : 'text-gray-600'}`}>Manual</button>
              <button onClick={() => setTradeMode('auto')} className={`py-2 rounded-lg text-xs md:text-sm font-semibold transition ${tradeMode === 'auto' ? 'bg-purple-600 text-white shadow' : isDark ? 'text-gray-400' : 'text-gray-600'}`}>Auto</button>
              <button onClick={() => setTradeMode('ai')} className={`py-2 rounded-lg text-xs md:text-sm font-semibold transition flex items-center justify-center gap-1 ${tradeMode === 'ai' ? 'bg-purple-600 text-white shadow' : isDark ? 'text-gray-400' : 'text-gray-600'}`}>✨ AI</button>
            </div>

            {/* Trade type pills */}
            <div className="grid grid-cols-3 gap-2 mb-3">
              <button onClick={() => setTradeType('rise-fall')} className={`py-2.5 rounded-xl text-xs md:text-sm font-semibold border transition ${tradeType === 'rise-fall' ? 'bg-purple-600 text-white border-purple-600' : (isDark ? 'bg-[#150d24] text-gray-300 border-purple-500/20' : 'bg-white text-gray-700 border-gray-200')}`}>Rise/Fall</button>
              <button onClick={() => setTradeType('digits')} className={`py-2.5 rounded-xl text-xs md:text-sm font-semibold border transition ${tradeType === 'digits' ? 'bg-purple-600 text-white border-purple-600' : (isDark ? 'bg-[#150d24] text-gray-300 border-purple-500/20' : 'bg-white text-gray-700 border-gray-200')}`}>Digits</button>
              {tradeMode !== 'auto' && (
                <button onClick={() => setTradeType('multipliers')} className={`py-2.5 rounded-xl text-xs md:text-sm font-semibold border transition ${tradeType === 'multipliers' ? 'bg-purple-600 text-white border-purple-600' : (isDark ? 'bg-[#150d24] text-gray-300 border-purple-500/20' : 'bg-white text-gray-700 border-gray-200')}`}>Multipliers</button>
              )}
            </div>

            {/* Stake input */}
            <div className="flex justify-between items-center mb-2">
              <span className={`text-xs md:text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Stake (USD)</span>
              <div className="flex items-center gap-2">
                {!isLiveMode && <button onClick={resetDemo} className="text-[10px] px-2 py-0.5 border border-yellow-500/50 text-yellow-500 rounded">Reset demo</button>}
              </div>
            </div>

            <div className="flex items-center gap-2 mb-1">
              <button onClick={() => setStake(Math.max(1, stake - 1))} className={`w-12 h-14 rounded-xl text-2xl font-bold transition active:scale-95 ${isDark ? 'bg-[#150d24] text-white' : 'bg-gray-100 text-gray-900'}`}>−</button>
              <input
                type="number" value={stake}
                onChange={(e) => setStake(Math.max(1, Number(e.target.value)))} min={1}
                className={`flex-1 min-w-0 text-center text-2xl font-bold rounded-xl py-3 outline-none border-2 transition ${
                  isDark ? 'bg-[#150d24] text-white border-purple-500/20 focus:border-purple-500' : 'bg-gray-50 text-gray-900 border-gray-200 focus:border-purple-500'
                }`}
              />
              <button onClick={() => setStake(stake + 1)} className={`w-12 h-14 rounded-xl text-2xl font-bold transition active:scale-95 ${isDark ? 'bg-[#150d24] text-white' : 'bg-gray-100 text-gray-900'}`}>+</button>
            </div>
            <div className={`text-right text-[11px] mb-3 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>≈ KES {kesAmount}</div>

            {/* Quick amounts */}
            <div className="grid grid-cols-6 gap-1.5 mb-4">
              {[1, 5, 10, 25, 50, 100].map((val) => (
                <button key={val} onClick={() => setStake(val)}
                  className={`py-2.5 rounded-lg text-xs font-semibold transition ${stake === val ? 'bg-purple-600 text-white' : (isDark ? 'bg-[#150d24] text-gray-300' : 'bg-gray-100 text-gray-700')}`}>
                  {val}
                </button>
              ))}
            </div>

            {/* Manual — Rise/Fall */}
            {tradeMode === 'manual' && tradeType === 'rise-fall' && (
              <>
                <div className="mb-3">
                  <div className={`text-xs mb-2 font-semibold ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Duration</div>
                  <div className="grid grid-cols-5 gap-1.5">
                    {[{ v: 15, l: '15s' }, { v: 30, l: '30s' }, { v: 60, l: '1m' }, { v: 120, l: '2m' }, { v: 300, l: '5m' }].map((d) => (
                      <button key={d.v} onClick={() => setDuration(d.v)} className={`py-2 rounded-lg text-xs font-semibold ${duration === d.v ? 'bg-purple-600 text-white' : (isDark ? 'bg-[#150d24] text-gray-300' : 'bg-gray-100 text-gray-700')}`}>{d.l}</button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => executeTrade('RISE')} disabled={isTrading} className="py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-bold text-sm disabled:opacity-50 active:scale-[0.98] transition">
                    <div className="flex flex-col items-center">
                      <span className="font-bold">↑ RISE</span>
                      <span className="text-[10px] opacity-90">+${(stake * 1.9).toFixed(2)}</span>
                    </div>
                  </button>
                  <button onClick={() => executeTrade('FALL')} disabled={isTrading} className="py-4 bg-red-500 hover:bg-red-600 text-white rounded-2xl font-bold text-sm disabled:opacity-50 active:scale-[0.98] transition">
                    <div className="flex flex-col items-center">
                      <span className="font-bold">↓ FALL</span>
                      <span className="text-[10px] opacity-90">+${(stake * 1.9).toFixed(2)}</span>
                    </div>
                  </button>
                </div>
              </>
            )}

            {/* Manual — Digits */}
            {tradeMode === 'manual' && tradeType === 'digits' && (
              <>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  <button onClick={() => setDigitMode('over-under')} className={`py-2.5 rounded-xl text-xs font-semibold border ${digitMode === 'over-under' ? 'bg-purple-600 text-white border-purple-600' : (isDark ? 'bg-[#150d24] text-gray-300 border-purple-500/20' : 'bg-white text-gray-700 border-gray-200')}`}>Over / Under</button>
                  <button onClick={() => setDigitMode('even-odd')} className={`py-2.5 rounded-xl text-xs font-semibold border ${digitMode === 'even-odd' ? 'bg-purple-600 text-white border-purple-600' : (isDark ? 'bg-[#150d24] text-gray-300 border-purple-500/20' : 'bg-white text-gray-700 border-gray-200')}`}>Even / Odd</button>
                  <button onClick={() => setDigitMode('matches-differs')} className={`py-2.5 rounded-xl text-xs font-semibold border ${digitMode === 'matches-differs' ? 'bg-purple-600 text-white border-purple-600' : (isDark ? 'bg-[#150d24] text-gray-300 border-purple-500/20' : 'bg-white text-gray-700 border-gray-200')}`}>Matches / Differs</button>
                </div>

                {digitMode === 'over-under' && (
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => { setDigitSide('OVER'); executeTrade('OVER') }} disabled={isTrading}
                      className={`py-4 rounded-2xl text-white font-bold active:scale-[0.98] transition disabled:opacity-50 ${digitSide === 'OVER' ? 'bg-emerald-500 ring-2 ring-emerald-400' : 'bg-emerald-400'}`}>
                      <div className="text-sm">OVER {selectedDigit}</div>
                      <div className="text-[10px] opacity-90">+{overPercent}% · ${(stake * overMultiplier).toFixed(2)}</div>
                    </button>
                    <button onClick={() => { setDigitSide('UNDER'); executeTrade('UNDER') }} disabled={isTrading}
                      className={`py-4 rounded-2xl text-white font-bold active:scale-[0.98] transition disabled:opacity-50 ${digitSide === 'UNDER' ? 'bg-red-500 ring-2 ring-red-400' : 'bg-red-400'}`}>
                      <div className="text-sm">UNDER {selectedDigit}</div>
                      <div className="text-[10px] opacity-90">+{underPercent}% · ${(stake * underMultiplier).toFixed(2)}</div>
                    </button>
                  </div>
                )}

                {digitMode === 'even-odd' && (
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => { setDigitSide('EVEN'); executeTrade('EVEN') }} disabled={isTrading}
                      className={`py-4 rounded-2xl text-white font-bold active:scale-[0.98] transition disabled:opacity-50 ${digitSide === 'EVEN' ? 'bg-emerald-500 ring-2 ring-emerald-400' : 'bg-emerald-400'}`}>
                      <div className="text-sm">EVEN</div>
                      <div className="text-[10px] opacity-90">+90% · ${(stake * 1.9).toFixed(2)}</div>
                    </button>
                    <button onClick={() => { setDigitSide('ODD'); executeTrade('ODD') }} disabled={isTrading}
                      className={`py-4 rounded-2xl text-white font-bold active:scale-[0.98] transition disabled:opacity-50 ${digitSide === 'ODD' ? 'bg-red-500 ring-2 ring-red-400' : 'bg-red-400'}`}>
                      <div className="text-sm">ODD</div>
                      <div className="text-[10px] opacity-90">+90% · ${(stake * 1.9).toFixed(2)}</div>
                    </button>
                  </div>
                )}

                {digitMode === 'matches-differs' && (
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => { setDigitSide('MATCHES'); executeTrade('MATCHES') }} disabled={isTrading}
                      className={`py-4 rounded-2xl text-white font-bold active:scale-[0.98] transition disabled:opacity-50 ${digitSide === 'MATCHES' ? 'bg-emerald-500 ring-2 ring-emerald-400' : 'bg-emerald-400'}`}>
                      <div className="text-sm">MATCHES {selectedDigit}</div>
                      <div className="text-[10px] opacity-90">+800% · ${(stake * 9).toFixed(2)}</div>
                    </button>
                    <button onClick={() => { setDigitSide('DIFFERS'); executeTrade('DIFFERS') }} disabled={isTrading}
                      className={`py-4 rounded-2xl text-white font-bold active:scale-[0.98] transition disabled:opacity-50 ${digitSide === 'DIFFERS' ? 'bg-red-500 ring-2 ring-red-400' : 'bg-red-400'}`}>
                      <div className="text-sm">DIFFERS</div>
                      <div className="text-[10px] opacity-90">+9% · ${(stake * 1.09).toFixed(2)}</div>
                    </button>
                  </div>
                )}
              </>
            )}

            {/* Manual — Multipliers */}
            {tradeMode === 'manual' && tradeType === 'multipliers' && (
              <>
                <div className="mb-3">
                  <div className={`text-xs mb-2 font-semibold ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Multiplier</div>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[100, 200, 400, 1000].map((m) => (
                      <button key={m} onClick={() => setMultiplier(m)} className={`py-2.5 rounded-lg text-xs font-semibold ${multiplier === m ? 'bg-purple-600 text-white' : (isDark ? 'bg-[#150d24] text-gray-300' : 'bg-gray-100 text-gray-700')}`}>x{m}</button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => executeTrade('UP')} disabled={isTrading} className="py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-bold text-sm disabled:opacity-50">
                    <div className="text-base">↑ UP</div>
                    <div className="text-[10px] opacity-90">higher</div>
                  </button>
                  <button onClick={() => executeTrade('DOWN')} disabled={isTrading} className="py-4 bg-red-500 hover:bg-red-600 text-white rounded-2xl font-bold text-sm disabled:opacity-50">
                    <div className="text-base">↓ DOWN</div>
                    <div className="text-[10px] opacity-90">lower</div>
                  </button>
                </div>
              </>
            )}

            {/* Auto mode */}
            {tradeMode === 'auto' && (
              <>
                <div className="mb-3">
                  <div className={`text-xs mb-2 font-semibold ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Bot trades</div>
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => setBotTrade('RISE')} className={`py-3 rounded-xl text-xs font-bold ${botTrade === 'RISE' ? 'bg-purple-600 text-white' : (isDark ? 'bg-[#150d24] text-gray-300' : 'bg-gray-100 text-gray-700')}`}>RISE</button>
                    <button onClick={() => setBotTrade('FALL')} className={`py-3 rounded-xl text-xs font-bold ${botTrade === 'FALL' ? 'bg-purple-600 text-white' : (isDark ? 'bg-[#150d24] text-gray-300' : 'bg-gray-100 text-gray-700')}`}>FALL</button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div><div className={`text-xs mb-1 font-semibold ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Martingale x</div>
                    <input type="number" value={martingale} onChange={(e) => setMartingale(Number(e.target.value))} className={`w-full rounded-lg px-3 py-2 outline-none border text-sm ${isDark ? 'bg-[#150d24] text-white border-purple-500/20' : 'bg-gray-50 text-gray-900 border-gray-200'}`} /></div>
                  <div><div className={`text-xs mb-1 font-semibold ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Max runs</div>
                    <input type="number" value={maxRuns} onChange={(e) => setMaxRuns(Number(e.target.value))} className={`w-full rounded-lg px-3 py-2 outline-none border text-sm ${isDark ? 'bg-[#150d24] text-white border-purple-500/20' : 'bg-gray-50 text-gray-900 border-gray-200'}`} /></div>
                </div>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div><div className={`text-xs mb-1 font-semibold ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Target profit $</div>
                    <input type="number" value={targetProfit} onChange={(e) => setTargetProfit(Number(e.target.value))} className={`w-full rounded-lg px-3 py-2 outline-none border text-sm ${isDark ? 'bg-[#150d24] text-white border-purple-500/20' : 'bg-gray-50 text-gray-900 border-gray-200'}`} /></div>
                  <div><div className={`text-xs mb-1 font-semibold ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Stop loss $</div>
                    <input type="number" value={stopLoss} onChange={(e) => setStopLoss(Number(e.target.value))} className={`w-full rounded-lg px-3 py-2 outline-none border text-sm ${isDark ? 'bg-[#150d24] text-white border-purple-500/20' : 'bg-gray-50 text-gray-900 border-gray-200'}`} /></div>
                </div>
                <button
                  onClick={() => setIsBotRunning(!isBotRunning)}
                  disabled={!isBotRunning && stake <= 0}
                  className="w-full py-3.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-2xl font-bold text-sm transition flex items-center justify-center gap-2 active:scale-[0.98]">
                  <Play className="w-4 h-4" /> {isBotRunning ? 'Stop bot' : 'Start bot'}
                </button>
              </>
            )}

            {tradeResult && (
              <div className={`mt-3 p-3 rounded-lg text-center text-sm ${tradeResult.includes('won') || tradeResult.includes('✅') || tradeResult.includes('🎉') ? 'bg-emerald-500/15 text-emerald-600 border border-emerald-500/30' : 'bg-red-500/15 text-red-500 border border-red-500/30'}`}>
                {tradeResult}
              </div>
            )}
          </div>
        </div>

        {/* Right panel — desktop only extra */}
        <div className={`hidden lg:block lg:col-span-3 space-y-3`}>
          <div className={`rounded-2xl border p-4 ${isDark ? 'bg-[#0d0818] border-purple-500/20' : 'bg-white border-gray-200'}`}>
            <div className={`text-xs font-bold ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-3`}>ACCOUNT</div>
            <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Balance</div>
            <div className="text-2xl font-bold text-purple-600">${balance.toFixed(2)}</div>
          </div>
        </div>
      </div>

      {/* ── MOBILE BOTTOM NAV ─────────────────────── */}
      <div className={`fixed bottom-0 left-0 right-0 z-30 border-t md:hidden ${isDark ? 'bg-[#0d0818] border-purple-500/20' : 'bg-white border-gray-200'}`}>
        <div className="grid grid-cols-5 py-2">
          <button className="flex flex-col items-center gap-0.5 py-1 text-purple-600">
            <TrendingUp className="w-5 h-5" />
            <span className="text-[10px] font-semibold">Trade</span>
          </button>
          <button onClick={() => { setWalletTab('deposit'); setIsWalletOpen(true); setIsLiveMode(true) }} className={`flex flex-col items-center gap-0.5 py-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            <Wallet className="w-5 h-5" />
            <span className="text-[10px]">Wallet</span>
          </button>
          <Link href="/history" className={`flex flex-col items-center gap-0.5 py-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            <History className="w-5 h-5" />
            <span className="text-[10px]">History</span>
          </Link>
          <button className={`flex flex-col items-center gap-0.5 py-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            <Gift className="w-5 h-5" />
            <span className="text-[10px]">Refer</span>
          </button>
          <button onClick={handleLogout} className={`flex flex-col items-center gap-0.5 py-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            <LogOut className="w-5 h-5" />
            <span className="text-[10px]">Log out</span>
          </button>
        </div>
      </div>

      {/* WALLET MODAL — unchanged content */}
      {isWalletOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className={`w-full max-w-md rounded-2xl border ${isDark ? 'bg-[#0d0818] border-purple-500/20' : 'bg-white border-gray-200'} max-h-[90vh] overflow-y-auto`}>
            <div className={`flex items-center justify-between p-5 border-b ${isDark ? 'border-purple-500/20' : 'border-gray-200'}`}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-purple-500" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Wallet</h3>
                  <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    {isLiveMode ? `Live · $${liveBalance.toFixed(2)}` : `Demo · $${demoBalance.toFixed(2)}`}
                  </p>
                </div>
              </div>
              <button onClick={() => { setIsWalletOpen(false); setWalletMessage(null) }} className={`w-8 h-8 rounded-lg flex items-center justify-center ${isDark ? 'bg-white/5' : 'bg-gray-100'}`}>
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>
            <div className="p-5">
              <div className="flex gap-2 mb-4">
                <button onClick={() => { setWalletTab('deposit'); setWalletMessage(null) }} className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition flex items-center justify-center gap-2 ${walletTab === 'deposit' ? 'bg-purple-600 text-white' : (isDark ? 'text-gray-400' : 'text-gray-600')}`}>
                  <ArrowDownToLine className="w-4 h-4" /> Deposit
                </button>
                <button onClick={() => { setWalletTab('withdraw'); setWalletMessage(null) }} className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition flex items-center justify-center gap-2 ${walletTab === 'withdraw' ? 'bg-purple-600 text-white' : (isDark ? 'text-gray-400' : 'text-gray-600')}`}>
                  <ArrowUpFromLine className="w-4 h-4" /> Withdraw
                </button>
              </div>
              <div className="flex gap-2 mb-4">
                <button onClick={() => { setPaymentMethod('mpesa'); setWalletMessage(null) }} className={`flex-1 py-3 rounded-lg text-sm font-semibold transition ${paymentMethod === 'mpesa' ? 'bg-emerald-600 text-white' : (isDark ? 'bg-[#150d24] text-gray-400' : 'bg-gray-100 text-gray-600')}`}>📱 M-Pesa</button>
                <button onClick={() => { setPaymentMethod('crypto'); setWalletMessage(null) }} className={`flex-1 py-3 rounded-lg text-sm font-semibold transition ${paymentMethod === 'crypto' ? 'bg-orange-500 text-white' : (isDark ? 'bg-[#150d24] text-gray-400' : 'bg-gray-100 text-gray-600')}`}>₿ Crypto</button>
              </div>
              {walletTab === 'deposit' && (
                <>
                  <div className="mb-4">
                    <label className={`text-xs block mb-2 font-semibold ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Amount (USD)</label>
                    <input type="number" value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)} placeholder="0.00" min={1}
                      className={`w-full rounded-lg px-4 py-3 outline-none border text-sm font-medium ${isDark ? 'bg-[#150d24] text-white border-purple-500/20 focus:border-purple-500' : 'bg-gray-50 text-gray-900 border-gray-200 focus:border-purple-500'}`} />
                    <div className="grid grid-cols-4 gap-2 mt-2">
                      {[10, 50, 100, 500].map((amt) => (
                        <button key={amt} onClick={() => setDepositAmount(String(amt))}
                          className={`py-2 rounded-lg text-xs font-semibold ${depositAmount === String(amt) ? 'bg-purple-600 text-white' : (isDark ? 'bg-[#150d24] text-gray-300' : 'bg-gray-100 text-gray-700')}`}>${amt}</button>
                      ))}
                    </div>
                  </div>
                  {paymentMethod === 'mpesa' && (
                    <div className="mb-4">
                      <label className={`text-xs block mb-2 font-semibold ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>M-Pesa Phone Number</label>
                      <input type="tel" value={depositPhone} onChange={(e) => setDepositPhone(e.target.value)} placeholder="0712 345 678"
                        className={`w-full rounded-lg px-4 py-3 outline-none border text-sm ${isDark ? 'bg-[#150d24] text-white border-purple-500/20 focus:border-purple-500' : 'bg-gray-50 text-gray-900 border-gray-200 focus:border-purple-500'}`} />
                    </div>
                  )}
                  {paymentMethod === 'crypto' && (
                    <>
                      <div className="mb-4">
                        <label className={`text-xs block mb-2 font-semibold ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Select Coin</label>
                        <div className="grid grid-cols-3 gap-2">
                          {['USDT', 'BTC', 'ETH'].map((coin) => (
                            <button key={coin} onClick={() => setCryptoCoin(coin)}
                              className={`py-2 rounded-lg text-xs font-semibold ${cryptoCoin === coin ? 'bg-orange-500 text-white' : (isDark ? 'bg-[#150d24] text-gray-300' : 'bg-gray-100 text-gray-700')}`}>{coin}</button>
                          ))}
                        </div>
                      </div>
                      <div className="mb-3 p-2.5 rounded-lg text-xs border bg-amber-50 border-amber-200 text-amber-800">
                        ⚠️ <b>Network: {CRYPTO_NETWORKS[cryptoCoin]}</b> — send only on this network or funds will be lost.
                      </div>
                      <div className={`p-3 rounded-lg mb-4 ${isDark ? 'bg-[#150d24]' : 'bg-gray-50'}`}>
                        <div className={`text-xs mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Send {cryptoCoin} to:</div>
                        <div className="flex items-center gap-2">
                          <div className={`flex-1 text-xs font-mono break-all ${isDark ? 'text-white' : 'text-gray-900'}`}>{CRYPTO_ADDRESSES[cryptoCoin]}</div>
                          <button onClick={() => copyToClipboard(CRYPTO_ADDRESSES[cryptoCoin])} className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                            {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4 text-purple-500" />}
                          </button>
                        </div>
                      </div>
                      <div className="mb-4">
                        <label className={`text-xs block mb-2 font-semibold ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Transaction hash</label>
                        <input type="text" value={cryptoTxHash} onChange={(e) => setCryptoTxHash(e.target.value)} placeholder="Paste your TX hash here"
                          className={`w-full rounded-lg px-4 py-3 outline-none border text-sm font-mono ${isDark ? 'bg-[#150d24] text-white border-purple-500/20 focus:border-purple-500' : 'bg-gray-50 text-gray-900 border-gray-200 focus:border-purple-500'}`} />
                      </div>
                    </>
                  )}
                  {walletMessage && (
                    <div className={`mb-4 p-3 rounded-lg text-sm ${walletMessage.includes('✅') ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/30' : 'bg-red-500/10 text-red-500 border border-red-500/30'}`}>{walletMessage}</div>
                  )}
                  <button onClick={paymentMethod === 'mpesa' ? handleMpesaDeposit : handleCryptoDeposit}
                    disabled={isProcessing || !depositAmount || (paymentMethod === 'crypto' && !cryptoTxHash)}
                    className="w-full py-3.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-xl font-bold text-sm">
                    {isProcessing ? 'Processing...' : paymentMethod === 'mpesa' ? `Pay $${depositAmount || '0'} with M-Pesa` : `Submit ${cryptoCoin} Deposit`}
                  </button>
                </>
              )}
              {walletTab === 'withdraw' && (
                <>
                  <div className="mb-4">
                    <label className={`text-xs block mb-2 font-semibold ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Amount (USD)</label>
                    <input type="number" value={withdrawAmount} onChange={(e) => setWithdrawAmount(e.target.value)} placeholder="0.00" min={1}
                      className={`w-full rounded-lg px-4 py-3 outline-none border text-sm font-medium ${isDark ? 'bg-[#150d24] text-white border-purple-500/20' : 'bg-gray-50 text-gray-900 border-gray-200'}`} />
                    <p className={`text-xs mt-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Available: ${liveBalance.toFixed(2)}</p>
                  </div>
                  {paymentMethod === 'mpesa' && (
                    <div className="mb-4">
                      <label className={`text-xs block mb-2 font-semibold ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>M-Pesa Phone</label>
                      <input type="tel" value={withdrawPhone} onChange={(e) => setWithdrawPhone(e.target.value)} placeholder="0712 345 678"
                        className={`w-full rounded-lg px-4 py-3 outline-none border text-sm ${isDark ? 'bg-[#150d24] text-white border-purple-500/20' : 'bg-gray-50 text-gray-900 border-gray-200'}`} />
                    </div>
                  )}
                  {paymentMethod === 'crypto' && (
                    <div className="mb-4">
                      <label className={`text-xs block mb-2 font-semibold ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Your {cryptoCoin} Address</label>
                      <input type="text" value={withdrawAddress} onChange={(e) => setWithdrawAddress(e.target.value)} placeholder="Paste your wallet address"
                        className={`w-full rounded-lg px-4 py-3 outline-none border text-sm font-mono ${isDark ? 'bg-[#150d24] text-white border-purple-500/20' : 'bg-gray-50 text-gray-900 border-gray-200'}`} />
                    </div>
                  )}
                  {walletMessage && (
                    <div className={`mb-4 p-3 rounded-lg text-sm ${walletMessage.includes('✅') ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/30' : 'bg-red-500/10 text-red-500 border border-red-500/30'}`}>{walletMessage}</div>
                  )}
                  <button onClick={handleWithdraw} disabled={isProcessing || !withdrawAmount || parseFloat(withdrawAmount) > liveBalance}
                    className="w-full py-3.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-xl font-bold text-sm">
                    {isProcessing ? 'Submitting...' : `Request $${withdrawAmount || '0'} Withdrawal`}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* AI SCANNER */}
      {tradeMode === 'ai' && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-md rounded-2xl border bg-white border-gray-200">
            <div className="flex items-start justify-between p-5 border-b border-gray-200">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center"><Sparkles className="w-5 h-5 text-purple-600" /></div>
                <div>
                  <h3 className="font-bold text-lg text-gray-900">Entry Scanner</h3>
                  <p className="text-xs text-gray-500">Deep-scans 10 markets for the best entry</p>
                </div>
              </div>
              <button onClick={() => setTradeMode('manual')} className="w-8 h-8 rounded-lg flex items-center justify-center bg-gray-100"><X className="w-4 h-4 text-gray-600" /></button>
            </div>
            <div className="p-5">
              <div className="mb-4">
                <label className="text-xs block mb-2 font-semibold text-gray-600">Trade type</label>
                <select value={aiTradeType} onChange={(e) => setAiTradeType(e.target.value)} className="w-full rounded-lg px-4 py-3 outline-none border text-sm font-medium bg-gray-50 text-gray-900 border-gray-200">
                  <option>Match / Differ</option><option>Over / Under</option><option>Even / Odd</option><option>Rise / Fall</option>
                </select>
              </div>
              {aiScanning && (
                <>
                  <div className="mb-4 p-5 rounded-2xl bg-purple-50 border border-purple-100 text-center">
                    <div className="w-14 h-14 mx-auto rounded-full bg-purple-500/20 flex items-center justify-center mb-3 animate-pulse"><Sparkles className="w-6 h-6 text-purple-600" /></div>
                    <div className="text-gray-900 font-bold">Deep scanning</div>
                  </div>
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-2"><span className="text-xs text-gray-500">Analyzing...</span><span className="text-xs font-medium text-gray-600">{aiScanProgress}/10</span></div>
                    <div className="h-1.5 rounded-full overflow-hidden bg-gray-100"><div className="h-full bg-purple-500 transition-all" style={{ width: `${(aiScanProgress / 10) * 100}%` }} /></div>
                  </div>
                </>
              )}
              {!aiScanning && aiScanProgress === 10 && (
                <>
                  <button onClick={runDeepScan} className="w-full py-3.5 bg-purple-600 text-white rounded-xl font-bold text-sm mb-3">Re-scan</button>
                  <button onClick={loadScannerBot} className="w-full py-3.5 rounded-xl font-bold text-sm bg-white text-purple-600 border border-purple-300">Load {aiBestMarket} Bot</button>
                </>
              )}
              {!aiScanning && aiScanProgress === 0 && (
                <button onClick={runDeepScan} className="w-full py-3.5 bg-purple-600 text-white rounded-xl font-bold text-sm">Deep Scan</button>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
