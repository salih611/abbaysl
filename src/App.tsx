import { useState, useEffect, useMemo } from "react";

interface Player {
  id: string;
  username: string;
  discordId: string;
  avatar: string;
  region: "TR" | "EU" | "NA";
  tiers: Record<string, string>;
  totalPoints: number;
  rank: number;
  tests: number;
}

type KitKey = "overall" | "ltm" | "vanilla" | "sword" | "axe" | "nethpot" | "pot" | "uhc" | "smp" | "mace";
type PageType = "home" | "rankings";

// Upstash Redis
const UPSTASH_URL = "https://relieved-sailfish-134968.upstash.io";
const UPSTASH_TOKEN = "gQAAAAAAAg84AAIgcDEyYTEzOGNmZWMzMzk0MjBhYTIzZTk3NmIyOGU0MGM1ZA";

// MCTiers ikonları
const KITS: Record<string, { ad: string; icon: JSX.Element; color: string }> = {
  ltm:     { ad: "LTMs", icon: <img src="https://mctiers.com/icons/ltm.png" width="30" height="30" className="w-7 h-7" />, color: "#a855f7" },
  vanilla: { ad: "Vanilla", icon: <img src="https://mctiers.com/icons/vanilla.png" width="30" height="30" className="w-7 h-7" />, color: "#fbbf24" },
  sword:   { ad: "Sword", icon: <img src="https://mctiers.com/icons/sword.png" width="30" height="30" className="w-7 h-7" />, color: "#60a5fa" },
  axe:     { ad: "Axe", icon: <img src="https://mctiers.com/icons/axe.png" width="30" height="30" className="w-7 h-7" />, color: "#a78bfa" },
  nethpot: { ad: "NethOP", icon: <img src="https://mctiers.com/icons/nethop.png" width="30" height="30" className="w-7 h-7" />, color: "#ec4899" },
  pot:     { ad: "Pot", icon: <img src="https://mctiers.com/icons/pot.png" width="30" height="30" className="w-7 h-7" />, color: "#f43f5e" },
  uhc:     { ad: "UHC", icon: <img src="https://mctiers.com/icons/uhc.png" width="30" height="30" className="w-7 h-7" />, color: "#ef4444" },
  smp:     { ad: "SMP", icon: <img src="https://mctiers.com/icons/smp.png" width="30" height="30" className="w-7 h-7" />, color: "#22c55e" },
  mace:    { ad: "Mace", icon: <img src="https://mctiers.com/icons/mace.png" width="30" height="30" className="w-7 h-7" />, color: "#eab308" },
};

const TIER_POINTS: Record<string, number> = {
  HT1: 100, HT2: 85, HT3: 70, HT4: 60, HT5: 50,
  LT1: 40,  LT2: 30, LT3: 20, LT4: 10, LT5: 5,
};

const TIER_COLORS: Record<string, string> = {
  HT1: "from-amber-400 to-yellow-600", HT2: "from-slate-300 to-slate-500",
  HT3: "from-orange-600 to-amber-700", HT4: "from-blue-500 to-blue-700",
  HT5: "from-purple-500 to-purple-700", LT1: "from-emerald-500 to-emerald-700",
  LT2: "from-cyan-500 to-cyan-700", LT3: "from-indigo-500 to-indigo-700",
  LT4: "from-pink-500 to-pink-700", LT5: "from-gray-500 to-gray-700",
};

const KIT_ORDER: KitKey[] = ["overall", "ltm", "vanilla", "sword", "axe", "nethpot", "pot", "uhc", "smp", "mace"];

const getTitle = (points: number): string => {
  if (points >= 300) return "Combat Master";
  if (points >= 200) return "Combat Ace";
  if (points >= 150) return "Combat Veteran";
  if (points >= 100) return "Combat Expert";
  if (points >= 50) return "Combat Novice";
  return "Rookie";
};

const DiscordIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 127.14 96.36" fill="currentColor">
    <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,46,96.12,53,91.08,65.69,84.69,65.69Z"/>
  </svg>
);

