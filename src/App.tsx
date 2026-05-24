import { useState, useEffect, useMemo, useCallback } from 'react'
import { Analytics } from '@vercel/analytics/react'

// ===== TİPLER =====
interface Player {
  id: string
  username: string
  discordId: string
  avatar: string
  region: string
  tiers: Record<string, string>
  totalPoints: number
  rank: number
  tests: number
}

// ===== SABİTLER =====
const UPSTASH_URL = 'https://relieved-sailfish-134968.upstash.io'
const UPSTASH_TOKEN = 'gQAAAAAAAg84AAIgcDEyYTEzOGNmZWMzMzk0MjBhYTIzZTk3NmIyOGU0MGM1ZA'
const DISCORD_INVITE = 'https://discord.gg/Uk7AyW6uRs'

const KIT_LIST = [
  { key: 'all', label: 'Tümü', emoji: '🏆' },
  { key: 'sword', label: 'Sword', emoji: '⚔️' },
  { key: 'axe', label: 'Axe', emoji: '🪓' },
  { key: 'nethpot', label: 'Nethpot', emoji: '🌌' },
  { key: 'pot', label: 'Pot', emoji: '🧪' },
  { key: 'uhc', label: 'UHC', emoji: '🍎' },
  { key: 'crystal', label: 'Crystal', emoji: '💎' },
  { key: 'mace', label: 'Mace', emoji: '🔨' },
  { key: 'smp', label: 'SMP', emoji: '🌿' },
]

const TIER_PUAN: Record<string, number> = {
  'HT1': 100, 'HT2': 85, 'HT3': 70, 'HT4': 60, 'HT5': 50,
  'LT1': 40, 'LT2': 30, 'LT3': 20, 'LT4': 10, 'LT5': 5
}

const TIER_COLORS: Record<string, string> = {
  'HT1': 'tier-ht1', 'HT2': 'tier-ht2', 'HT3': 'tier-ht3', 'HT4': 'tier-ht4', 'HT5': 'tier-ht5',
  'LT1': 'tier-lt1', 'LT2': 'tier-lt2', 'LT3': 'tier-lt3', 'LT4': 'tier-lt4', 'LT5': 'tier-lt5',
}

const TIER_ORDER = ['HT1', 'HT2', 'HT3', 'HT4', 'HT5', 'LT1', 'LT2', 'LT3', 'LT4', 'LT5']

// ===== YARDIMCI FONKSİYONLAR =====
function getTierClass(tier: string): string {
  const parts = tier.split(' ')
  const tierKey = parts[parts.length - 1].toUpperCase()
  return TIER_COLORS[tierKey] || 'tier-unranked'
}

function getTierLabel(tier: string): string {
  const parts = tier.split(' ')
  return parts[parts.length - 1].toUpperCase()
}

function getTierPoints(tier: string): number {
  const parts = tier.split(' ')
  const tierKey = parts[parts.length - 1].toUpperCase()
  return TIER_PUAN[tierKey] || 0
}

// ===== BALONCUKLAR =====
function Bubbles() {
  const bubbles = useMemo(() => {
    return Array.from({ length: 15 }, (_, i) => ({
      id: i,
      size: Math.random() * 8 + 3,
      left: Math.random() * 100,
      delay: Math.random() * 10,
      duration: Math.random() * 10 + 10,
      opacity: Math.random() * 0.3 + 0.1,
    }))
  }, [])

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {bubbles.map(b => (
        <div
          key={b.id}
          className="bubble"
          style={{
            width: b.size + 'px',
            height: b.size + 'px',
            left: b.left + '%',
            animationDelay: b.delay + 's',
            animationDuration: b.duration + 's',
            opacity: b.opacity,
          }}
        />
      ))}
    </div>
  )
}

// ===== DISCORD SVG İKONU =====
function DiscordIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/>
    </svg>
  )
}

