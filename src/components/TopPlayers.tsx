import { useState, useEffect } from 'react';
import { Trophy, TrendingUp, ChevronLeft, Medal } from 'lucide-react';
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
}

function TopPlayers({ onBack }: TopPlayersProps) {
  const { language } = useLanguage();
  const [players, setPlayers] = useState<PlayerStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTopPlayers();
  }, []);

  const loadTopPlayers = async () => {
    try {
      const { data: performances } = await supabase
        .from('player_performances')
        .select(`
          player_id,
          points,
          players:player_id (
            name,
            team
          )
        `);

      if (performances) {
        const playerMap = new Map<string, { name: string; team: string; totalPoints: number; gamesPlayed: number }>();

        performances.forEach(perf => {
          const playerId = perf.player_id;
          const playerData = Array.isArray(perf.players) ? perf.players[0] : perf.players;

          if (!playerData) return;

          if (!playerMap.has(playerId)) {
            playerMap.set(playerId, {
              name: playerData.name,
              team: playerData.team,
              totalPoints: 0,
              gamesPlayed: 0
            });
          }

          const player = playerMap.get(playerId)!;
          player.totalPoints += perf.points || 0;
          player.gamesPlayed += 1;
        });

        const playerStats: PlayerStats[] = Array.from(playerMap.entries())
          .map(([playerId, data]) => ({
            playerId,
            playerName: data.name,
            playerTeam: data.team,
            totalPoints: data.totalPoints,
            gamesPlayed: data.gamesPlayed,
            position: 0
          }))
          .sort((a, b) => b.totalPoints - a.totalPoints)
          .slice(0, 50)
          .map((player, index) => ({
            ...player,
            position: index + 1
          }));

        setPlayers(playerStats);
      }
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

        {players.length === 0 ? (
          <div className="bg-black/40 backdrop-blur-md border border-cyan-400/30 rounded-xl p-12 text-center">
            <TrendingUp className="w-16 h-16 text-cyan-400 mx-auto mb-4 opacity-50" />
            <h2 className="text-2xl font-bold text-white mb-2">No Player Stats Yet</h2>
            <p className="text-cyan-200">Rankings will appear once match performances are recorded</p>
          </div>
        ) : (
          <div className="space-y-3">
            {players.map((player) => (
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
