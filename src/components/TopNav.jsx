import { useState, useEffect } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { getVersion } from '@tauri-apps/api/app'
import { Home, Key, Settings, Info, LogIn, Globe, Sun, Moon, Palette, Settings2, Languages } from 'lucide-react'
import { useTheme, themes } from '../contexts/ThemeContext'
import { useI18n, locales } from '../i18n.jsx'

function useMenuItems() {
  const { t } = useI18n()
  return [
    { id: 'home', label: t('nav.home'), icon: Home },
    { id: 'token', label: t('nav.accounts'), icon: Key },
    // { id: 'kiro-config', label: t('nav.kiroConfig'), icon: Settings2 },
    { id: 'login', label: t('nav.desktopOAuth'), icon: LogIn },
  
    { id: 'settings', label: t('nav.settings'), icon: Settings },
    { id: 'about', label: t('nav.about'), icon: Info },
  ]
}

function TopNav({ activeMenu, onMenuChange }) {
  const [showThemeMenu, setShowThemeMenu] = useState(false)
  const [showLangMenu, setShowLangMenu] = useState(false)
  const [version, setVersion] = useState('')
  const { theme, setTheme, colors } = useTheme()
  const { locale, setLocale, loading: langLoading } = useI18n()
  const menuItems = useMenuItems()
  const isDark = theme === 'dark' || theme === 'purple'

  useEffect(() => {
    getVersion().then(setVersion)
  }, [])

  const themeIcons = { light: Sun, dark: Moon, purple: Palette, green: Palette }
  const ThemeIcon = themeIcons[theme] || Sun

  return (
    <div className={`${isDark ? 'bg-white/5' : 'bg-white'} border-b ${isDark ? 'border-white/10' : 'border-gray-200'} px-6 py-3`} data-tauri-drag-region>
      <div className="flex items-center justify-between">
        {/* Title */}
        <div className="flex items-center gap-3" data-tauri-drag-region>
          <span className={`font-bold text-lg ${colors.text}`}>Kiro Assistant</span>
        </div>

        {/* Navigation Tabs */}
        <div className={`flex items-center ${isDark ? 'bg-white/5' : 'bg-gray-100'} rounded-full p-1`}>
          {menuItems.slice(0, 4).map((item) => {
            const isActive = activeMenu === item.id
            return (
              <button
                key={item.id}
                onClick={() => onMenuChange(item.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  isActive 
                    ? `${isDark ? 'bg-blue-500 text-white' : 'bg-blue-500 text-white'} shadow-md` 
                    : `${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`
                }`}
              >
                {item.label}
              </button>
            )
          })}
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          {/* More Menu */}
          <div className={`flex items-center ${isDark ? 'bg-white/5' : 'bg-gray-100'} rounded-full p-1`}>
            {menuItems.slice(4).map((item) => {
              const Icon = item.icon
              const isActive = activeMenu === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => onMenuChange(item.id)}
                  className={`p-2 rounded-full transition-all ${
                    isActive 
                      ? `${isDark ? 'bg-blue-500 text-white' : 'bg-blue-500 text-white'}` 
                      : `${isDark ? 'text-gray-400 hover:text-white hover:bg-white/10' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200'}`
                  }`}
                  title={item.label}
                >
                  <Icon size={18} />
                </button>
              )
            })}
          </div>

          {/* Theme Toggle */}
          <div className="relative">
            <button
              onClick={() => setShowThemeMenu(!showThemeMenu)}
              className={`p-2.5 rounded-full transition-all ${isDark ? 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10' : 'bg-gray-100 text-gray-500 hover:text-gray-900 hover:bg-gray-200'}`}
            >
              <ThemeIcon size={18} />
            </button>
            
            {showThemeMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowThemeMenu(false)} />
                <div className={`absolute top-full right-0 mt-2 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl shadow-xl border py-1 min-w-[120px] z-50 animate-scale-in`}>
                  {Object.entries(themes).map(([key, t]) => {
                    const TIcon = themeIcons[key] || Sun
                    return (
                      <button
                        key={key}
                        onClick={() => { setTheme(key); setShowThemeMenu(false) }}
                        className={`w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors ${
                          isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                        } ${theme === key ? 'text-blue-500 font-medium' : colors.text}`}
                      >
                        <TIcon size={14} />
                        {t.name}
                      </button>
                    )
                  })}
                </div>
              </>
            )}
          </div>

          {/* Language Toggle */}
          <div className="relative">
            <button
              onClick={() => setShowLangMenu(!showLangMenu)}
              disabled={langLoading}
              className={`px-3 py-2 rounded-full text-sm font-medium transition-all ${isDark ? 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10' : 'bg-gray-100 text-gray-500 hover:text-gray-900 hover:bg-gray-200'} disabled:opacity-50`}
            >
              {locales[locale]?.substring(0, 2) || '中'}
            </button>
            
            {showLangMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowLangMenu(false)} />
                <div className={`absolute top-full right-0 mt-2 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl shadow-xl border py-1 min-w-[120px] z-50 animate-scale-in`}>
                  {Object.entries(locales).map(([key, name]) => (
                    <button
                      key={key}
                      onClick={() => { setLocale(key); setShowLangMenu(false) }}
                      className={`w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors ${
                        isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                      } ${locale === key ? 'text-blue-500 font-medium' : colors.text}`}
                    >
                      {name}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default TopNav