// ===== NAVİGASYON =====
function Navbar({ activePage, setActivePage }: { activePage: string; setActivePage: (p: string) => void }) {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const links = [
    { id: 'home', label: '🏠 Ana Sayfa' },
    { id: 'leaderboard', label: '🏆 Sıralama' },
    { id: 'tiers', label: '📊 Tier Listesi' },
  ]

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'nav-glass shadow-xl' : 'bg-transparent'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActivePage('home')}>
            <img src="/logo.png" alt="Logo" className="w-10 h-10 rounded-full border-2 border-ocean-500/30" />
            <div>
              <span className="text-lg font-bold bg-gradient-to-r from-ocean-400 to-blue-400 bg-clip-text text-transparent">
                ABYSSAL OCEAN
              </span>
              <span className="block text-[10px] text-slate-500 -mt-1 tracking-widest">PVP TIER</span>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-2">
            {links.map(l => (
              <button
                key={l.id}
                onClick={() => setActivePage(l.id)}
                className={`nav-link ${activePage === l.id ? 'active' : ''}`}
              >
                {l.label}
              </button>
            ))}
            <a href={DISCORD_INVITE} target="_blank" rel="noopener noreferrer" className="btn-discord text-sm !py-2 !px-4 ml-2">
              <DiscordIcon size={18} />
              Discord
            </a>
          </div>

          <button
            className="md:hidden flex flex-col gap-1.5 p-2"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            <span className={`w-6 h-0.5 bg-slate-400 transition-all ${mobileOpen ? 'rotate-45 translate-y-2' : ''}`} />
            <span className={`w-6 h-0.5 bg-slate-400 transition-all ${mobileOpen ? 'opacity-0' : ''}`} />
            <span className={`w-6 h-0.5 bg-slate-400 transition-all ${mobileOpen ? '-rotate-45 -translate-y-2' : ''}`} />
          </button>
        </div>

        {mobileOpen && (
          <div className="md:hidden pb-4 border-t border-slate-800 mt-2 pt-4 flex flex-col gap-2">
            {links.map(l => (
              <button
                key={l.id}
                onClick={() => { setActivePage(l.id); setMobileOpen(false) }}
                className={`nav-link text-left ${activePage === l.id ? 'active' : ''}`}
              >
                {l.label}
              </button>
            ))}
            <a href={DISCORD_INVITE} target="_blank" rel="noopener noreferrer" className="btn-discord text-sm !py-2 !px-4 w-full justify-center mt-2">
              Discord'a Katıl
            </a>
          </div>
        )}
      </div>
    </nav>
  )
}

