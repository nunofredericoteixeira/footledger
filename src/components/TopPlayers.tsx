import { useState, useEffect } from 'react';
import { Trophy, TrendingUp, ChevronLeft, Medal, Users } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useLanguage } from '../lib/LanguageContext';
import { getTranslation } from '../lib/translations';

interface TopPlayersProps {
  onBack?: () => void;
}

interface PlayerStats {
  playerId: string;
  playerName: string;
  playerTeam: string;
  totalPoints: number;
  gamesPlayed: number;
  position: number;
  positionLabel?: string;
  league?: string;
}

function TopPlayers({ onBack }: TopPlayersProps) {
  const { language } = useLanguage();
  const [players, setPlayers] = useState<PlayerStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPosition, setSelectedPosition] = useState<string>('All');

  useEffect(() => {
    loadTopPlayers();
  }, []);

  const loadTopPlayers = async () => {
    try {
      // Aggregate performance points from player_performance_data
      const { data: performances, error: perfError } = await supabase
        .from('player_performance_data')
        .select('player_name, performance_score');
      if (perfError) throw perfError;

      const perfMap = new Map<string, { total: number; games: number }>();
      performances?.forEach((row) => {
        const name = row.player_name;
        if (!name) return;
        const score = row.performance_score || 0;
        if (!perfMap.has(name)) {
          perfMap.set(name, { total: 0, games: 0 });
        }
        const rec = perfMap.get(name)!;
        rec.total += score;
        rec.games += 1;
      });

      // Get player info (club/position) from player_pool
      const { data: pool, error: poolError } = await supabase
        .from('player_pool')
        .select('id, name, club, position, league');
      if (poolError) throw poolError;

      // Build stats from the pool (3022 jogadores), mesmo que tenham 0 pontos.
      const stats: PlayerStats[] = (pool || []).map((p) => {
        const perf = perfMap.get(p.name) || { total: 0, games: 0 };
        return {
          playerId: p.id,
          playerName: p.name,
          playerTeam: p.club,
          totalPoints: perf.total,
          gamesPlayed: perf.games,
          position: 0,
          positionLabel: p.position || undefined,
          league: p.league || undefined,
        };
      });

      // Sort primarily by total points (desc), then name (asc).
      stats.sort((a, b) => {
        if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
        return a.playerName.localeCompare(b.playerName);
      });

      const ranked = stats.map((p, idx) => ({ ...p, position: idx + 1 }));
      setPlayers(ranked);
    } catch (error) {
      console.error('Error loading top players:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPositionBadge = (position: number) => {
    if (position === 1) {
      return (
        <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full shadow-lg">
          <Medal className="w-7 h-7 text-white" />
        </div>
      );
    } else if (position === 2) {
      return (
        <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-gray-300 to-gray-500 rounded-full shadow-lg">
          <Medal className="w-7 h-7 text-white" />
        </div>
      );
    } else if (position === 3) {
      return (
        <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full shadow-lg">
          <Medal className="w-7 h-7 text-white" />
        </div>
      );
    } else {
      return (
        <div className="flex items-center justify-center w-12 h-12 bg-cyan-500/20 border-2 border-cyan-400/50 rounded-full">
          <span className="text-cyan-300 font-bold text-lg">{position}</span>
        </div>
      );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-black via-cyan-600 to-green-500 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-cyan-600 to-green-500 relative">
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <img
          src="/Top Players.png"
          alt=""
          className="w-auto h-[60vh] opacity-25 object-contain"
        />
      </div>

      <div className="bg-gradient-to-b from-black via-black/80 to-transparent py-8 px-6 relative z-10 pb-16">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/30 text-cyan-300 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}

          <img
            src="/Top Players.png"
            alt="Top Players"
            className="w-20 h-20 object-contain"
          />

          <div className="w-10"></div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 pb-12 relative z-10">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-white mb-3">{getTranslation('screens.topPlayers', language)}</h1>
          <p className="text-cyan-200 text-lg">Best performing players by total points</p>
        </div>

        {/* Filtros por posição */}
        <div className="flex flex-wrap gap-2 justify-center mb-6">
          {['All', ...Array.from(new Set(players.map(p => p.positionLabel || 'Sem posição')))].map((pos) => (
            <button
              key={pos}
              onClick={() => setSelectedPosition(pos)}
              className={`px-3 py-2 rounded-full text-sm font-semibold border transition-colors ${
                selectedPosition === pos
                  ? 'bg-cyan-500 text-blue-900 border-cyan-300'
                  : 'bg-black/30 text-cyan-200 border-cyan-500/30 hover:bg-cyan-500/20'
              }`}
            >
              {pos}
            </button>
          ))}
        </div>

        {players.length > 0 && (
          <div className="text-right text-cyan-200 text-sm mb-2">
            Total: <span className="font-bold text-white">{players.length}</span> jogadores
          </div>
        )}

        {players.length === 0 ? (
          <div className="bg-black/40 backdrop-blur-md border border-cyan-400/30 rounded-xl p-12 text-center">
            <TrendingUp className="w-16 h-16 text-cyan-400 mx-auto mb-4 opacity-50" />
            <h2 className="text-2xl font-bold text-white mb-2">No Player Stats Yet</h2>
            <p className="text-cyan-200">Rankings will appear once match performances are recorded</p>
          </div>
        ) : (
          <div className="space-y-3">
            {players
              .filter((p) => selectedPosition === 'All' || (p.positionLabel || 'Sem posição') === selectedPosition)
              .map((player) => (
              <div
                key={player.playerId}
                className={`
                  bg-black/40 backdrop-blur-md border rounded-xl p-6
                  transition-all hover:scale-[1.02] hover:shadow-2xl
                  ${player.position === 1 ? 'border-yellow-400/50 shadow-yellow-400/20' :
                    player.position === 2 ? 'border-gray-400/50 shadow-gray-400/20' :
                    player.position === 3 ? 'border-orange-400/50 shadow-orange-400/20' :
                    'border-cyan-400/30'}
                `}
              >
                <div className="flex items-center gap-6">
                  {getPositionBadge(player.position)}

                  <div className="flex-1">
                    <div className="flex items-baseline gap-3 mb-1">
                      <h3 className="text-2xl font-bold text-white">{player.playerName}</h3>
                      <span className="text-cyan-300">{player.playerTeam}</span>
                      {player.positionLabel && (
                        <span className="text-xs px-2 py-1 bg-cyan-500/20 border border-cyan-400/40 text-cyan-100 rounded-full">
                          {player.positionLabel}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Trophy className="w-4 h-4 text-yellow-400" />
                        <span className="text-cyan-200">
                          Total Points: <span className="text-white font-bold">{player.totalPoints}</span>
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-green-400" />
                        <span className="text-cyan-200">
                          Games: <span className="text-white font-bold">{player.gamesPlayed}</span>
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-cyan-200">
                          Avg: <span className="text-white font-bold">{(player.totalPoints / player.gamesPlayed).toFixed(1)}</span> pts/game
                        </span>
                      </div>
                      {player.league && (
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-cyan-400" />
                          <span className="text-cyan-200">
                            Liga: <span className="text-white font-bold">{player.league}</span>
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default TopPlayers;