export default function App() {
  const [currentPage, setCurrentPage] = useState<PageType>("home");
  const [selectedKit, setSelectedKit] = useState<KitKey>("overall");
  const [searchQuery, setSearchQuery] = useState("");
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [stats, setStats] = useState({ totalPlayers: 0, activeKits: 9, tierLevels: 10, onlineStatus: "ON" });

  useEffect(() => {
    const loadPlayers = async () => {
      try {
        const response = await fetch(`${UPSTASH_URL}/get/players`, {
          headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` }
        });
        if (response.ok) {
          const data = await response.json();
          if (data.result) {
            const playersData = JSON.parse(data.result);
            setPlayers(playersData);
            setStats(prev => ({ ...prev, totalPlayers: playersData.length }));
          }
        }
      } catch (error) {
        console.log("Redis'den yüklenemedi:", error);
      }
    };
    loadPlayers();
    const interval = setInterval(loadPlayers, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const updatedPlayers = players.map(player => {
      let total = 0;
      for (const tier of Object.values(player.tiers)) total += TIER_POINTS[tier] || 0;
      return { ...player, totalPoints: total };
    });
    updatedPlayers.sort((a, b) => b.totalPoints - a.totalPoints);
    updatedPlayers.forEach((p, idx) => p.rank = idx + 1);
    setPlayers(updatedPlayers);
    setStats(prev => ({ ...prev, totalPlayers: updatedPlayers.length }));
  }, [players]);

  const filteredPlayers = useMemo(() => {
    if (!searchQuery) return players;
    return players.filter(p => p.username.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [players, searchQuery]);

  const kitPlayers = useMemo(() => {
    if (selectedKit === "overall") return filteredPlayers;
    return [...filteredPlayers]
      .filter(p => p.tiers[selectedKit])
      .sort((a, b) => (TIER_POINTS[b.tiers[selectedKit]] || 0) - (TIER_POINTS[a.tiers[selectedKit]] || 0));
  }, [filteredPlayers, selectedKit]);

  const playersByTier = useMemo(() => {
    if (selectedKit === "overall") return null;
    const groups: Record<number, Player[]> = { 1: [], 2: [], 3: [], 4: [], 5: [] };
    kitPlayers.forEach(p => {
      const tier = p.tiers[selectedKit];
      if (!tier) return;
      let groupNum = 0;
      if (tier === "HT1" || tier === "LT1") groupNum = 1;
      else if (tier === "HT2" || tier === "LT2") groupNum = 2;
      else if (tier === "HT3" || tier === "LT3") groupNum = 3;
      else if (tier === "HT4" || tier === "LT4") groupNum = 4;
      else if (tier === "HT5" || tier === "LT5") groupNum = 5;
      if (groupNum >= 1 && groupNum <= 5) groups[groupNum].push(p);
    });
    return groups;
  }, [kitPlayers, selectedKit]);

  return (
    <div className="min-h-screen bg-[#0a0e14] text-white">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[120px]" />
      </div>

      <header className="relative z-50 sticky top-0 backdrop-blur-xl bg-[#0f141b]/80 border-b border-white/5">
        <div className="max-w-[1400px] mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3 cursor-pointer" onClick={() => setCurrentPage("home")}>
                <img src="/logo.png" className="h-12 w-12 rounded-xl object-cover" />
                <div><h1 className="text-xl font-black">ABYSSAL OCEAN</h1><p className="text-[11px] text-white/40">TIER LIST</p></div>
              </div>
              <nav className="hidden lg:flex gap-1">
                <button onClick={() => setCurrentPage("home")} className={`px-4 py-2 rounded-lg text-sm font-medium ${currentPage === "home" ? "bg-white/10 text-white" : "text-white/60 hover:text-white"}`}>🏠 Home</button>
                <button onClick={() => setCurrentPage("rankings")} className={`px-4 py-2 rounded-lg text-sm font-medium ${currentPage === "rankings" ? "bg-white/10 text-white" : "text-white/60 hover:text-white"}`}>🏆 Rankings</button>
              </nav>
            </div>
            <div className="flex gap-3">
              {currentPage === "rankings" && (
                <div className="relative hidden md:block">
                  <input type="text" placeholder="Oyuncu ara..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-[220px] pl-9 pr-4 py-2 bg-[#1a1f2e] border border-white/10 rounded-xl text-sm" />
                </div>
              )}
              <a href="https://discord.gg/cKFwKcfcWn" target="_blank" className="flex items-center gap-2 px-4 py-2 bg-[#5865F2] rounded-xl text-sm"><DiscordIcon className="w-5 h-5" /> Discord</a>
            </div>
          </div>
        </div>
      </header>

      {currentPage === "home" && (
        <main className="max-w-[1400px] mx-auto px-4 py-12">
          <div className="text-center mb-16">
            <h1 className="text-5xl md:text-7xl font-black mb-6">ABYSSAL OCEAN<br /><span className="text-white">Tier Sunucusu</span></h1>
            <button onClick={() => setCurrentPage("rankings")} className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl">🏆 Sıralamayı Gör</button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
            {[
              { label: "Toplam Oyuncu", value: stats.totalPlayers, icon: "👥", color: "from-cyan-500 to-blue-600" },
              { label: "Aktif Kit", value: stats.activeKits, icon: "⚔️", color: "from-purple-500 to-pink-600" },
              { label: "Tier Seviyesi", value: stats.tierLevels, icon: "🏆", color: "from-amber-500 to-orange-600" },
              { label: "7/24 Online", value: stats.onlineStatus, icon: "🟢", color: "from-emerald-500 to-green-600" },
            ].map((stat, i) => (
              <div key={i} className="bg-[#11161f] border border-white/5 rounded-2xl p-6">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center text-2xl mb-4`}>{stat.icon}</div>
                <div className="text-3xl font-black mb-1">{stat.value}</div>
                <div className="text-sm text-white/50">{stat.label}</div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(KITS).map(([key, kit]) => (
              <div key={key} className="bg-[#11161f] border border-white/5 rounded-2xl p-6 cursor-pointer group" onClick={() => { setCurrentPage("rankings"); setSelectedKit(key as KitKey); }}>
                <div className="mb-3 group-hover:scale-110 transition-transform flex justify-center">{kit.icon}</div>
                <h3 className="text-lg font-bold text-center">{kit.ad}</h3>
              </div>
            ))}
          </div>
        </main>
      )}

      {currentPage === "rankings" && (
        <main className="max-w-[1400px] mx-auto px-4 py-6">
          <div className="mb-6 overflow-x-auto">
            <div className="flex gap-2">
              {KIT_ORDER.map((key) => {
                const isOverall = key === "overall";
                const kit = isOverall ? { ad: "Overall", icon: <span className="text-xl">🏆</span> } : KITS[key];
                const isActive = selectedKit === key;
                return (
                  <button key={key} onClick={() => setSelectedKit(key)} className={`px-5 py-3 rounded-2xl whitespace-nowrap flex items-center gap-2 ${isActive ? "bg-white text-black" : "bg-[#1a1f2e] text-white/60"}`}>
                    <div className="w-7 h-7">{kit.icon}</div>
                    <span>{kit.ad}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {selectedKit === "overall" ? (
            <div className="bg-[#11161f] rounded-2xl border border-white/5 overflow-hidden">
              {players.length === 0 ? (
                <div className="py-32 text-center"><div className="text-6xl mb-4">🏆</div><h3 className="text-xl font-bold">Henüz Oyuncu Yok</h3></div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead><tr className="border-b border-white/5"><th className="text-left px-6 py-4">#</th><th className="text-left px-6 py-4">Oyuncu</th><th className="text-center px-4 py-4">Bölge</th><th className="text-right px-6 py-4">Tierler</th></tr></thead>
                    <tbody>
                      {kitPlayers.slice(0, 50).map((player) => (
                        <tr key={player.id} onClick={() => setSelectedPlayer(player)} className="cursor-pointer hover:bg-white/5">
                          <td className="px-6 py-4">{player.rank}</td>
                          <td className="px-6 py-4"><div className="flex items-center gap-4"><img src={player.avatar} className="w-10 h-10 rounded-lg" /><div><div className="font-bold">{player.username}</div><div className="text-xs">{getTitle(player.totalPoints)} • {player.totalPoints} puan</div></div></div></td>
                          <td className="px-4 py-4 text-center"><span className="px-2 py-1 rounded-lg bg-emerald-500/15 text-emerald-400 text-xs">{player.region}</span></td>
                          <td className="px-6 py-4"><div className="flex justify-end gap-1 flex-wrap">{Object.entries(KITS).map(([kitKey, kit]) => (<div key={kitKey} className="w-9 h-9 rounded-lg bg-[#0f141b] border border-white/10 flex flex-col items-center justify-center"><div className="text-[10px]">{kit.icon}</div><span className="text-[9px]">{player.tiers[kitKey] || "—"}</span></div>))}</div></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {[1, 2, 3, 4, 5].map((tierNum) => {
                const tierPlayers = playersByTier?.[tierNum] || [];
                return (
                  <div key={tierNum} className="bg-[#11161f] rounded-xl border border-white/5 overflow-hidden">
                    <div className="px-4 py-3 border-b border-white/5 bg-gradient-to-r from-amber-500/20 to-yellow-600/20"><div className="flex justify-between"><span>{tierNum === 1 ? "👑" : tierNum === 2 ? "🥈" : tierNum === 3 ? "🥉" : "🏅"}</span><span className="text-xs">{tierPlayers.length}</span></div></div>
                    <div className="p-2 max-h-[500px] overflow-y-auto">
                      {tierPlayers.map((player) => (<button key={player.id} onClick={() => setSelectedPlayer(player)} className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-white/5"><img src={player.avatar} className="w-8 h-8 rounded-lg" /><div className="flex-1 text-left"><div className="text-sm font-medium">{player.username}</div><div className="text-[10px] text-white/40">{player.tiers[selectedKit]}</div></div></button>))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      )}

      {selectedPlayer && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md" onClick={() => setSelectedPlayer(null)}>
          <div className="relative w-full max-w-2xl bg-[#11161f] rounded-2xl border border-white/10 overflow-hidden">
            <div className="p-6">
              <div className="flex items-center gap-4 mb-6"><img src={selectedPlayer.avatar} className="w-16 h-16 rounded-xl" /><div><h2 className="text-2xl font-black">{selectedPlayer.username}</h2><div className="text-sm">#{selectedPlayer.rank} • {selectedPlayer.totalPoints} puan</div></div><button onClick={() => setSelectedPlayer(null)} className="ml-auto p-2">✕</button></div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">{Object.entries(KITS).map(([kitKey, kit]) => (<div key={kitKey} className="bg-[#0f141b] border border-white/10 rounded-xl p-3"><div className="flex justify-between mb-2"><div className="w-8 h-8">{kit.icon}</div><span className="text-xs px-2 py-1 rounded">{selectedPlayer.tiers[kitKey] || "—"}</span></div><div className="text-sm">{kit.ad}</div></div>))}</div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .custom-scroll::-webkit-scrollbar { width: 4px; }
        .custom-scroll::-webkit-scrollbar-thumb { background: rgb(255 255 255 / 0.1); border-radius: 2px; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}