// ===== FOOTER =====
function Footer() {
  return (
    <footer className="border-t border-slate-800/50 mt-20">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <img src="/logo.png" alt="Logo" className="w-10 h-10 rounded-full" />
              <div>
                <h3 className="text-lg font-bold text-white">ABYSSAL OCEAN</h3>
                <p className="text-xs text-slate-500">PVP TIER</p>
              </div>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed">
              Türkiye'nin en büyük Minecraft PvP Tierlist topluluğu.
              Seviyeni kanıtla, zirveye tırman!
            </p>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Hızlı Bağlantılar</h4>
            <div className="flex flex-col gap-2">
              <a href={DISCORD_INVITE} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-ocean-400 transition-colors text-sm">
                💬 Discord Sunucusu
              </a>
              <span className="text-slate-400 text-sm">🏆 Sıralama Tablosu</span>
              <span className="text-slate-400 text-sm">📊 Tier Listesi</span>
            </div>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Aktif Kitler</h4>
            <div className="flex flex-wrap gap-2">
              {KIT_LIST.filter(k => k.key !== 'all').map(k => (
                <span key={k.key} className="text-xs bg-slate-800/50 border border-slate-700/50 px-3 py-1 rounded-full text-slate-400">
                  {k.emoji} {k.label}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-slate-800/50 mt-8 pt-8 text-center">
          <p className="text-slate-500 text-sm">
            © {new Date().getFullYear()} Abyssal Ocean PVP Tier. Tüm hakları saklıdır.
          </p>
          <p className="text-slate-600 text-xs mt-2">
            Minecraft, Mojang Studios'un tescilli markasıdır.
          </p>
        </div>
      </div>
    </footer>
  )
}

// ===== ANA SAYFA =====
function HomePage({ players, setActivePage }: { players: Player[]; setActivePage: (p: string) => void }) {
  const topPlayers = players.slice(0, 3)

  const stats = useMemo(() => {
    let totalTiers = 0
    const kitCounts: Record<string, number> = {}
    players.forEach(p => {
      Object.entries(p.tiers).forEach(([kit]) => {
        totalTiers++
        kitCounts[kit] = (kitCounts[kit] || 0) + 1
      })
    })
    const mostPopularKit = Object.entries(kitCounts).sort((a, b) => b[1] - a[1])[0]
    return {
      totalPlayers: players.length,
      totalTiers,
      mostPopularKit: mostPopularKit ? mostPopularKit[0] : '-',
      totalTests: players.reduce((acc, p) => acc + (p.tests || 0), 0)
    }
  }, [players])

  const kitEmoji = KIT_LIST.find(k => k.key === stats.mostPopularKit)?.emoji || '🎮'
  const kitLabel = KIT_LIST.find(k => k.key === stats.mostPopularKit)?.label || stats.mostPopularKit

  return (
    <div className="page-enter">
      {/* HERO */}
      <section className="relative min-h-[85vh] flex items-center justify-center px-4 pt-16">
        <div className="text-center max-w-4xl mx-auto">
          <div className="mb-8 flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-ocean-500/20 blur-3xl animate-pulse-slow" />
              <img
                src="/logo.png"
                alt="Abyssal Ocean"
                className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-ocean-500/30 relative z-10 animate-float"
                style={{ boxShadow: '0 0 60px rgba(14, 165, 233, 0.3)' }}
              />
            </div>
          </div>

          <h1 className="hero-title text-4xl md:text-6xl lg:text-7xl font-black mb-4 tracking-tight" style={{ animation: 'textGlow 3s ease-in-out infinite' }}>
            <span className="bg-gradient-to-r from-ocean-400 via-blue-400 to-cyan-300 bg-clip-text text-transparent">
              ABYSSAL OCEAN
            </span>
          </h1>
          <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-slate-300 mb-2 tracking-widest">
            PVP TIER
          </h2>
          <p className="text-slate-400 text-lg md:text-xl mb-8 max-w-2xl mx-auto leading-relaxed">
            Türkiye'nin en büyük Minecraft PvP Tierlist topluluğuna katıl.
            <br />
            <span className="text-ocean-400">Seviyeni kanıtla, zirveye tırman!</span>
          </p>

          <div className="flex flex-wrap gap-4 justify-center mb-12">
            <button onClick={() => setActivePage('leaderboard')} className="btn-ocean">
              🏆 Sıralamaya Bak
            </button>
            <a href={DISCORD_INVITE} target="_blank" rel="noopener noreferrer" className="btn-discord">
              <DiscordIcon /> Discord'a Katıl
            </a>
          </div>

          <div className="stat-grid grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
            <div className="stat-card">
              <div className="text-3xl font-black text-ocean-400 mb-1">{stats.totalPlayers}</div>
              <div className="text-sm text-slate-400">Kayıtlı Oyuncu</div>
            </div>
            <div className="stat-card">
              <div className="text-3xl font-black text-green-400 mb-1">{stats.totalTiers}</div>
              <div className="text-sm text-slate-400">Verilen Tier</div>
            </div>
            <div className="stat-card">
              <div className="text-3xl font-black text-purple-400 mb-1">{stats.totalTests}</div>
              <div className="text-sm text-slate-400">Toplam Test</div>
            </div>
            <div className="stat-card">
              <div className="text-3xl font-black text-amber-400 mb-1">{kitEmoji}</div>
              <div className="text-sm text-slate-400">En Popüler: {kitLabel}</div>
            </div>
          </div>
        </div>
      </section>

      {/* TOP 3 */}
      {topPlayers.length > 0 && (
        <section className="max-w-5xl mx-auto px-4 py-16">
          <h2 className="text-3xl font-bold text-center mb-2 text-white">🏅 En İyi Oyuncular</h2>
          <p className="text-center text-slate-400 mb-10">Tier puanlarına göre en yüksek sıralamalar</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {topPlayers.map((player, idx) => {
              const medals = ['🥇', '🥈', '🥉']
              const gradients = [
                'from-yellow-500/20 to-amber-900/10 border-yellow-500/40',
                'from-slate-300/15 to-slate-600/10 border-slate-400/30',
                'from-orange-600/15 to-orange-900/10 border-orange-500/30',
              ]
              return (
                <div key={player.id} className={`glass-card bg-gradient-to-br ${gradients[idx]} p-6 text-center`}>
                  <div className="text-4xl mb-3">{medals[idx]}</div>
                  <img
                    src={`https://mc-heads.net/avatar/${player.username}/64`}
                    alt={player.username}
                    className="w-16 h-16 rounded-full mx-auto mb-3 border-2 border-white/20"
                    onError={(e) => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${player.username}&background=0ea5e9&color=fff` }}
                  />
                  <h3 className="text-lg font-bold text-white mb-1">{player.username}</h3>
                  <div className="text-2xl font-black text-ocean-400 mb-3">{player.totalPoints} <span className="text-sm text-slate-500">puan</span></div>
                  <div className="flex flex-wrap gap-1 justify-center">
                    {Object.entries(player.tiers).map(([kit, tier]) => (
                      <span key={kit} className={`tier-badge ${getTierClass(tier)} text-[10px]`}>
                        {getTierLabel(tier)}
                      </span>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* KİTLER */}
      <section className="max-w-5xl mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-2 text-white">⚔️ Aktif Kitler</h2>
        <p className="text-center text-slate-400 mb-10">Test olabileceğin tüm kitler</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {KIT_LIST.filter(k => k.key !== 'all').map(k => (
            <div key={k.key} className="glass-card p-6 text-center cursor-pointer" onClick={() => setActivePage('leaderboard')}>
              <div className="text-4xl mb-3">{k.emoji}</div>
              <h3 className="text-white font-semibold">{k.label}</h3>
              <p className="text-slate-500 text-sm mt-1">
                {players.filter(p => p.tiers[k.key]).length} oyuncu
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* NASIL ÇALIŞIR */}
      <section className="max-w-5xl mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-2 text-white">❓ Nasıl Çalışır?</h2>
        <p className="text-center text-slate-400 mb-10">3 adımda tier sahibi ol</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { step: '01', title: 'Discord\'a Katıl', desc: 'Sunucumuza katıl ve whitelist rolünü al', icon: '💬' },
            { step: '02', title: 'Test Ol', desc: 'Sıraya gir, tester seni test etsin', icon: '⚔️' },
            { step: '03', title: 'Tier Kazan', desc: 'Performansına göre tier rolünü al', icon: '🏆' },
          ].map((item, idx) => (
            <div key={idx} className="glass-card p-8 text-center relative overflow-hidden">
              <div className="absolute top-4 right-4 text-6xl font-black text-slate-800/40">{item.step}</div>
              <div className="text-4xl mb-4">{item.icon}</div>
              <h3 className="text-xl font-bold text-white mb-2">{item.title}</h3>
              <p className="text-slate-400">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

// ===== OYUNCU MODAL =====
function PlayerModal({ player, onClose }: { player: Player; onClose: () => void }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors text-xl">
          ✕
        </button>

        <div className="text-center mb-6">
          <img
            src={`https://mc-heads.net/avatar/${player.username}/80`}
            alt={player.username}
            className="w-20 h-20 rounded-full mx-auto mb-3 border-2 border-ocean-500/30"
            onError={(e) => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${player.username}&background=0ea5e9&color=fff&size=80` }}
          />
          <h2 className="text-2xl font-bold text-white">{player.username}</h2>
          <p className="text-ocean-400 font-semibold mt-1">#{player.rank} Sırada</p>
          <div className="flex items-center justify-center gap-4 mt-3">
            <div className="text-center">
              <div className="text-xl font-bold text-ocean-400">{player.totalPoints}</div>
              <div className="text-xs text-slate-500">Toplam Puan</div>
            </div>
            <div className="w-px h-8 bg-slate-700" />
            <div className="text-center">
              <div className="text-xl font-bold text-green-400">{Object.keys(player.tiers).length}</div>
              <div className="text-xs text-slate-500">Kit Tier</div>
            </div>
            <div className="w-px h-8 bg-slate-700" />
            <div className="text-center">
              <div className="text-xl font-bold text-purple-400">{player.tests || 0}</div>
              <div className="text-xs text-slate-500">Test</div>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Kit Tierleri</h3>
          {Object.entries(player.tiers).map(([kit, tier]) => {
            const kitData = KIT_LIST.find(k => k.key === kit)
            return (
              <div key={kit} className="flex items-center justify-between bg-slate-800/30 rounded-lg px-4 py-3 border border-slate-700/30">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{kitData?.emoji || '🎮'}</span>
                  <span className="text-white font-medium">{kitData?.label || kit}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`tier-badge ${getTierClass(tier)}`}>
                    {getTierLabel(tier)}
                  </span>
                  <span className="text-xs text-slate-500">{getTierPoints(tier)} puan</span>
                </div>
              </div>
            )
          })}
        </div>

        <div className="mt-6 pt-4 border-t border-slate-700/50 text-center">
          <p className="text-xs text-slate-600">Discord ID: {player.discordId}</p>
        </div>
      </div>
    </div>
  )
}

// ===== SIRALAMA SAYFASI =====
function LeaderboardPage({ players }: { players: Player[] }) {
  const [activeKit, setActiveKit] = useState('all')
  const [search, setSearch] = useState('')
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null)

  const filteredPlayers = useMemo(() => {
    let list = [...players]

    if (activeKit !== 'all') {
      list = list.filter(p => p.tiers[activeKit])
      list.sort((a, b) => {
        const aPoints = getTierPoints(a.tiers[activeKit])
        const bPoints = getTierPoints(b.tiers[activeKit])
        return bPoints - aPoints
      })
    }

    if (search.trim()) {
      const s = search.toLowerCase()
      list = list.filter(p => p.username.toLowerCase().includes(s))
    }

    return list
  }, [players, activeKit, search])

  return (
    <div className="page-enter max-w-5xl mx-auto px-4 pt-24 pb-10">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-black text-white mb-2">🏆 Sıralama Tablosu</h1>
        <p className="text-slate-400">Tüm oyuncuların tier puanlarına göre sıralaması</p>
      </div>

      <div className="kit-tabs flex gap-2 mb-6 overflow-x-auto pb-2">
        {KIT_LIST.map(k => (
          <button
            key={k.key}
            onClick={() => setActiveKit(k.key)}
            className={`kit-tab whitespace-nowrap ${activeKit === k.key ? 'active' : ''}`}
          >
            {k.emoji} {k.label}
          </button>
        ))}
      </div>

      <div className="relative mb-6">
        <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          placeholder="Oyuncu ara..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="search-input"
        />
      </div>

      <div className="text-sm text-slate-500 mb-4">
        {filteredPlayers.length} oyuncu bulundu
      </div>

      <div className="space-y-2">
        {filteredPlayers.length === 0 ? (
          <div className="text-center py-20 text-slate-500">
            <div className="text-5xl mb-4">🔍</div>
            <p className="text-lg">Oyuncu bulunamadı</p>
          </div>
        ) : (
          filteredPlayers.map((player, idx) => {
            const rank = activeKit === 'all' ? player.rank : idx + 1
            const rankClass = rank === 1 ? 'rank-1' : rank === 2 ? 'rank-2' : rank === 3 ? 'rank-3' : ''

            return (
              <div
                key={player.id}
                className={`rank-card ${rankClass} flex items-center gap-4 cursor-pointer`}
                onClick={() => setSelectedPlayer(player)}
              >
                <div className="flex-shrink-0 w-10 text-center">
                  {rank === 1 ? <span className="text-2xl">🥇</span> :
                   rank === 2 ? <span className="text-2xl">🥈</span> :
                   rank === 3 ? <span className="text-2xl">🥉</span> :
                   <span className="text-lg font-bold text-slate-500">#{rank}</span>}
                </div>

                <img
                  src={`https://mc-heads.net/avatar/${player.username}/40`}
                  alt={player.username}
                  className="w-10 h-10 rounded-lg border border-slate-700/50 flex-shrink-0"
                  onError={(e) => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${player.username}&background=0ea5e9&color=fff&size=40` }}
                />

                <div className="flex-grow min-w-0">
                  <div className="font-semibold text-white truncate">{player.username}</div>
                  <div className="text-xs text-slate-500">{Object.keys(player.tiers).length} kit</div>
                </div>

                <div className="hidden sm:flex gap-1 flex-wrap justify-end max-w-[300px]">
                  {activeKit !== 'all' ? (
                    <span className={`tier-badge ${getTierClass(player.tiers[activeKit])}`}>
                      {getTierLabel(player.tiers[activeKit])}
                    </span>
                  ) : (
                    Object.entries(player.tiers).slice(0, 4).map(([kit, tier]) => (
                      <span key={kit} className={`tier-badge ${getTierClass(tier)} text-[10px]`}>
                        {getTierLabel(tier)}
                      </span>
                    ))
                  )}
                  {activeKit === 'all' && Object.keys(player.tiers).length > 4 && (
                    <span className="tier-badge tier-unranked text-[10px]">+{Object.keys(player.tiers).length - 4}</span>
                  )}
                </div>

                <div className="flex-shrink-0 text-right ml-2">
                  <div className="text-lg font-bold text-ocean-400">
                    {activeKit !== 'all' ? getTierPoints(player.tiers[activeKit]) : player.totalPoints}
                  </div>
                  <div className="text-[10px] text-slate-600">puan</div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {selectedPlayer && (
        <PlayerModal player={selectedPlayer} onClose={() => setSelectedPlayer(null)} />
      )}
    </div>
  )
}

// ===== TIER LİSTESİ SAYFASI =====
function TierListPage({ players }: { players: Player[] }) {
  const [activeKit, setActiveKit] = useState('sword')

  const tierGroups = useMemo(() => {
    const groups: Record<string, Player[]> = {}
    TIER_ORDER.forEach(t => { groups[t] = [] })

    players.forEach(player => {
      if (player.tiers[activeKit]) {
        const tierLabel = getTierLabel(player.tiers[activeKit])
        if (groups[tierLabel]) {
          groups[tierLabel].push(player)
        }
      }
    })

    Object.values(groups).forEach(arr => {
      arr.sort((a, b) => b.totalPoints - a.totalPoints)
    })

    return groups
  }, [players, activeKit])

  return (
    <div className="page-enter max-w-5xl mx-auto px-4 pt-24 pb-10">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-black text-white mb-2">📊 Tier Listesi</h1>
        <p className="text-slate-400">Kit bazında tüm tierlerin oyuncu dağılımı</p>
      </div>

      <div className="kit-tabs flex gap-2 mb-8 overflow-x-auto pb-2 justify-center">
        {KIT_LIST.filter(k => k.key !== 'all').map(k => (
          <button
            key={k.key}
            onClick={() => setActiveKit(k.key)}
            className={`kit-tab whitespace-nowrap ${activeKit === k.key ? 'active' : ''}`}
          >
            {k.emoji} {k.label}
          </button>
        ))}
      </div>

      <div className="space-y-6">
        {TIER_ORDER.map(tierKey => {
          const group = tierGroups[tierKey]
          if (group.length === 0) return null

          return (
            <div key={tierKey} className="glass-card p-6">
              <div className="flex items-center gap-3 mb-4">
                <span className={`tier-badge ${TIER_COLORS[tierKey]} text-sm px-4 py-1.5`}>
                  {tierKey}
                </span>
                <span className="text-slate-500 text-sm">{group.length} oyuncu</span>
                <span className="text-slate-600 text-xs">({TIER_PUAN[tierKey]} puan)</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {group.map(player => (
                  <div key={player.id} className="flex items-center gap-2 bg-slate-800/30 rounded-lg px-3 py-2 border border-slate-700/20 hover:border-ocean-500/30 transition-all">
                    <img
                      src={`https://mc-heads.net/avatar/${player.username}/28`}
                      alt={player.username}
                      className="w-7 h-7 rounded"
                      onError={(e) => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${player.username}&background=0ea5e9&color=fff&size=28` }}
                    />
                    <span className="text-sm text-slate-300 truncate">{player.username}</span>
                  </div>
                ))}
              </div>
            </div>
          )
        })}

        {Object.values(tierGroups).every(g => g.length === 0) && (
          <div className="text-center py-20 text-slate-500">
            <div className="text-5xl mb-4">📭</div>
            <p className="text-lg">Bu kitte henüz kayıtlı oyuncu yok</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ===== LOADING =====
function LoadingScreen() {
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50" style={{ background: '#040812' }}>
      <div className="text-center">
        <div className="loading-spinner mx-auto mb-4" />
        <p className="text-slate-400 text-sm animate-pulse">Veriler yükleniyor...</p>
      </div>
    </div>
  )
}

// ===== ANA APP =====
function App() {
  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)
  const [activePage, setActivePage] = useState('home')

  const fetchPlayers = useCallback(async () => {
    try {
      const res = await fetch(`${UPSTASH_URL}/get/players`, {
        headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` }
      })
      const data = await res.json()
      if (data.result) {
        const parsed: Player[] = JSON.parse(data.result)
        const sorted = parsed.map(p => {
          let total = 0
          for (const tier of Object.values(p.tiers)) {
            total += getTierPoints(tier)
          }
          return { ...p, totalPoints: total }
        }).sort((a, b) => b.totalPoints - a.totalPoints)
          .map((p, idx) => ({ ...p, rank: idx + 1 }))
        setPlayers(sorted)
      }
    } catch (error) {
      console.error('Redis veri çekme hatası:', error)
      try {
        const res = await fetch('/web_oyuncular.json')
        const data = await res.json()
        setPlayers(data)
      } catch (e) {
        console.error('Yedek dosya da okunamadı:', e)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPlayers()
    const interval = setInterval(fetchPlayers, 30000)
    return () => clearInterval(interval)
  }, [fetchPlayers])

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [activePage])

  if (loading) return <LoadingScreen />

  return (
    <>
      <div className="ocean-bg" />
      <Bubbles />
      <Navbar activePage={activePage} setActivePage={setActivePage} />

      <main className="relative z-10 min-h-screen">
        {activePage === 'home' && <HomePage players={players} setActivePage={setActivePage} />}
        {activePage === 'leaderboard' && <LeaderboardPage players={players} />}
        {activePage === 'tiers' && <TierListPage players={players} />}
      </main>

      <Footer />
      <Analytics />
    </>
  )
}

export default App
