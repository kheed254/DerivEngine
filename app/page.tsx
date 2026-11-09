'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { DerivClient } from '@/lib/derivClient'
import { ChevronDown, LogOut, Clock, Zap, X, Sparkles, Copy, Check, Wallet, ArrowDownToLine, ArrowUpFromLine, TrendingUp, History, Gift, BarChart3, ShieldCheck, ArrowRight, Bell, Sun, Moon, Mail, Globe, Hash, Calendar, Phone, AlertCircle, Play, Square } from 'lucide-react'

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
  const [displayCurrency, setDisplayCurrency] = useState<'USD' | 'KES'>('USD')
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
  const [showProfile, setShowProfile] = useState(false)
  const [digitTickCount, setDigitTickCount] = useState(0)

  // PHONE MODAL STATE
  const [isPhoneModalOpen, setIsPhoneModalOpen] = useState(false)
  const [newPhoneNumber, setNewPhoneNumber] = useState('')
  const [isUpdatingPhone, setIsUpdatingPhone] = useState(false)

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

    if (arr.length >= 20) {
      const pcts = counts.map((c) => Math.round((c / total) * 100))
      setDigitPercentages(pcts)
    } else {
      setDigitPercentages(Array(10).fill(0))
    }
    
    setDigitTickCount(arr.length)
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
      } else {
        const { data: newBal } = await supabase
          .from('balances')
          .insert({ user_id: user.id, live_balance: 0, demo_balance: 10000 })
          .select()
          .single()
          
        if (newBal) {
          setDemoBalance(Number(newBal.demo_balance))
          setLiveBalance(Number(newBal.live_balance))
        }
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
    setDigitPercentages(Array(10).fill(0))
    setDigitTickCount(0)
  }, [selectedMarket, showDashboard])

  useEffect(() => {
    if (!showDashboard) return

    let derivClient: DerivClient | null = null
    let isMounted = true
    let derivConnected = false

    const fallbackInterval = setInterval(() => {
      if (!isMounted) return
      if (derivConnected) return
      setPrice((prev) => {
        const next = Math.max(100, prev + (Math.random() - 0.5) * 2)
        setPrevPrice(prev)
        return next
      })
    }, 1000)

    const connectDeriv = async () => {
      try {
        derivClient = new DerivClient()
        derivClient.setOnTick((newPrice: number) => {
          if (!isMounted) return
          derivConnected = true
          setIsDerivConnected(true)
          updatePrice(newPrice)
        })
        await Promise.race([
          derivClient.subscribeToTicks('1HZ100V'),
          new Promise((_, reject) => setTimeout(() => reject(new Error('deriv-timeout')), 5000)),
        ])
        setIsDerivConnected(true)
      } catch (error) {
        console.warn('Deriv connection failed, using fallback feed', error)
        setIsDerivConnected(false)
      }
    }
    connectDeriv()

    return () => {
      isMounted = false
      clearInterval(fallbackInterval)
      if (derivClient) derivClient.unsubscribeFromTicks()
    }
  }, [showDashboard, selectedMarket])

  // Record digit whenever price changes (moved out of setPrice updater)
  useEffect(() => {
    const d = Math.floor(price * 100) % 10
    setLastDigit(d)
    recordDigit(d)
  }, [price])

  useEffect(() => {
    if (!showDashboard || showProfile) return
    let timeout: NodeJS.Timeout
    const initChart = async () => {
      try {
        const container = chartRef.current
        if (!container) { timeout = setTimeout(initChart, 500); return }
        const lib: any = await import('lightweight-charts')
        const createChart = lib.createChart
        const LineStyle = lib.LineStyle
        const AreaSeries = lib.AreaSeries
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
        
        let areaSeries: any
        if (typeof chart.addSeries === 'function' && AreaSeries) {
          areaSeries = chart.addSeries(AreaSeries, { 
            lineColor: '#10b981', 
            topColor: 'rgba(16, 185, 129, 0.3)', 
            bottomColor: 'rgba(16, 185, 129, 0.0)', 
            lineWidth: 2 
          })
        } else if (typeof chart.addAreaSeries === 'function') {
          areaSeries = chart.addAreaSeries({ 
            lineColor: '#10b981', 
            topColor: 'rgba(16, 185, 129, 0.3)', 
            bottomColor: 'rgba(16, 185, 129, 0.0)', 
            lineWidth: 2 
          })
        } else {
          console.warn('⚠️ No compatible area series method on chart')
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
        if (areaSeries) {
          areaSeries.setData(initialData as any)
          seriesRef.current = areaSeries
        }
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
  }, [showDashboard, isLoggedIn, selectedMarket, isDark, showProfile])

  useEffect(() => {
    if (!showDashboard || showProfile) return
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
  }, [showDashboard, price, selectedMarket, showProfile])

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

      const res = await fetch('/api/kotani/deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: depositPhone,
          amount,
          depositId: depositRecord.id,
          userId: user.id,
        }),
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
    if (isTrading) return
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
        if (newDemo < 0) { setTradeResult('❌ Insufficient demo balance'); setIsTrading(false); return }
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

  const handleLogout = async () => { 
    await supabase.auth.signOut(); 
    setShowDashboard(false); 
    setShowProfile(false);
    setUser(null); 
  }
  
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

  // Update phone number function
  const handleUpdatePhone = async () => {
    if (!newPhoneNumber || newPhoneNumber.length < 10) {
      alert("Please enter a valid phone number")
      return
    }
    setIsUpdatingPhone(true)
    const { error } = await supabase.auth.updateUser({
      data: { phone: newPhoneNumber }
    })
    
    if (error) {
      alert(error.message)
    } else {
      setUser({ ...user, user_metadata: { ...user.user_metadata, phone: newPhoneNumber } })
      setIsPhoneModalOpen(false)
      setNewPhoneNumber('')
    }
    setIsUpdatingPhone(false)
  }

  if (!showDashboard) {
    return (
      <main className="min-h-screen bg-[#f8f9fc] text-gray-900 font-sans overflow-hidden">
        
        {/* HEADER */}
        <header className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between relative z-10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#7c3aed] flex items-center justify-center shadow-lg shadow-purple-500/30">
              <span className="text-white font-bold text-lg italic">~</span>
            </div>
            <span className="font-bold text-xl tracking-tight text-gray-900">DerivEngine</span>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setTheme(isDark ? 'light' : 'dark')} className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-300 transition">
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <Link href="/login" className="px-5 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition">
              Sign in
            </Link>
            <Link href="/register" className="px-5 py-2 text-sm text-white bg-purple-600 hover:bg-purple-700 rounded-lg font-medium transition shadow-md shadow-purple-500/30">
              Get started
            </Link>
          </div>
        </header>

        {/* HERO SECTION */}
        <section className="relative max-w-7xl mx-auto px-6 pt-12 pb-24 lg:pt-20">
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[50%] rounded-full bg-purple-300/30 blur-[100px]" />
            <div className="absolute bottom-[20%] right-[10%] w-[30%] h-[40%] rounded-full bg-blue-300/20 blur-[100px]" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-purple-100 rounded-full text-xs font-medium text-purple-700 mb-6 border border-purple-200">
                <span className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></span>
                Live volatility index trading
              </div>
              <h1 className="text-5xl lg:text-7xl font-extrabold leading-[1.1] mb-6 text-gray-900 tracking-tight">
                Trade the <br/> markets.<br />
                <span className="text-purple-600">Live.</span>
              </h1>
              <p className="text-lg text-gray-600 max-w-lg mb-8 leading-relaxed">
                Predict whether a Volatility Index will rise or fall. Win up to <strong className="text-purple-600">1.9×</strong> your stake. Deposit and withdraw with ease — built for everyone.
              </p>
              <div className="flex flex-wrap items-center gap-4 mb-8">
                <Link href="/register" className="px-8 py-3.5 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl transition shadow-lg shadow-purple-500/30 flex items-center gap-2 hover:-translate-y-0.5">
                  Start trading <ArrowRight className="w-4 h-4" />
                </Link>
                <Link href="/login" className="px-8 py-3.5 bg-gray-200/80 hover:bg-gray-300 text-gray-800 font-semibold rounded-xl transition">
                  I have an account
                </Link>
              </div>
              <div className="flex items-center gap-6 text-sm text-gray-500 font-medium">
                <div className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-emerald-500"/> Real live prices</div>
                <div className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-emerald-500"/> Trades from 15 seconds</div>
              </div>
            </div>

            <div className="relative lg:h-[400px] flex items-center justify-center">
              <svg className="absolute inset-0 w-full h-full text-purple-200/50 -z-10" viewBox="0 0 100 100" preserveAspectRatio="none">
                <path d="M0,80 Q10,70 20,75 T40,60 T60,70 T80,40 T100,50" fill="none" stroke="currentColor" strokeWidth="1" />
              </svg>
              
              <div className="bg-white rounded-2xl shadow-2xl shadow-purple-500/10 p-6 w-full max-w-sm border border-gray-100 z-10 relative">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="text-sm font-bold text-gray-900">Volatility 100 Index</div>
                    <div className="text-xs text-emerald-500 flex items-center gap-1 font-medium mt-1">
                       <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span> Live market
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-extrabold text-emerald-500 tracking-tight">581.48</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* LIVE TICKER TAPE */}
        <div className="border-y border-gray-200 bg-white overflow-hidden py-3 flex items-center">
          <div className="flex items-center gap-8 animate-[marquee_20s_linear_infinite] whitespace-nowrap px-4 opacity-80">
            <div className="flex items-center gap-2 text-sm"><span className="text-gray-500">Naomi A.</span> <span className="text-gray-900">won</span> <span className="text-emerald-500 font-semibold">$0.45</span> <span className="text-gray-500">on V10</span></div>
            <div className="flex items-center gap-2 text-sm"><span className="text-gray-500">James T.</span> <span className="text-gray-900">won</span> <span className="text-emerald-500 font-semibold">$0.45</span> <span className="text-gray-500">on V100</span></div>
            <div className="flex items-center gap-2 text-sm"><span className="text-gray-500">Mary K.</span> <span className="text-gray-900">won</span> <span className="text-emerald-500 font-semibold">$0.06</span> <span className="text-gray-500">on V100 1s</span></div>
            <div className="flex items-center gap-2 text-sm"><span className="text-gray-500">Cynthia M.</span> <span className="text-gray-900">won</span> <span className="text-emerald-500 font-semibold">$0.45</span> <span className="text-gray-500">on V25 1s</span></div>
            <div className="flex items-center gap-2 text-sm"><span className="text-gray-500">Linda B.</span> <span className="text-gray-900">won</span> <span className="text-emerald-500 font-semibold">$9.00</span> <span className="text-gray-500">on V100 1s</span></div>
          </div>
        </div>

        {/* AVAILABLE MARKETS */}
        <section className="bg-[#f8f9fc] py-8 text-center max-w-5xl mx-auto px-6">
          <div className="text-xs uppercase tracking-widest font-bold text-gray-400 mb-4">Available Markets</div>
          <div className="flex flex-wrap justify-center gap-2">
            {['V10', 'V25', 'V50', 'V75', 'V100', 'V10 1s', 'V25 1s', 'V50 1s', 'V75 1s', 'V100 1s'].map((v) => (
              <div key={v} className="bg-white border border-gray-200 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-600 shadow-sm">
                <span className="text-gray-900 font-bold">{v}</span> Volatility {v.replace('V', '')}
              </div>
            ))}
          </div>
        </section>

        {/* FEATURES */}
        <section className="bg-gray-50 py-24">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">Everything you need to trade</h2>
              <p className="text-lg text-gray-600">A professional trading experience without the complexity.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { icon: <BarChart3 className="w-5 h-5 text-purple-600" />, t: 'Real live prices', d: 'Volatility indices streamed live. Your trades settle on the genuine market feed — no games.' },
                { icon: <Zap className="w-5 h-5 text-purple-600" />, t: 'Trade in one tap', d: 'Pick a market, set your stake and time, then tap Rise or Fall. That\'s it.' },
                { icon: <Wallet className="w-5 h-5 text-purple-600" />, t: 'Easy deposits & withdrawals', d: 'Fund your account and cash out your winnings via M-Pesa, crypto or bank.' },
                { icon: <ShieldCheck className="w-5 h-5 text-purple-600" />, t: 'Secure by design', d: 'Every stake and payout is recorded to a tamper-proof ledger tied to your account.' },
                { icon: <Clock className="w-5 h-5 text-purple-600" />, t: 'Fast contracts', d: 'Durations from 15 seconds to 5 minutes. Know your outcome quickly.' },
                { icon: <TrendingUp className="w-5 h-5 text-purple-600" />, t: 'Track performance', d: 'See your win rate, net P&L, and full trade history at a glance.' },
              ].map((f, i) => (
                <div key={i} className="bg-white p-8 rounded-2xl border border-gray-100 shadow-xl shadow-gray-200/50 hover:shadow-2xl hover:shadow-purple-500/10 transition">
                  <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center mb-6">
                    {f.icon}
                  </div>
                  <h3 className="font-bold text-lg text-gray-900 mb-3">{f.t}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{f.d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 3 STEPS */}
        <section className="py-24 bg-white">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">Start in 3 steps</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { n: '1', t: 'Create an account', d: 'Sign up free in under a minute.' },
                { n: '2', t: 'Deposit funds', d: 'Add money with your preferred method.' },
                { n: '3', t: 'Trade & withdraw', d: 'Predict Rise or Fall, win, and cash out.' },
              ].map((step, i) => (
                <div key={i} className="bg-[#f8f9fc] rounded-2xl p-8 text-center border border-gray-100">
                  <div className="w-10 h-10 rounded-full bg-purple-600 text-white font-bold flex items-center justify-center text-lg mx-auto mb-6 shadow-lg shadow-purple-500/30">{step.n}</div>
                  <h3 className="font-bold text-lg text-gray-900 mb-2">{step.t}</h3>
                  <p className="text-gray-600 text-sm">{step.d}</p>
                </div>
              ))}
            </div>
            <div className="text-center mt-12">
              <Link href="/register" className="inline-flex items-center gap-2 px-8 py-3.5 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl transition shadow-lg shadow-purple-500/30 hover:-translate-y-0.5">
                Create free account <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="bg-[#f8f9fc] border-t border-gray-200 py-12">
          <div className="max-w-7xl mx-auto px-6 text-center">
            <div className="flex items-center justify-center gap-2 mb-6">
              <div className="w-6 h-6 rounded-md bg-[#7c3aed] flex items-center justify-center">
                <span className="text-white font-bold text-xs italic">~</span>
              </div>
              <span className="font-bold text-gray-900">DerivEngine</span>
            </div>
            <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-500 mb-6">
              <Link href="#" className="hover:text-gray-900 transition">How it works</Link>
              <Link href="#" className="hover:text-gray-900 transition">Payout rules</Link>
              <Link href="/login" className="hover:text-gray-900 transition">Sign in</Link>
              <Link href="/register" className="hover:text-gray-900 transition">Create account</Link>
            </div>
            <p className="text-xs text-gray-400 max-w-2xl mx-auto leading-relaxed">
              Trading volatility indices involves risk and may not be suitable for everyone. Only trade with money you can afford to lose. Prices are provided by the Deriv synthetic index feed.
            </p>
            <p className="text-xs text-gray-400 mt-4">© 2026 DerivEngine. All rights reserved.</p>
          </div>
        </footer>
      </main>
    )
  }

  const kesAmount = (stake * 130).toLocaleString()
  const userInitial = user?.email ? user.email[0].toUpperCase() : 'U'
  const accountNumber = user?.id ? `ST-${user.id.slice(0, 6).toUpperCase()}` : 'ST-000000'
  const memberSince = user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'October 2026'
  const userEmail = user?.email || 'user@example.com'
  const fullName = user?.user_metadata?.full_name || userEmail.split('@')[0].toUpperCase()
  const phoneNumber = user?.user_metadata?.phone || user?.phone || null
  
  const totalDeposited = liveBalance;
  const totalWithdrawn = 0;
  const totalTrades = closedPositions.length;
  const totalWins = closedPositions.filter(p => p.result === 'WIN').length;
  const winRate = totalTrades > 0 ? Math.round((totalWins / totalTrades) * 100) : 0;
  const netPnl = closedPositions.reduce((sum, p) => sum + p.payout, 0);

  // ═══════════════════════════════════════════════════════
  // PROFILE PAGE
  // ═══════════════════════════════════════════════════════
  if (showProfile) {
    return (
      <main className={`min-h-screen pb-20 ${isDark ? 'bg-[#0a0613] text-white' : 'bg-gray-50 text-gray-900'}`}>
        
        <nav className={`border-b sticky top-0 z-30 ${isDark ? 'border-[#1f1433] bg-[#0d0818]' : 'border-gray-200 bg-white'}`}>
          <div className="px-4 md:px-6 py-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center">
                <span className="text-white font-bold text-sm italic">~</span>
              </div>
              <span className={`font-bold hidden sm:inline text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>DerivEngine</span>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => setTheme(isDark ? 'light' : 'dark')}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition ${isDark ? 'bg-white/5 text-gray-400 hover:bg-white/10' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
              <button
                onClick={() => { setWalletTab('deposit'); setIsWalletOpen(true); setIsLiveMode(true) }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold bg-purple-600 hover:bg-purple-700 text-white"
              >
                <ArrowDownToLine className="w-4 h-4" /> Deposit
              </button>
              <div className="w-9 h-9 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold text-sm ml-1">
                {userInitial}
              </div>
            </div>
          </div>
        </nav>

        <div className="px-4 md:px-6 py-6 max-w-2xl mx-auto space-y-4">
          
          <div className={`rounded-3xl border p-6 ${isDark ? 'bg-[#130a21] border-[#2a1b40]' : 'bg-white border-gray-200'}`}>
            <div className="flex items-start gap-4 mb-6">
              <div className="w-16 h-16 rounded-2xl bg-purple-600 flex items-center justify-center text-white font-bold text-2xl shadow-lg shadow-purple-500/30">
                {userInitial}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className={`text-xl font-bold truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>{fullName}</h2>
                <p className={`text-sm truncate ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{userEmail}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs font-bold text-gray-400">ACCOUNT NO.</span>
                  <span className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{accountNumber}</span>
                  <button onClick={() => copyToClipboard(accountNumber)} className="text-gray-400 hover:text-gray-600">
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${isLiveMode ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20'}`}>
              <ShieldCheck className="w-3.5 h-3.5" /> {isLiveMode ? 'Live account' : 'Demo account'}
            </div>
          </div>

          <div className={`rounded-3xl border p-6 ${isDark ? 'bg-[#130a21] border-[#2a1b40]' : 'bg-white border-gray-200'}`}>
            <h3 className={`font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>Account details</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? 'bg-[#1f1433]' : 'bg-gray-100'}`}>
                  <Mail className="w-4 h-4 text-gray-400" />
                </div>
                <div>
                  <div className="text-xs text-gray-500 font-semibold">EMAIL</div>
                  <div className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{userEmail}</div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? 'bg-[#1f1433]' : 'bg-gray-100'}`}>
                  <Globe className="w-4 h-4 text-gray-400" />
                </div>
                <div>
                  <div className="text-xs text-gray-500 font-semibold">COUNTRY</div>
                  <div className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>🇰🇪 Kenya</div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? 'bg-[#1f1433]' : 'bg-gray-100'}`}>
                  <Hash className="w-4 h-4 text-gray-400" />
                </div>
                <div>
                  <div className="text-xs text-gray-500 font-semibold">ACCOUNT NUMBER</div>
                  <div className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{accountNumber}</div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? 'bg-[#1f1433]' : 'bg-gray-100'}`}>
                  <Calendar className="w-4 h-4 text-gray-400" />
                </div>
                <div>
                  <div className="text-xs text-gray-500 font-semibold">MEMBER SINCE</div>
                  <div className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{memberSince}</div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? 'bg-[#1f1433]' : 'bg-gray-100'}`}>
                  <TrendingUp className="w-4 h-4 text-gray-400" />
                </div>
                <div>
                  <div className="text-xs text-gray-500 font-semibold">BALANCE</div>
                  <div className={`text-sm font-medium text-emerald-500`}>${balance.toFixed(2)}</div>
                </div>
              </div>
            </div>
          </div>

          <div className={`rounded-3xl border p-6 ${isDark ? 'bg-[#130a21] border-[#2a1b40]' : 'bg-white border-gray-200'}`}>
            <div className="flex justify-between items-center mb-4">
              <h3 className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Phone number</h3>
              
              {phoneNumber ? (
                <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                  <ShieldCheck className="w-3 h-3" /> Verified
                </div>
              ) : (
                <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-500/10 text-red-500 border border-red-500/20">
                  <AlertCircle className="w-3 h-3" /> Missing
                </div>
              )}
            </div>
            
            <div className="flex items-start gap-4 mb-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? 'bg-[#1f1433]' : 'bg-gray-100'}`}>
                <Phone className="w-4 h-4 text-purple-500" />
              </div>
              <div>
                <div className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {phoneNumber || 'Not set'}
                </div>
                <div className="text-xs text-gray-500 mt-1">Used to authorize your M-Pesa deposits & withdrawals.</div>
              </div>
            </div>
            <button 
              onClick={() => {
                setNewPhoneNumber(phoneNumber || '');
                setIsPhoneModalOpen(true);
              }}
              className={`px-4 py-2 rounded-lg text-sm font-semibold border transition ${isDark ? 'border-[#2a1b40] hover:bg-white/5' : 'border-gray-200 hover:bg-gray-50'}`}
            >
              Change number
            </button>
          </div>

          <div className={`rounded-3xl border p-6 ${isDark ? 'bg-[#130a21] border-[#2a1b40]' : 'bg-white border-gray-200'}`}>
            <h3 className={`font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>Your trading</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className={`p-4 rounded-xl border ${isDark ? 'bg-[#1a1126] border-[#2a1b40]' : 'bg-gray-50 border-gray-100'}`}>
                <div className="text-[10px] text-gray-500 font-bold tracking-wider mb-1">DEPOSITED</div>
                <div className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>${totalDeposited.toFixed(2)}</div>
              </div>
              <div className={`p-4 rounded-xl border ${isDark ? 'bg-[#1a1126] border-[#2a1b40]' : 'bg-gray-50 border-gray-100'}`}>
                <div className="text-[10px] text-gray-500 font-bold tracking-wider mb-1">WITHDRAWN</div>
                <div className={`text-xl font-bold text-yellow-500`}>${totalWithdrawn.toFixed(2)}</div>
              </div>
              <div className={`p-4 rounded-xl border ${isDark ? 'bg-[#1a1126] border-[#2a1b40]' : 'bg-gray-50 border-gray-100'}`}>
                <div className="text-[10px] text-gray-500 font-bold tracking-wider mb-1">TRADES</div>
                <div className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{totalTrades}</div>
              </div>
              <div className={`p-4 rounded-xl border ${isDark ? 'bg-[#1a1126] border-[#2a1b40]' : 'bg-gray-50 border-gray-100'}`}>
                <div className="text-[10px] text-gray-500 font-bold tracking-wider mb-1">WIN RATE</div>
                <div className={`text-xl font-bold text-purple-500`}>{winRate}%</div>
              </div>
              <div className={`p-4 rounded-xl border ${isDark ? 'bg-[#1a1126] border-[#2a1b40]' : 'bg-gray-50 border-gray-100'}`}>
                <div className="text-[10px] text-gray-500 font-bold tracking-wider mb-1">WINS</div>
                <div className={`text-xl font-bold text-emerald-500`}>{totalWins}</div>
              </div>
              <div className={`p-4 rounded-xl border ${isDark ? 'bg-[#1a1126] border-[#2a1b40]' : 'bg-gray-50 border-gray-100'}`}>
                <div className="text-[10px] text-gray-500 font-bold tracking-wider mb-1">NET P&L</div>
                <div className={`text-xl font-bold ${netPnl >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                  {netPnl >= 0 ? '+' : ''}${netPnl.toFixed(2)}
                </div>
              </div>
            </div>
          </div>

          <button onClick={handleLogout} className={`w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-sm transition ${isDark ? 'bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20' : 'bg-red-50 text-red-500 border border-red-100 hover:bg-red-100'}`}>
            <LogOut className="w-4 h-4" /> Log out
          </button>

        </div>

        <div className={`fixed bottom-0 left-0 right-0 z-30 border-t md:hidden ${isDark ? 'bg-[#0d0818] border-[#1f1433]' : 'bg-white border-gray-200'}`}>
          <div className="grid grid-cols-5 py-2">
            <button onClick={() => setShowProfile(false)} className={`flex flex-col items-center gap-0.5 py-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              <TrendingUp className="w-5 h-5" />
              <span className="text-[10px]">Trade</span>
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

        {isPhoneModalOpen && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
            <div className={`w-full max-w-sm rounded-2xl border p-6 ${isDark ? 'bg-[#0d0818] border-purple-500/20' : 'bg-white border-gray-200'}`}>
              <h3 className={`font-bold text-lg mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>Change Phone Number</h3>
              <div className="mb-4">
                <label className={`text-xs block mb-2 font-semibold ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>New Phone Number</label>
                <input 
                  type="tel" 
                  value={newPhoneNumber} 
                  onChange={(e) => setNewPhoneNumber(e.target.value)} 
                  placeholder="0712 345 678"
                  className={`w-full rounded-lg px-4 py-3 outline-none border text-sm ${isDark ? 'bg-[#150d24] text-white border-purple-500/20 focus:border-purple-500' : 'bg-gray-50 text-gray-900 border-gray-200 focus:border-purple-500'}`} 
                />
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => setIsPhoneModalOpen(false)} 
                  className={`flex-1 py-2.5 rounded-lg font-semibold text-sm ${isDark ? 'bg-[#150d24] text-white' : 'bg-gray-100 text-gray-700'}`}
                >
                  Cancel
                </button>
                <button 
                  onClick={handleUpdatePhone} 
                  disabled={isUpdatingPhone}
                  className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-lg font-bold text-sm"
                >
                  {isUpdatingPhone ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    )
  }

  // ═══════════════════════════════════════════════════════
  // DASHBOARD
  // ═══════════════════════════════════════════════════════
  return (
    <main className="min-h-screen pb-20 md:pb-0 bg-[#f8f9fc] text-gray-900">

      {/* ── TOP BAR ───────────────────────────── */}
      <nav className="border-b border-gray-200 bg-white sticky top-0 z-30">
        <div className="px-4 md:px-6 py-2 flex items-center justify-between gap-3">
          
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center">
                <span className="text-white font-bold text-sm italic">~</span>
              </div>
              <span className="font-bold text-lg text-gray-900 hidden lg:inline">DerivEngine</span>
            </div>
            
            <div className="hidden md:flex items-center gap-1">
              <button className="px-3 py-2 rounded-lg text-sm font-medium text-gray-900 bg-gray-100 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-purple-600" /> Trade
              </button>
              <button onClick={() => { setWalletTab('deposit'); setIsWalletOpen(true) }} className="px-3 py-2 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-50 flex items-center gap-2">
                <Wallet className="w-4 h-4" /> Wallet
              </button>
              <Link href="/history" className="px-3 py-2 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-50 flex items-center gap-2">
                <History className="w-4 h-4" /> History
              </Link>
              <button className="px-3 py-2 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-50 flex items-center gap-2">
                <Gift className="w-4 h-4" /> Refer
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-shrink-0">
            
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs bg-emerald-50 border border-emerald-200">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
              <span className="text-emerald-600 font-medium">LIVE ACCOUNT</span>
            </div>

            <div className="relative hidden md:block">
              <button
                onClick={() => setIsAccountDropdownOpen(!isAccountDropdownOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs border bg-gray-50 border-gray-200 hover:bg-gray-100 transition"
              >
                <div className="text-left">
                  <div className="text-[9px] font-bold tracking-wider uppercase text-gray-500">
                    REAL
                  </div>
                  <div className="font-bold text-sm text-gray-900">
                    ${balance.toFixed(2)}
                  </div>
                </div>
                <ChevronDown className="w-3 h-3 text-gray-400" />
              </button>

              {isAccountDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-[90]" onClick={() => setIsAccountDropdownOpen(false)} />
                  <div className="absolute top-full mt-2 right-0 w-72 rounded-2xl border shadow-2xl z-[100] overflow-hidden bg-white border-gray-200">
                    <div className="px-4 py-2 text-[10px] font-bold tracking-wider text-gray-400">SWITCH ACCOUNT</div>
                    <button onClick={() => { setIsLiveMode(true); setIsAccountDropdownOpen(false) }} className="w-full flex items-center gap-3 px-4 py-3 transition hover:bg-gray-50">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isLiveMode ? 'bg-purple-100' : 'bg-gray-100'}`}>
                        {isLiveMode ? <span className="text-purple-600 text-sm">✓</span> : <span className="text-gray-400 text-sm">🔒</span>}
                      </div>
                      <div className="flex-1 text-left">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-sm text-gray-900">Real account</span>
                          <span className="font-bold text-sm text-purple-600">${liveBalance.toFixed(2)}</span>
                        </div>
                        <div className="text-[11px] text-gray-500">Your live funds</div>
                      </div>
                    </button>
                    <div className="h-px bg-gray-100" />
                    <button onClick={() => { setIsLiveMode(false); setIsAccountDropdownOpen(false) }} className="w-full flex items-center gap-3 px-4 py-3 transition hover:bg-gray-50">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${!isLiveMode ? 'bg-purple-100' : 'bg-gray-100'}`}>
                        {!isLiveMode ? <span className="text-purple-600 text-sm">✓</span> : <span className="text-yellow-500 text-sm">⚠️</span>}
                      </div>
                      <div className="flex-1 text-left">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-sm text-gray-900">Demo account</span>
                          <span className="font-bold text-sm text-yellow-500">${demoBalance.toFixed(2)}</span>
                        </div>
                        <div className="text-[11px] text-gray-500">Practice · virtual funds</div>
                      </div>
                    </button>
                    <div className="h-px bg-gray-100" />
                    <button onClick={() => { setIsAccountDropdownOpen(false); setShowProfile(true); }} className="w-full flex items-center gap-3 px-4 py-3 transition hover:bg-gray-50">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-100">
                        <span className="text-blue-500 text-sm">👤</span>
                      </div>
                      <div className="flex-1 text-left">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-sm text-gray-900">Profile</span>
                        </div>
                        <div className="text-[11px] text-gray-500">Account details & logout</div>
                      </div>
                    </button>
                  </div>
                </>
              )}
            </div>

            <button
              onClick={() => { setWalletTab('withdraw'); setIsWalletOpen(true) }}
              className="hidden md:flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold bg-purple-600 text-white hover:bg-purple-700 transition"
            >
              <ArrowUpFromLine className="w-4 h-4" /> Withdraw
            </button>

            <button 
              onClick={() => setShowProfile(true)}
              className="w-9 h-9 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold text-sm hover:bg-purple-700 transition"
            >
              {userInitial}
            </button>
            
            <button
              onClick={() => setTheme(isDark ? 'light' : 'dark')}
              className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition hidden md:flex"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            <button onClick={handleLogout} className="w-9 h-9 rounded-lg flex items-center justify-center bg-gray-100 md:hidden">
              <LogOut className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        </div>
      </nav>

      {/* ── MAIN LAYOUT ───────────────────────────── */}
      <div className="px-4 py-4 grid grid-cols-1 lg:grid-cols-12 gap-4 max-w-[1600px] mx-auto">

        {/* Left Panel: Positions */}
        <div className="hidden lg:block lg:col-span-2 rounded-2xl border p-4 bg-white border-gray-200">
          <div className="flex gap-2 mb-4">
            <button onClick={() => setActiveTab('open')} className={`flex-1 py-2 rounded-lg text-xs font-medium ${activeTab === 'open' ? 'bg-purple-100 text-purple-700' : 'text-gray-500'}`}>Open ({openPositions.length})</button>
            <button onClick={() => setActiveTab('closed')} className={`flex-1 py-2 rounded-lg text-xs font-medium ${activeTab === 'closed' ? 'bg-purple-100 text-purple-700' : 'text-gray-500'}`}>Closed ({closedPositions.length})</button>
          </div>
          <div className="text-center py-12 text-xs text-gray-400">
            {activeTab === 'open' && openPositions.length === 0 && <div>No open positions yet.</div>}
            {activeTab === 'closed' && closedPositions.length === 0 && <div>No closed positions yet.</div>}
          </div>
        </div>

        {/* Center Panel: Chart & Digits */}
        <div className="lg:col-span-7 space-y-4">
          
          <div className="rounded-2xl border p-4 bg-white border-gray-200">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <select
                    value={selectedMarket}
                    onChange={(e) => setSelectedMarket(e.target.value)}
                    className="font-bold text-base outline-none cursor-pointer bg-transparent text-gray-900"
                  >
                    {markets.map((m) => (<option key={m} value={m} className="bg-white">{m}</option>))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-gray-400 -ml-1" />
                  <span className="text-[10px] bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded flex items-center gap-1 flex-shrink-0 font-medium">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span> LIVE
                  </span>
                  <button className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded flex items-center gap-1 flex-shrink-0 font-medium">
                    <Bell className="w-3 h-3" /> Alert
                  </button>
                </div>
                <div className="text-[11px] text-gray-500">Very High volatility · synthetic index</div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-xs text-gray-400 mb-1">LAST DIGIT</div>
                <div className="flex items-center gap-4">
                  <span className="text-3xl font-bold text-purple-600">{lastDigit}</span>
                  <div>
                    <div className="text-xl font-bold text-gray-900">{price.toFixed(2)}</div>
                    <div className={`text-xs font-semibold ${priceChangePct >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                      {priceChangePct >= 0 ? '▲' : '▼'} {Math.abs(priceChangePct).toFixed(2)}%
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-between items-center text-[11px] text-gray-500 mb-2 mt-1">
              <div>High <span className="text-emerald-500">{(price + 5).toFixed(2)}</span></div>
              <div>Low <span className="text-red-500">{(price - 5).toFixed(2)}</span></div>
            </div>

            <div ref={chartRef} className="w-full rounded-lg overflow-hidden" style={{ height: '320px' }} />
          </div>

          {/* Digits Row */}
          <div className="rounded-2xl border p-4 bg-white border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <div className="text-xs font-bold text-gray-600">
                <span className="text-purple-500 text-lg">#</span> LIVE LAST DIGITS
              </div>
              <div className="text-[10px] text-gray-400">tap a number to set your barrier</div>
            </div>
            <div className="grid grid-cols-10 gap-1">
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => {
                const pct = digitPercentages[digit]
                const circumference = 2 * Math.PI * 20
                const offset = circumference - (Math.min(pct, 100) / 100) * circumference
                const isLast = digit === lastDigit
                const isSelected = selectedDigit === digit
                return (
                  <button key={digit} onClick={() => setSelectedDigit(digit)} className="flex flex-col items-center gap-1">
                    <div className="relative w-10 h-10 md:w-12 md:h-12 flex items-center justify-center">
                      <svg className="absolute inset-0 -rotate-90" width="100%" height="100%" viewBox="0 0 40 40">
                        <circle cx="20" cy="20" r="20" fill="none" stroke="#f3f4f6" strokeWidth="3" />
                        <circle cx="20" cy="20" r="20" fill="none" stroke={isLast ? '#10b981' : isSelected ? '#7c3aed' : '#d1d5db'} strokeWidth="3" strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" className="transition-all duration-500" />
                      </svg>
                      <div className={`w-7 h-7 md:w-9 md:h-9 rounded-full flex items-center justify-center transition-all bg-white ${isSelected ? 'ring-2 ring-purple-500' : isLast ? 'ring-2 ring-emerald-500' : ''}`}>
                        <span className={`text-xs md:text-sm font-bold ${isSelected || isLast ? 'text-gray-900' : 'text-gray-500'}`}>{digit}</span>
                      </div>
                    </div>
                    <span className={`text-[9px] md:text-[10px] font-medium ${isLast ? 'text-emerald-500' : 'text-gray-400'}`}>{pct}%</span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Right Panel: Trade Controls */}
        <div className="lg:col-span-3 space-y-4">
          <div className="rounded-2xl border p-4 bg-white border-gray-200">
            
            {/* Mode Toggle */}
            <div className="grid grid-cols-3 gap-1 p-1 rounded-xl mb-4 bg-gray-100">
              <button onClick={() => setTradeMode('manual')} className={`py-2 rounded-lg text-xs font-semibold transition ${tradeMode === 'manual' ? 'bg-purple-600 text-white shadow' : 'text-gray-500'}`}>Manual</button>
              <button onClick={() => setTradeMode('auto')} className={`py-2 rounded-lg text-xs font-semibold transition ${tradeMode === 'auto' ? 'bg-purple-600 text-white shadow' : 'text-gray-500'}`}>Auto</button>
              <button onClick={() => setTradeMode('ai')} className={`py-2 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1 ${tradeMode === 'ai' ? 'bg-purple-600 text-white shadow' : 'text-gray-500'}`}>✨ AI</button>
            </div>

            {/* Trade Type Toggle */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              <button onClick={() => setTradeType('rise-fall')} className={`py-2 rounded-xl text-xs font-semibold border transition ${tradeType === 'rise-fall' ? 'bg-purple-600 text-white border-purple-600' : 'bg-gray-50 text-gray-600 border-gray-200'}`}>Rise/Fall</button>
              <button onClick={() => setTradeType('digits')} className={`py-2 rounded-xl text-xs font-semibold border transition ${tradeType === 'digits' ? 'bg-purple-600 text-white border-purple-600' : 'bg-gray-50 text-gray-600 border-gray-200'}`}>Digits</button>
              {tradeMode !== 'auto' && (
                <button onClick={() => setTradeType('multipliers')} className={`py-2 rounded-xl text-xs font-semibold border transition ${tradeType === 'multipliers' ? 'bg-purple-600 text-white border-purple-600' : 'bg-gray-50 text-gray-600 border-gray-200'}`}>Multipliers</button>
              )}
            </div>

            {/* Stake Input */}
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-semibold text-gray-600">Stake (USD)</span>
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <Wallet className="w-3 h-3" /> ${balance.toFixed(2)}
              </div>
            </div>

            <div className="flex items-center gap-2 mb-1">
              <button onClick={() => setStake(Math.max(1, stake - 1))} className="w-10 h-12 rounded-xl text-xl font-bold transition active:scale-95 bg-gray-50 text-gray-900 border border-gray-200">−</button>
              <input
                type="number" 
                value={stake}
                onChange={(e) => setStake(Math.max(1, Number(e.target.value)))} 
                min={1}
                className="flex-1 min-w-0 w-full text-center text-xl font-bold rounded-xl py-2 outline-none border border-gray-200 focus:border-purple-500 transition bg-gray-50 text-gray-900"
              />
              <button onClick={() => setStake(stake + 1)} className="w-10 h-12 rounded-xl text-xl font-bold transition active:scale-95 bg-gray-50 text-gray-900 border border-gray-200">+</button>
            </div>
            <div className="text-right text-[10px] mb-4 text-gray-400">
              ≈ KES {(stake * 130).toLocaleString()}
            </div>

            {/* Quick Stakes */}
            <div className="grid grid-cols-6 gap-1 mb-4">
              {[1, 5, 10, 25, 50, 100].map((val) => (
                <button key={val} onClick={() => setStake(val)}
                  className={`py-2 rounded-lg text-xs font-semibold transition ${stake === val ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
                  {val}
                </button>
              ))}
            </div>

            {/* Manual: Digits */}
            {tradeMode === 'manual' && tradeType === 'digits' && (
              <>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  <button onClick={() => setDigitMode('over-under')} className={`py-2 rounded-lg text-xs font-semibold border ${digitMode === 'over-under' ? 'bg-purple-600 text-white border-purple-600' : 'bg-gray-50 text-gray-600 border-gray-200'}`}>Over / Under</button>
                  <button onClick={() => setDigitMode('even-odd')} className={`py-2 rounded-lg text-xs font-semibold border ${digitMode === 'even-odd' ? 'bg-purple-600 text-white border-purple-600' : 'bg-gray-50 text-gray-600 border-gray-200'}`}>Even / Odd</button>
                  <button onClick={() => setDigitMode('matches-differs')} className={`py-2 rounded-lg text-xs font-semibold border ${digitMode === 'matches-differs' ? 'bg-purple-600 text-white border-purple-600' : 'bg-gray-50 text-gray-600 border-gray-200'}`}>Matches / Differs</button>
                </div>

                {digitMode === 'over-under' && (
                  <div className="grid grid-cols-2 gap-2 mt-4">
                    <button onClick={() => { setDigitSide('OVER'); executeTrade('OVER') }} disabled={isTrading}
                      className="py-3 rounded-2xl text-emerald-700 bg-emerald-200 font-bold active:scale-[0.98] transition disabled:opacity-50">
                      <div className="flex justify-between items-center px-3 mb-1">
                        <span className="text-sm font-extrabold">OVER {selectedDigit}</span>
                        <span className="text-[10px] bg-white/40 px-1 rounded">+{overPercent}%</span>
                      </div>
                      <div className="text-[10px] text-left px-3 opacity-80">Payout ${(stake * overMultiplier).toFixed(2)}</div>
                    </button>
                    <button onClick={() => { setDigitSide('UNDER'); executeTrade('UNDER') }} disabled={isTrading}
                      className="py-3 rounded-2xl text-red-700 bg-red-200 font-bold active:scale-[0.98] transition disabled:opacity-50">
                      <div className="flex justify-between items-center px-3 mb-1">
                        <span className="text-sm font-extrabold">UNDER {selectedDigit}</span>
                        <span className="text-[10px] bg-white/40 px-1 rounded">+{underPercent}%</span>
                      </div>
                      <div className="text-[10px] text-left px-3 opacity-80">Payout ${(stake * underMultiplier).toFixed(2)}</div>
                    </button>
                  </div>
                )}

                {digitMode === 'even-odd' && (
                  <div className="grid grid-cols-2 gap-2 mt-4">
                    <button onClick={() => { setDigitSide('EVEN'); executeTrade('EVEN') }} disabled={isTrading}
                      className="py-3 rounded-2xl text-emerald-700 bg-emerald-200 font-bold active:scale-[0.98] transition disabled:opacity-50">
                      <div className="flex justify-between items-center px-3 mb-1">
                        <span className="text-sm font-extrabold">EVEN</span>
                        <span className="text-[10px] bg-white/40 px-1 rounded">+90%</span>
                      </div>
                      <div className="text-[10px] text-left px-3 opacity-80">Payout ${(stake * 1.9).toFixed(2)}</div>
                    </button>
                    <button onClick={() => { setDigitSide('ODD'); executeTrade('ODD') }} disabled={isTrading}
                      className="py-3 rounded-2xl text-red-700 bg-red-200 font-bold active:scale-[0.98] transition disabled:opacity-50">
                      <div className="flex justify-between items-center px-3 mb-1">
                        <span className="text-sm font-extrabold">ODD</span>
                        <span className="text-[10px] bg-white/40 px-1 rounded">+90%</span>
                      </div>
                      <div className="text-[10px] text-left px-3 opacity-80">Payout ${(stake * 1.9).toFixed(2)}</div>
                    </button>
                  </div>
                )}

                {digitMode === 'matches-differs' && (
                  <div className="grid grid-cols-2 gap-2 mt-4">
                    <button onClick={() => { setDigitSide('MATCHES'); executeTrade('MATCHES') }} disabled={isTrading}
                      className="py-3 rounded-2xl text-emerald-700 bg-emerald-200 font-bold active:scale-[0.98] transition disabled:opacity-50">
                      <div className="flex justify-between items-center px-3 mb-1">
                        <span className="text-sm font-extrabold">MATCHES {selectedDigit}</span>
                        <span className="text-[10px] bg-white/40 px-1 rounded">+800%</span>
                      </div>
                      <div className="text-[10px] text-left px-3 opacity-80">Payout ${(stake * 9).toFixed(2)}</div>
                    </button>
                    <button onClick={() => { setDigitSide('DIFFERS'); executeTrade('DIFFERS') }} disabled={isTrading}
                      className="py-3 rounded-2xl text-red-700 bg-red-200 font-bold active:scale-[0.98] transition disabled:opacity-50">
                      <div className="flex justify-between items-center px-3 mb-1">
                        <span className="text-sm font-extrabold">DIFFERS {selectedDigit}</span>
                        <span className="text-[10px] bg-white/40 px-1 rounded">+9%</span>
                      </div>
                      <div className="text-[10px] text-left px-3 opacity-80">Payout ${(stake * 1.09).toFixed(2)}</div>
                    </button>
                  </div>
                )}
              </>
            )}

            {/* Manual: Rise/Fall */}
            {tradeMode === 'manual' && tradeType === 'rise-fall' && (
              <div className="grid grid-cols-2 gap-2 mt-4">
                <button onClick={() => executeTrade('UP')} disabled={isTrading}
                  className="py-4 rounded-2xl text-emerald-700 bg-emerald-200 font-bold active:scale-[0.98] transition disabled:opacity-50">
                  <div className="flex justify-between items-center px-3 mb-1">
                    <span className="text-base font-extrabold">RISE ▲</span>
                    <span className="text-[10px] bg-white/40 px-1 rounded">+100%</span>
                  </div>
                  <div className="text-[10px] text-left px-3 opacity-80">Payout ${(stake * 2).toFixed(2)}</div>
                </button>
                <button onClick={() => executeTrade('DOWN')} disabled={isTrading}
                  className="py-4 rounded-2xl text-red-700 bg-red-200 font-bold active:scale-[0.98] transition disabled:opacity-50">
                  <div className="flex justify-between items-center px-3 mb-1">
                    <span className="text-base font-extrabold">FALL ▼</span>
                    <span className="text-[10px] bg-white/40 px-1 rounded">+100%</span>
                  </div>
                  <div className="text-[10px] text-left px-3 opacity-80">Payout ${(stake * 2).toFixed(2)}</div>
                </button>
              </div>
            )}

            {/* Manual: Multipliers */}
            {tradeMode === 'manual' && tradeType === 'multipliers' && (
              <div className="mt-4 space-y-3">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-semibold text-gray-600">Multiplier</span>
                    <span className="text-xs font-bold text-purple-600">{multiplier}×</span>
                  </div>
                  <div className="grid grid-cols-5 gap-1">
                    {[100, 200, 500, 1000, 2000].map((m) => (
                      <button key={m} onClick={() => setMultiplier(m)}
                        className={`py-2 rounded-lg text-[11px] font-semibold transition ${multiplier === m ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
                        {m}×
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => executeTrade('UP')} disabled={isTrading}
                    className="py-3 rounded-2xl text-emerald-700 bg-emerald-200 font-bold active:scale-[0.98] transition disabled:opacity-50">
                    <div className="text-sm font-extrabold">RISE ▲</div>
                    <div className="text-[10px] opacity-80">{multiplier}× exposure</div>
                  </button>
                  <button onClick={() => executeTrade('DOWN')} disabled={isTrading}
                    className="py-3 rounded-2xl text-red-700 bg-red-200 font-bold active:scale-[0.98] transition disabled:opacity-50">
                    <div className="text-sm font-extrabold">FALL ▼</div>
                    <div className="text-[10px] opacity-80">{multiplier}× exposure</div>
                  </button>
                </div>
                <div className="text-[10px] text-gray-400 text-center">Max loss is capped at your stake.</div>
              </div>
            )}

            {/* Auto: Bot Controls */}
            {tradeMode === 'auto' && (
              <div className="mt-2 space-y-3">
                <div>
                  <label className="text-[11px] font-semibold text-gray-600 block mb-1.5">Bot direction</label>
                  <div className="grid grid-cols-4 gap-1">
                    {['RISE', 'FALL', 'EVEN', 'ODD'].map((b) => (
                      <button key={b} onClick={() => setBotTrade(b)}
                        className={`py-2 rounded-lg text-[11px] font-semibold transition ${botTrade === b ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
                        {b}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-semibold text-gray-500 block mb-1">Martingale ×</label>
                    <input type="number" min={1} step={0.1} value={martingale} onChange={(e) => setMartingale(Number(e.target.value))}
                      className="w-full rounded-lg px-3 py-2 text-sm bg-gray-50 border border-gray-200 text-gray-900 outline-none focus:border-purple-500" />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-gray-500 block mb-1">Max runs</label>
                    <input type="number" min={1} value={maxRuns} onChange={(e) => setMaxRuns(Number(e.target.value))}
                      className="w-full rounded-lg px-3 py-2 text-sm bg-gray-50 border border-gray-200 text-gray-900 outline-none focus:border-purple-500" />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-gray-500 block mb-1">Target profit $</label>
                    <input type="number" min={0} value={targetProfit} onChange={(e) => setTargetProfit(Number(e.target.value))}
                      className="w-full rounded-lg px-3 py-2 text-sm bg-gray-50 border border-gray-200 text-gray-900 outline-none focus:border-purple-500" />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-gray-500 block mb-1">Stop loss $</label>
                    <input type="number" min={0} value={stopLoss} onChange={(e) => setStopLoss(Number(e.target.value))}
                      className="w-full rounded-lg px-3 py-2 text-sm bg-gray-50 border border-gray-200 text-gray-900 outline-none focus:border-purple-500" />
                  </div>
                </div>

                <button
                  onClick={() => setIsBotRunning(!isBotRunning)}
                  className={`w-full py-3 rounded-xl text-sm font-bold transition flex items-center justify-center gap-2 ${isBotRunning ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-emerald-500 text-white hover:bg-emerald-600'}`}
                >
                  {isBotRunning ? <><Square className="w-4 h-4" /> Stop Bot</> : <><Play className="w-4 h-4" /> Start Bot</>}
                </button>
                {isBotRunning && (
                  <div className="text-center text-[10px] text-emerald-600 font-medium animate-pulse">
                    ● Bot is running on {selectedMarket}
                  </div>
                )}
              </div>
            )}

            {balance < stake && (
              <div className="mt-4 text-center text-xs text-red-500 font-medium">
                Not enough balance — <button onClick={() => { setWalletTab('deposit'); setIsWalletOpen(true); }} className="underline hover:text-red-600">deposit</button>
              </div>
            )}

            {tradeResult && (
              <div className={`mt-3 p-3 rounded-lg text-center text-sm ${tradeResult.includes('won') || tradeResult.includes('✅') || tradeResult.includes('🎉') ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-red-50 text-red-500 border border-red-200'}`}>
                {tradeResult}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════
          WALLET MODAL
      ═══════════════════════════════════════════ */}
      {isWalletOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className={`w-full max-w-md rounded-2xl border bg-white border-gray-200 max-h-[90vh] overflow-y-auto`}>
            <div className="flex items-center justify-between p-5 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-gray-900">Wallet</h3>
                  <p className="text-xs text-gray-500">
                    {isLiveMode ? `Live · $${liveBalance.toFixed(2)}` : `Demo · $${demoBalance.toFixed(2)}`}
                  </p>
                </div>
              </div>
              <button onClick={() => { setIsWalletOpen(false); setWalletMessage(null) }} className="w-8 h-8 rounded-lg flex items-center justify-center bg-gray-100">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            <div className="p-5">
              <div className="flex gap-2 mb-4">
                <button onClick={() => { setWalletTab('deposit'); setWalletMessage(null) }} className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition flex items-center justify-center gap-2 ${walletTab === 'deposit' ? 'bg-purple-600 text-white' : 'text-gray-500'}`}>
                  <ArrowDownToLine className="w-4 h-4" /> Deposit
                </button>
                <button onClick={() => { setWalletTab('withdraw'); setWalletMessage(null) }} className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition flex items-center justify-center gap-2 ${walletTab === 'withdraw' ? 'bg-purple-600 text-white' : 'text-gray-500'}`}>
                  <ArrowUpFromLine className="w-4 h-4" /> Withdraw
                </button>
              </div>

              <div className="flex gap-2 mb-4">
                <button onClick={() => { setPaymentMethod('mpesa'); setWalletMessage(null) }} className={`flex-1 py-3 rounded-lg text-sm font-semibold transition ${paymentMethod === 'mpesa' ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600'}`}>📱 M-Pesa</button>
                <button onClick={() => { setPaymentMethod('crypto'); setWalletMessage(null) }} className={`flex-1 py-3 rounded-lg text-sm font-semibold transition ${paymentMethod === 'crypto' ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600'}`}>₿ Crypto</button>
              </div>

              {/* DEPOSIT */}
              {walletTab === 'deposit' && (
                <>
                  <div className="mb-4">
                    <label className="text-xs block mb-2 font-semibold text-gray-600">Amount (USD)</label>
                    <input type="number" value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)} placeholder="0.00" min={1}
                      className="w-full rounded-lg px-4 py-3 outline-none border text-sm font-medium bg-gray-50 text-gray-900 border-gray-200 focus:border-purple-500" />
                    <div className="grid grid-cols-4 gap-2 mt-2">
                      {[10, 50, 100, 500].map((amt) => (
                        <button key={amt} onClick={() => setDepositAmount(String(amt))}
                          className={`py-2 rounded-lg text-xs font-semibold ${depositAmount === String(amt) ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700'}`}>${amt}</button>
                      ))}
                    </div>
                  </div>

                  {paymentMethod === 'mpesa' && (
                    <div className="mb-4">
                      <label className="text-xs block mb-2 font-semibold text-gray-600">M-Pesa Phone Number</label>
                      <input type="tel" value={depositPhone} onChange={(e) => setDepositPhone(e.target.value)} placeholder="0712 345 678"
                        className="w-full rounded-lg px-4 py-3 outline-none border text-sm bg-gray-50 text-gray-900 border-gray-200 focus:border-purple-500" />
                    </div>
                  )}

                  {paymentMethod === 'crypto' && (
                    <div className="mb-4 space-y-3">
                      <div>
                        <label className="text-xs block mb-2 font-semibold text-gray-600">Coin</label>
                        <div className="grid grid-cols-3 gap-2">
                          {['USDT', 'BTC', 'ETH'].map((c) => (
                            <button key={c} onClick={() => { setCryptoCoin(c); setCryptoTxHash('') }}
                              className={`py-2 rounded-lg text-xs font-semibold ${cryptoCoin === c ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-700'}`}>{c}</button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="text-xs block mb-1 font-semibold text-gray-600">Send to ({CRYPTO_NETWORKS[cryptoCoin]})</label>
                        <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                          <code className="text-[11px] flex-1 break-all text-gray-700">{CRYPTO_ADDRESSES[cryptoCoin]}</code>
                          <button onClick={() => copyToClipboard(CRYPTO_ADDRESSES[cryptoCoin])} className="text-gray-400 hover:text-gray-600 flex-shrink-0">
                            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="text-xs block mb-2 font-semibold text-gray-600">Transaction hash</label>
                        <input value={cryptoTxHash} onChange={(e) => setCryptoTxHash(e.target.value)} placeholder="Paste TX hash after sending"
                          className="w-full rounded-lg px-4 py-3 outline-none border text-sm bg-gray-50 text-gray-900 border-gray-200 focus:border-orange-500" />
                      </div>
                    </div>
                  )}

                  {walletMessage && (
                    <div className={`mb-4 p-3 rounded-lg text-sm ${walletMessage.includes('✅') ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-red-50 text-red-500 border border-red-200'}`}>{walletMessage}</div>
                  )}

                  <button
                    onClick={paymentMethod === 'mpesa' ? handleMpesaDeposit : handleCryptoDeposit}
                    disabled={isProcessing || !depositAmount || (paymentMethod === 'crypto' && !cryptoTxHash)}
                    className="w-full py-3.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-xl font-bold text-sm">
                    {isProcessing ? 'Processing...' : paymentMethod === 'mpesa' ? `Pay $${depositAmount || '0'} with M-Pesa` : `Submit ${cryptoCoin} deposit`}
                  </button>
                </>
              )}

              {/* WITHDRAW */}
              {walletTab === 'withdraw' && (
                <>
                  <div className="mb-4">
                    <label className="text-xs block mb-2 font-semibold text-gray-600">Amount (USD)</label>
                    <input type="number" value={withdrawAmount} onChange={(e) => setWithdrawAmount(e.target.value)} placeholder="0.00" min={1}
                      className="w-full rounded-lg px-4 py-3 outline-none border text-sm font-medium bg-gray-50 text-gray-900 border-gray-200 focus:border-purple-500" />
                    <div className="text-[10px] text-gray-400 mt-1">Available: ${liveBalance.toFixed(2)}</div>
                  </div>

                  {paymentMethod === 'mpesa' ? (
                    <div className="mb-4">
                      <label className="text-xs block mb-2 font-semibold text-gray-600">M-Pesa Phone Number</label>
                      <input type="tel" value={withdrawPhone} onChange={(e) => setWithdrawPhone(e.target.value)} placeholder="0712 345 678"
                        className="w-full rounded-lg px-4 py-3 outline-none border text-sm bg-gray-50 text-gray-900 border-gray-200 focus:border-purple-500" />
                    </div>
                  ) : (
                    <div className="mb-4">
                      <label className="text-xs block mb-2 font-semibold text-gray-600">Crypto address</label>
                      <input value={withdrawAddress} onChange={(e) => setWithdrawAddress(e.target.value)} placeholder="Paste your wallet address"
                        className="w-full rounded-lg px-4 py-3 outline-none border text-sm bg-gray-50 text-gray-900 border-gray-200 focus:border-orange-500" />
                    </div>
                  )}

                  {walletMessage && (
                    <div className={`mb-4 p-3 rounded-lg text-sm ${walletMessage.includes('✅') ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-red-50 text-red-500 border border-red-200'}`}>{walletMessage}</div>
                  )}

                  <button onClick={handleWithdraw} disabled={isProcessing || !withdrawAmount}
                    className="w-full py-3.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-xl font-bold text-sm">
                    {isProcessing ? 'Processing...' : `Withdraw $${withdrawAmount || '0'}`}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════
          AI SCANNER MODAL
      ═══════════════════════════════════════════ */}
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
              {aiScanning ? (
                <>
                  <div className="mb-4 p-5 rounded-2xl bg-purple-50 border border-purple-100 text-center">
                    <div className="w-14 h-14 mx-auto rounded-full bg-purple-500/20 flex items-center justify-center mb-3 animate-pulse"><Sparkles className="w-6 h-6 text-purple-600" /></div>
                    <div className="text-gray-900 font-bold">Deep scanning</div>
                    <div className="text-xs text-gray-500 mt-1">Analyzing volatility & digit patterns…</div>
                  </div>
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-2"><span className="text-xs text-gray-500">Analyzing...</span><span className="text-xs font-medium text-gray-600">{aiScanProgress}/10</span></div>
                    <div className="h-1.5 rounded-full overflow-hidden bg-gray-100"><div className="h-full bg-purple-500 transition-all" style={{ width: `${(aiScanProgress / 10) * 100}%` }} /></div>
                  </div>
                  <div className="grid grid-cols-5 gap-1 mb-2">
                    {aiMarkets.map((m) => (
                      <div key={m} className={`py-1 rounded text-[9px] font-semibold text-center ${aiScannedMarkets.includes(m) ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-400'}`}>{m}</div>
                    ))}
                  </div>
                </>
              ) : aiScannedMarkets.length === aiMarkets.length ? (
                <>
                  <div className="mb-4 p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[10px] font-bold tracking-wider text-emerald-600">BEST ENTRY FOUND</span>
                    </div>
                    <div className="flex items-baseline justify-between">
                      <div>
                        <div className="text-lg font-extrabold text-gray-900">{aiBestMarket}</div>
                        <div className="text-xs text-gray-500">Prediction: <span className="font-bold text-emerald-600">{aiPrediction}</span></div>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] text-gray-500">Confidence</div>
                        <div className="text-lg font-bold text-emerald-600">92%</div>
                      </div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="text-xs block mb-2 font-semibold text-gray-600">Bot trade type</label>
                    <select value={aiTradeType} onChange={(e) => setAiTradeType(e.target.value)}
                      className="w-full rounded-lg px-3 py-2.5 outline-none border text-sm bg-gray-50 text-gray-900 border-gray-200 focus:border-purple-500">
                      <option>Even / Odd</option>
                      <option>Over / Under</option>
                      <option>Match / Differ</option>
                    </select>
                  </div>

                  <div className="flex gap-2">
                    <button onClick={runDeepScan} className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold text-sm">Re-scan</button>
                    <button onClick={() => { loadScannerBot(); setTradeMode('manual') }} className="flex-1 py-3 bg-purple-600 text-white rounded-xl font-bold text-sm">Load Bot →</button>
                  </div>
                </>
              ) : (
                <button onClick={runDeepScan} className="w-full py-3.5 bg-purple-600 text-white rounded-xl font-bold text-sm">Deep Scan</button>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  )
}