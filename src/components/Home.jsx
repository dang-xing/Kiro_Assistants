import { useState, useEffect } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { RefreshCw, Users, Zap, Shield, TrendingUp, Sparkles, Plus, ChevronRight, Download, ArrowRightLeft } from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext'
import { useDialog } from '../contexts/DialogContext'
import { useI18n } from '../i18n.jsx'
import { getQuota, getUsed } from '../utils/accountStats'

// 骨架屏组件
function Skeleton({ className }) {
  return <div className={`skeleton ${className}`} />
}

// 骨架屏加载状态
function LoadingSkeleton({ isDark, colors }) {
  return (
    <div className={`h-full overflow-auto ${colors.main}`}>
      <div className="max-w-6xl mx-auto p-6">
        {/* Header 骨架 */}
        <div className="flex items-center justify-between mb-6">
          <Skeleton className="w-48 h-8 rounded-lg" />
          <div className="flex gap-3">
            <Skeleton className="w-28 h-10 rounded-xl" />
            <Skeleton className="w-28 h-10 rounded-xl" />
          </div>
        </div>

        {/* 统计卡片骨架 */}
        <div className="grid grid-cols-5 gap-4 mb-6">
          {[...Array(5)].map((_, i) => (
            <div key={i} className={`${colors.card} rounded-2xl p-4 border ${colors.cardBorder}`}>
              <Skeleton className="w-8 h-8 rounded-lg mb-3" />
              <Skeleton className="w-16 h-8 rounded mb-2" />
              <Skeleton className="w-24 h-4 rounded" />
            </div>
          ))}
        </div>

        {/* 主内容骨架 */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          <div className={`${colors.card} rounded-2xl border ${colors.cardBorder} p-5`}>
            <Skeleton className="w-32 h-5 rounded mb-4" />
            <Skeleton className="w-full h-20 rounded-xl" />
          </div>
          <div className={`${colors.card} rounded-2xl border ${colors.cardBorder} p-5`}>
            <Skeleton className="w-32 h-5 rounded mb-4" />
            <Skeleton className="w-full h-20 rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  )
}

function Home({ onNavigate }) {
  const { theme, colors } = useTheme()
  const { showError, showConfirm, showSuccess } = useDialog()
  const { t } = useI18n()
  const [tokens, setTokens] = useState([])
  const [localToken, setLocalToken] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [switchingId, setSwitchingId] = useState(null)

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [tokensData, localData] = await Promise.all([
        invoke('get_accounts'),
        invoke('get_kiro_local_token').catch(() => null)
      ])
      setTokens(tokensData)
      setLocalToken(localData)
    } catch (e) { 
      console.error('Failed to load data:', e)
      showError(t('home.loadFailed'), t('home.loadDataFailed') + ': ' + e)
    }
    setLoading(false)
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadData()
    setTimeout(() => setRefreshing(false), 500)
  }

  // 切换账号
  const handleSwitchAccount = async (account) => {
    if (!account.accessToken || !account.refreshToken) {
      showError(t('switch.failed'), t('switch.missingAuth'))
      return
    }
    
    const confirmed = await showConfirm(t('switch.title'), `${t('switch.confirmSwitch')} ${account.email}？`)
    if (!confirmed) return
    
    setSwitchingId(account.id)
    
    try {
      const appSettings = await invoke('get_app_settings').catch(() => ({}))
      const autoChangeMachineId = appSettings.autoChangeMachineId ?? false
      const bindMachineIdToAccount = appSettings.bindMachineIdToAccount ?? false
      const useBoundMachineId = appSettings.useBoundMachineId ?? true
      
      if (autoChangeMachineId && bindMachineIdToAccount) {
        try {
          let boundMachineId = await invoke('get_bound_machine_id', { accountId: account.id }).catch(() => null)
          if (!boundMachineId) {
            boundMachineId = await invoke('generate_machine_guid')
            await invoke('bind_machine_id_to_account', { accountId: account.id, machineId: boundMachineId })
          }
          if (useBoundMachineId) {
            await invoke('set_custom_machine_guid', { newGuid: boundMachineId })
          }
        } catch (e) {
          console.error('[MachineId] Failed to handle bound machine ID:', e)
        }
      }
      
      const isIdC = account.provider === 'BuilderId' || account.provider === 'Enterprise' || account.clientIdHash
      const authMethod = isIdC ? 'IdC' : 'social'
      const shouldResetMachineId = autoChangeMachineId && !(bindMachineIdToAccount && useBoundMachineId)
      
      const params = {
        accessToken: account.accessToken,
        refreshToken: account.refreshToken,
        provider: account.provider || 'Google',
        authMethod,
        resetMachineId: shouldResetMachineId,
        autoRestart: false
      }
      
      if (isIdC) {
        params.clientIdHash = account.clientIdHash || null
        params.region = account.region || 'us-east-1'
        params.clientId = account.clientId || null
        params.clientSecret = account.clientSecret || null
      } else {
        params.profileArn = account.profileArn || 'arn:aws:codewhisperer:us-east-1:699475941385:profile/EHGA3GRVQMUK'
      }
      
      await invoke('switch_kiro_account', { params })
      
      // 刷新数据
      await loadData()
      
      showSuccess(t('switch.success'), account.email)
    } catch (e) {
      showError(t('switch.failed'), String(e))
    } finally {
      setSwitchingId(null)
    }
  }

  const isDark = theme === 'dark' || theme === 'purple'
  
  // 找到当前登录账号
  const currentAccount = localToken 
    ? tokens.find(t => 
        (localToken.refreshToken && t.refreshToken === localToken.refreshToken) ||
        (localToken.accessToken && t.accessToken === localToken.accessToken) ||
        (localToken.provider && t.provider === localToken.provider)
      )
    : null

  // 找到最佳推荐账号（排除当前账号，配额剩余最多的前4个）
  const getBestAccounts = () => {
    const validAccounts = tokens.filter(acc => {
      // 排除当前账号
      if (currentAccount && acc.id === currentAccount.id) return false
      if (acc.status === '已封禁' || acc.status === '封禁') return false
      const quota = getQuota(acc)
      const used = getUsed(acc)
      return quota > 0 && (quota - used) > 0
    })
    
    // 按剩余配额排序，取前4个
    return validAccounts
      .map(acc => ({
        ...acc,
        quota: getQuota(acc),
        used: getUsed(acc),
        remaining: getQuota(acc) - getUsed(acc),
      }))
      .sort((a, b) => b.remaining - a.remaining)
      .slice(0, 4)
  }

  const bestAccounts = getBestAccounts()

  if (loading) {
    return <LoadingSkeleton isDark={isDark} colors={colors} />
  }

  // 获取用户名显示
  const getUserName = () => {
    if (currentAccount?.email) {
      return currentAccount.email.split('@')[0]
    }
    if (localToken?.provider) {
      return localToken.provider
    }
    return 'User'
  }

  return (
    <div className={`h-full overflow-auto ${colors.main}`}>
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className={`text-2xl font-bold ${colors.text}`}>
            {t('home.greeting')}, {getUserName()} 👋
          </h1>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => onNavigate?.('login')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all ${
                isDark 
                  ? 'border-white/10 text-gray-300 hover:bg-white/5' 
                  : 'border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Plus size={18} />
              <span>{t('home.addAccount')}</span>
            </button>
            <button 
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl transition-all disabled:opacity-50"
            >
              <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
              <span>{t('home.refreshQuota')}</span>
            </button>
          </div>
        </div>

        {/* 额度统计 - 当前账号 */}
        {currentAccount ? (
          <div className={`${colors.card} rounded-2xl border ${colors.cardBorder} p-5 mb-6`}>
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp size={20} className="text-blue-500" />
              <h2 className={`font-semibold ${colors.text}`}>{t('home.quotaStats')}</h2>
            </div>
            
            {(() => {
              const quota = getQuota(currentAccount)
              const used = getUsed(currentAccount)
              const remaining = quota - used
              const usagePercent = quota > 0 ? ((used / quota) * 100).toFixed(1) : 0
              
              return (
                <>
                  <div className="grid grid-cols-4 gap-4 mb-4">
                    <div className={`${isDark ? 'bg-white/5' : 'bg-gray-50'} rounded-xl p-4`}>
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp size={16} className="text-green-500" />
                        <span className={`text-sm ${colors.textMuted}`}>{t('home.totalQuota')}</span>
                      </div>
                      <div className={`text-2xl font-bold ${colors.text}`}>{quota.toLocaleString()}</div>
                    </div>
                    
                    <div className={`${isDark ? 'bg-white/5' : 'bg-gray-50'} rounded-xl p-4`}>
                      <div className="flex items-center gap-2 mb-2">
                        <Zap size={16} className="text-red-500" />
                        <span className={`text-sm ${colors.textMuted}`}>{t('home.usedQuota')}</span>
                      </div>
                      <div className={`text-2xl font-bold ${colors.text}`}>{used.toLocaleString()}</div>
                    </div>
                    
                    <div className={`${isDark ? 'bg-white/5' : 'bg-gray-50'} rounded-xl p-4`}>
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles size={16} className="text-green-500" />
                        <span className={`text-sm ${colors.textMuted}`}>{t('home.remainingQuota')}</span>
                      </div>
                      <div className={`text-2xl font-bold text-green-500`}>{remaining.toLocaleString()}</div>
                    </div>
                    
                    <div className={`${isDark ? 'bg-white/5' : 'bg-gray-50'} rounded-xl p-4`}>
                      <div className="flex items-center gap-2 mb-2">
                        <Shield size={16} className="text-blue-500" />
                        <span className={`text-sm ${colors.textMuted}`}>{t('home.usageRate')}</span>
                      </div>
                      <div className={`text-2xl font-bold ${colors.text}`}>{usagePercent}%</div>
                    </div>
                  </div>
                  
                  {/* 总体使用进度 */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-sm ${colors.textMuted}`}>{t('home.overallProgress')}</span>
                      <span className={`text-sm ${colors.text}`}>{used.toLocaleString()} / {quota.toLocaleString()}</span>
                    </div>
                    <div className={`h-2.5 ${isDark ? 'bg-white/10' : 'bg-gray-200'} rounded-full overflow-hidden`}>
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          usagePercent > 80 ? 'bg-red-500' : 
                          usagePercent > 50 ? 'bg-yellow-500' : 
                          'bg-green-500'
                        }`}
                        style={{ width: `${usagePercent}%` }}
                      />
                    </div>
                  </div>
                </>
              )
            })()}
          </div>
        ) : (
          <div className={`${colors.card} rounded-2xl border ${colors.cardBorder} p-5 mb-6`}>
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp size={20} className="text-blue-500" />
              <h2 className={`font-semibold ${colors.text}`}>{t('home.quotaStats')}</h2>
            </div>
            <div className="text-center py-6">
              <div className={colors.textMuted}>{t('home.notLoggedIn')}</div>
            </div>
          </div>
        )}

        {/* 主内容区 */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          {/* 当前账号 */}
          <div className={`${colors.card} rounded-2xl border ${colors.cardBorder} p-5`}>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </div>
              <h2 className={`font-semibold ${colors.text}`}>{t('home.currentAccount')}</h2>
            </div>
            
            {currentAccount ? (
              <div className="space-y-4">
                {(() => {
                  const usageData = currentAccount.usageData
                  const breakdown = usageData?.usageBreakdownList?.[0] || usageData?.usageBreakdown
                  const subInfo = usageData?.subscriptionInfo
                  const userInfo = usageData?.userInfo
                  const quota = getQuota(currentAccount)
                  const used = getUsed(currentAccount)
                  const daysUntilReset = usageData?.daysUntilReset ?? 0
                  const nextDateReset = usageData?.nextDateReset
                  
                  // Token 过期时间计算
                  const expiresAt = currentAccount.expiresAt ? new Date(currentAccount.expiresAt.replace(/\//g, '-')) : null
                  const now = new Date()
                  const tokenMinutes = expiresAt ? Math.max(0, Math.round((expiresAt - now) / 60000)) : 0
                  const tokenStatus = tokenMinutes > 30 ? 'text-green-500' : tokenMinutes > 10 ? 'text-yellow-500' : 'text-red-500'
                  
                  // 基础额度和试用额度
                  const mainUsed = breakdown?.currentUsage ?? 0
                  const mainLimit = breakdown?.usageLimit ?? 0
                  const freeTrial = breakdown?.freeTrialInfo
                  const freeTrialUsed = freeTrial?.currentUsage ?? 0
                  const freeTrialLimit = freeTrial?.usageLimit ?? 0
                  const freeTrialExpires = freeTrial?.expirationDate
                  
                  return (
                    <>
                      {/* 顶部统计 */}
                      <div className="grid grid-cols-4 gap-4">
                        <div>
                          <div className={`text-xs ${colors.textMuted} mb-1`}>{t('home.monthlyUsage')}</div>
                          <div className={`text-lg font-bold ${colors.text}`}>{used} / {quota}</div>
                          <div className={`h-1.5 ${isDark ? 'bg-white/10' : 'bg-gray-200'} rounded-full overflow-hidden mt-1`}>
                            <div 
                              className="h-full bg-green-500 rounded-full"
                              style={{ width: `${quota > 0 ? (used / quota) * 100 : 0}%` }}
                            />
                          </div>
                        </div>
                        <div>
                          <div className={`text-xs ${colors.textMuted} mb-1`}>{t('home.subscriptionRemaining')}</div>
                          <div className={`text-lg font-bold ${colors.text}`}>{daysUntilReset} {t('common.days')}</div>
                        </div>
                        <div>
                          <div className={`text-xs ${colors.textMuted} mb-1`}>Token {t('home.status')}</div>
                          <div className={`text-lg font-bold ${tokenStatus}`}>{tokenMinutes} {t('home.minutes')}</div>
                        </div>
                        <div>
                          <div className={`text-xs ${colors.textMuted} mb-1`}>{t('home.loginMethod')}</div>
                          <div className={`text-lg font-bold ${colors.text}`}>{currentAccount.provider || 'Unknown'}</div>
                        </div>
                      </div>
                      
                      {/* 订阅详情 */}
                      <div className={`${isDark ? 'bg-white/5' : 'bg-gray-50'} rounded-xl p-4`}>
                        <div className={`text-xs font-medium ${colors.textMuted} mb-3`}>{t('home.subscriptionDetails')}</div>
                        <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className={colors.textMuted}>{t('home.subscriptionType')}:</span>
                            <span className={colors.text}>{subInfo?.subscriptionTitle || 'FREE'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className={colors.textMuted}>{t('home.expiresAt')}:</span>
                            <span className={colors.text}>{nextDateReset ? new Date(nextDateReset * 1000).toLocaleDateString() : '-'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className={colors.textMuted}>{t('home.overageCapability')}:</span>
                            <span className={colors.text}>{subInfo?.overageCapability || '-'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className={colors.textMuted}>{t('home.upgradeable')}:</span>
                            <span className={colors.text}>{subInfo?.upgradeCapability || '-'}</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* 额度明细 */}
                      <div className={`${isDark ? 'bg-white/5' : 'bg-gray-50'} rounded-xl p-4`}>
                        <div className={`text-xs font-medium ${colors.textMuted} mb-3`}>{t('home.quotaDetails')}</div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-blue-500" />
                            <span className={colors.textMuted}>{t('home.baseQuota')}:</span>
                            <span className={colors.text}>{mainUsed} / {mainLimit}</span>
                          </div>
                          {freeTrialLimit > 0 && (
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-purple-500" />
                              <span className="text-purple-500">{t('home.trialQuota')}:</span>
                              <span className={colors.text}>{freeTrialUsed} / {freeTrialLimit}</span>
                              {freeTrialExpires && (
                                <span className={`text-xs ${colors.textMuted}`}>({t('home.until')} {new Date(freeTrialExpires * 1000).toLocaleDateString()})</span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* 账户信息 */}
                      <div className={`${isDark ? 'bg-white/5' : 'bg-gray-50'} rounded-xl p-4`}>
                        <div className={`text-xs font-medium ${colors.textMuted} mb-3`}>{t('home.accountInfo')}</div>
                        <div className="space-y-2 text-sm">
                          <div className="flex">
                            <span className={`${colors.textMuted} w-20 shrink-0`}>User ID:</span>
                            <span className={`${colors.text} font-mono text-xs truncate`}>{userInfo?.userId || '-'}</span>
                          </div>
                          <div className="flex">
                            <span className={`${colors.textMuted} w-20 shrink-0`}>IDP:</span>
                            <span className={colors.text}>{currentAccount.provider || '-'}</span>
                          </div>
                          <div className="flex">
                            <span className={`${colors.textMuted} w-20 shrink-0`}>{t('home.resetDate')}:</span>
                            <span className={colors.text}>{nextDateReset ? new Date(nextDateReset * 1000).toLocaleDateString() : '-'}</span>
                          </div>
                        </div>
                      </div>
                    </>
                  )
                })()}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className={`w-16 h-16 ${isDark ? 'bg-white/10' : 'bg-gray-100'} rounded-full flex items-center justify-center mx-auto mb-3`}>
                  <Users size={24} className={colors.textMuted} />
                </div>
                <div className={colors.textMuted}>{t('home.notLoggedIn')}</div>
                <div className={`text-sm ${colors.textMuted} mt-1`}>{t('home.clickToSwitch')}</div>
              </div>
            )}
          </div>

          {/* 最佳账号推荐 */}
          <div className={`${colors.card} rounded-2xl border ${colors.cardBorder} p-5`}>
            <div className="flex items-center gap-2 mb-4">
              <Sparkles size={20} className="text-purple-500" />
              <h2 className={`font-semibold ${colors.text}`}>{t('home.bestRecommend')}</h2>
            </div>
            
            {bestAccounts.length > 0 ? (
              <div className="space-y-4">
                {bestAccounts.map((acc, idx) => {
                  const usagePercent = acc.quota > 0 ? Math.round((acc.used / acc.quota) * 100) : 0
                  const isSwitching = switchingId === acc.id
                  
                  return (
                    <div 
                      key={acc.id || idx}
                      className={`p-4 rounded-xl ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}
                    >
                      {/* 账号名称和切换按钮 */}
                      <div className="flex items-center justify-between mb-3">
                        <div className={`${colors.text} font-medium truncate flex-1`}>{acc.email}</div>
                        <button
                          onClick={() => handleSwitchAccount(acc)}
                          disabled={isSwitching}
                          title={t('home.switch')}
                          className={`p-2 rounded-lg transition-all ${
                            isSwitching
                              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                              : isDark 
                                ? 'bg-white/10 hover:bg-white/20 text-gray-300' 
                                : 'bg-gray-200 hover:bg-gray-300 text-gray-600'
                          }`}
                        >
                          {isSwitching ? (
                            <RefreshCw size={16} className="animate-spin" />
                          ) : (
                            <ArrowRightLeft size={16} />
                          )}
                        </button>
                      </div>
                      
                      {/* 使用量标题和百分比 */}
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-sm ${colors.textMuted}`}>{t('home.usage')}</span>
                        <span className={`text-sm font-medium ${usagePercent <= 50 ? 'text-green-500' : usagePercent <= 80 ? 'text-yellow-500' : 'text-red-500'}`}>
                          {usagePercent}%
                        </span>
                      </div>
                      
                      {/* 进度条 - 显示已使用部分 */}
                      <div className={`h-2 ${isDark ? 'bg-white/10' : 'bg-gray-200'} rounded-full overflow-hidden mb-2`}>
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${
                            usagePercent <= 50 ? 'bg-green-500' : usagePercent <= 80 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${usagePercent}%` }}
                        />
                      </div>
                      
                      {/* 用量详情 */}
                      <div className="flex items-center justify-between text-sm">
                        <span className={colors.text}>{acc.used} / {acc.quota}</span>
                        <span className={colors.textMuted}>{t('home.remaining')} {acc.remaining}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className={colors.textMuted}>{t('home.noAvailableAccounts')}</div>
              </div>
            )}
          </div>
        </div>

        {/* 底部快捷入口 */}
        {/* <div className="grid grid-cols-2 gap-6">
          <button 
            onClick={() => onNavigate?.('token')}
            className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
              isDark 
                ? 'border-white/10 hover:bg-white/5' 
                : 'border-gray-200 hover:bg-gray-50'
            }`}
          >
            <span className="text-blue-500 font-medium">{t('home.viewAllAccounts')}</span>
            <ChevronRight size={20} className="text-blue-500" />
          </button>
          
          <button 
            onClick={() => onNavigate?.('token')}
            className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
              isDark 
                ? 'border-white/10 hover:bg-white/5' 
                : 'border-gray-200 hover:bg-gray-50'
            }`}
          >
            <span className="text-blue-500 font-medium">{t('home.exportAccounts')}</span>
            <Download size={20} className="text-blue-500" />
          </button>
        </div> */}
      </div>
    </div>
  )
}

export default Home
