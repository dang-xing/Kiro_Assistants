import { useState, useEffect, useRef } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event'
import Home from './components/Home'
import AccountManager from './components/AccountManager/index'
import Settings from './components/Settings'
import KiroConfig from './components/KiroConfig/index'
import About from './components/About'
import Login from './components/Login'
import WebOAuthLogin from './components/WebOAuthLogin'
import AuthCallback from './components/AuthCallback'
import UpdateChecker from './components/UpdateChecker'
import TopNav from './components/TopNav'

import { useTheme } from './contexts/ThemeContext'

// 默认自动刷新间隔：50分钟
const DEFAULT_REFRESH_INTERVAL = 50 * 60 * 1000

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeMenu, setActiveMenu] = useState('home')
  const { colors } = useTheme()
  const refreshTimerRef = useRef(null)

  // 启动时只刷新 token（不获取 usage，快速启动）
  const refreshExpiredTokensOnly = async () => {
    try {
      const settings = await invoke('get_app_settings').catch(() => ({}))
      if (!settings.autoRefresh) return
      
      const accounts = await invoke('get_accounts')
      if (!accounts || accounts.length === 0) return
      
      const now = new Date()
      const refreshThreshold = 5 * 60 * 1000 // 提前 5 分钟
      
      const expiredAccounts = accounts.filter(acc => {
        if (acc.status === '已封禁' || acc.status === '封禁') return false
        if (!acc.expiresAt) return false
        const expiresAt = new Date(acc.expiresAt.replace(/\//g, '-'))
        return (expiresAt.getTime() - now.getTime()) < refreshThreshold
      })
      
      if (expiredAccounts.length === 0) {
        console.log('[AutoRefresh] 没有需要刷新的 token')
        return
      }
      
      console.log(`[AutoRefresh] 刷新 ${expiredAccounts.length} 个过期 token...`)
      
      await Promise.allSettled(
        expiredAccounts.map(async (account) => {
          try {
            await invoke('refresh_account_token', { id: account.id })
            console.log(`[AutoRefresh] ${account.email} token 刷新成功`)
          } catch (e) {
            console.warn(`[AutoRefresh] ${account.email} token 刷新失败:`, e)
          }
        })
      )
      
      console.log('[AutoRefresh] token 刷新完成')
    } catch (e) {
      console.error('[AutoRefresh] 刷新失败:', e)
    }
  }

  // 定时刷新：只刷新 token
  const checkAndRefreshExpiringTokens = async () => {
    try {
      const settings = await invoke('get_app_settings').catch(() => ({}))
      if (!settings.autoRefresh) return
      
      const accounts = await invoke('get_accounts')
      if (!accounts || accounts.length === 0) return
      
      const now = new Date()
      const refreshThreshold = 5 * 60 * 1000
      
      const expiredAccounts = accounts.filter(acc => {
        if (acc.status === '已封禁' || acc.status === '封禁') return false
        if (!acc.expiresAt) return false
        const expiresAt = new Date(acc.expiresAt.replace(/\//g, '-'))
        return (expiresAt.getTime() - now.getTime()) < refreshThreshold
      })
      
      if (expiredAccounts.length === 0) {
        console.log('[AutoRefresh] 没有需要刷新的 token')
        return
      }
      
      console.log(`[AutoRefresh] 刷新 ${expiredAccounts.length} 个 token...`)
      
      await Promise.allSettled(
        expiredAccounts.map(async (account) => {
          try {
            await invoke('refresh_account_token', { id: account.id })
            console.log(`[AutoRefresh] ${account.email} token 刷新成功`)
          } catch (e) {
            console.warn(`[AutoRefresh] ${account.email} token 刷新失败:`, e)
          }
        })
      )
      
      console.log('[AutoRefresh] token 刷新完成')
    } catch (e) {
      console.error('[AutoRefresh] 刷新失败:', e)
    }
  }

  // 启动自动刷新定时器
  const startAutoRefreshTimer = async () => {
    if (refreshTimerRef.current) {
      clearInterval(refreshTimerRef.current)
    }
    
    refreshExpiredTokensOnly()
    
    const settings = await invoke('get_app_settings').catch(() => ({}))
    const intervalMs = (settings.autoRefreshInterval || 50) * 60 * 1000
    
    console.log(`[AutoRefresh] 定时器间隔: ${settings.autoRefreshInterval || 50} 分钟`)
    refreshTimerRef.current = setInterval(checkAndRefreshExpiringTokens, intervalMs)
  }

  useEffect(() => {
    checkAuth()
    
    const url = new URL(window.location.href)
    if (url.pathname === '/callback' && (url.searchParams.has('code') || url.searchParams.has('state'))) {
      setActiveMenu('callback')
      return
    }
    
    const unlisten = listen('login-success', (event) => {
      console.log('Login success in App:', event.payload)
      checkAuth()
      setActiveMenu('token')
    })
    
    const unlistenSettings = listen('settings-changed', () => {
      console.log('[AutoRefresh] 设置已变化，重启定时器')
      startAutoRefreshTimer()
    })
    
    startAutoRefreshTimer()
    
    return () => { 
      unlisten.then(fn => fn())
      unlistenSettings.then(fn => fn())
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current)
      }
    }
  }, [])

  const checkAuth = async () => {
    try {
      const currentUser = await invoke('get_current_user')
      setUser(currentUser)
    } catch (e) {
      console.error('Auth check failed:', e)
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = (loggedInUser) => {
    if (loggedInUser) {
      setUser(loggedInUser)
    }
    checkAuth()
  }

  const handleLogout = async () => {
    await invoke('logout')
    setUser(null)
  }

  const renderContent = () => {
    switch (activeMenu) {
      case 'home': return <Home onNavigate={setActiveMenu} />
      case 'token': return <AccountManager />
      case 'kiro-config': return <KiroConfig />
      case 'login': return <Login onLogin={(user) => { handleLogin(user); setActiveMenu('token'); }} />
      case 'web-oauth': return <WebOAuthLogin onLogin={(user) => { handleLogin(user); setActiveMenu('token'); }} />
      case 'callback': return <AuthCallback />
      case 'settings': return <Settings />
      case 'about': return <About />
      default: return <Home />
    }
  }

  if (loading) {
    return (
      <div className="h-screen bg-[#0d0d0d] flex items-center justify-center">
        <div className="text-white">加载中...</div>
      </div>
    )
  }

  return (
    <div className={`flex flex-col h-screen ${colors.main}`}>
      <TopNav 
        activeMenu={activeMenu} 
        onMenuChange={setActiveMenu}
      />
      <main className="flex-1 overflow-hidden">
        {renderContent()}
      </main>
      
      <UpdateChecker />
    </div>
  )
}

export default App
