import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useLanguage } from '../lib/LanguageContext';
import { getTranslation } from '../lib/translations';

interface Player {
  id: string;
  name: string;
  league: string;
  club: string;
  position: string;
  value: number;
}

interface PlayerWithPoints extends Player {
  total_points: number;
  last_week_points: number;
  cost_per_point?: number;
}

interface MyTeamProps {
  userId: string;
  onComplete: () => void;
  onBack?: () => void;
}

export default function MyTeam({ userId, onComplete, onBack }: MyTeamProps) {
  const { language } = useLanguage();
  const [players, setPlayers] = useState<PlayerWithPoints[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'total' | 'weekly' | 'position'>('position');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [initialBudget, setInitialBudget] = useState(0);
  const formatRatio = (points: number, budget: number) => {
    if (points <= 0) return `${(budget / 1000000).toFixed(2)} M€`;
    const raw = (budget / points); // euros per point
    if (raw >= 1000000) {
      return `${(raw / 1000000).toFixed(2)} M€ / Point`;
    }
    if (raw >= 1000) {
      return `${(raw / 1000).toFixed(2)} K€ / Point`;
    }
    return `${raw.toFixed(0)} € / Point`;
  };

  useEffect(() => {
    loadPlayerPoints();
  }, [userId]);

  const loadPlayerPoints = async () => {
    try {
      const normalizeName = (name: string) =>
        (name || '')
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .trim();

      const fetchAll = async <T,>(table: string, columns: string): Promise<T[]> => {
        const pageSize = 1000;
        let from = 0;
        let all: T[] = [];
        while (true) {
          const { data, error } = await supabase
            .from(table)
            .select(columns)
            .range(from, from + pageSize - 1);
          if (error) throw error;
          const chunk = data || [];
          all = all.concat(chunk);
          if (chunk.length < pageSize) break;
          from += pageSize;
        }
        return all;
      };

      const { data: userProfile } = await supabase
        .from('user_profiles')
        .select('team_value, selected_team_id')
        .eq('id', userId)
        .maybeSingle();

      if (userProfile?.team_value && userProfile?.selected_team_id) {
        setInitialBudget(userProfile.team_value);
      }

      const { data: userSelections } = await supabase
        .from('user_player_selections')
        .select('player_id')
        .eq('user_id', userId);

      if (!userSelections || userSelections.length === 0) {
        setLoading(false);
        return;
      }

      const playerIds = userSelections.map(s => s.player_id);

      const { data: playersData } = await supabase
        .from('player_pool')
        .select('*')
        .in('id', playerIds);

      // Aggregate total points by player name (case/diacritics insensitive)
      const perf = await fetchAll<{ player_name: string; performance_score: number }>(
        'player_performance_data',
        'player_name, performance_score'
      );

      const totalByName = (perf || []).reduce((acc, row) => {
        if (!row.player_name) return acc;
        const key = normalizeName(row.player_name);
        acc[key] = (acc[key] || 0) + (row.performance_score || 0);
        return acc;
      }, {} as Record<string, number>);

      const getTotalPoints = (name: string) => {
        const key = normalizeName(name);
        if (key in totalByName) return totalByName[key];
        // Fallback: match inclusivo (para abreviados ou nomes alternativos)
        const fallback = Object.entries(totalByName).find(([stored]) => stored.includes(key) || key.includes(stored));
        return fallback ? fallback[1] : 0;
      };

      // Weekly points (sum of all rows per player_id)
      const weeklyRows = await fetchAll<{ player_id: string; points: number }>(
        'player_weekly_points',
        'player_id, points'
      );
      const weeklyMap = (weeklyRows || []).reduce((acc, row) => {
        acc[row.player_id] = (acc[row.player_id] || 0) + (row.points || 0);
        return acc;
      }, {} as Record<string, number>);

      if (playersData) {
        const playersWithPoints: PlayerWithPoints[] = playersData.map(player => {
          const totalPoints = getTotalPoints(player.name);
          const lastWeek = weeklyMap[player.id] || 0;
          const costPerPoint = totalPoints > 0 ? player.value / totalPoints : undefined;
          return {
            ...player,
            total_points: totalPoints,
            last_week_points: lastWeek,
            cost_per_point: costPerPoint
          };
        });

        setPlayers(playersWithPoints);
      }
    } catch (error) {
      console.error('Error loading player points:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (type: 'total' | 'weekly' | 'position') => {
    if (sortBy === type) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(type);
      setSortOrder(type === 'position' ? 'asc' : 'desc');
    }
  };

  const getPositionOrder = (position: string): number => {
    const positionMap: { [key: string]: number } = {
      'Right Winger': 1,
      'Striker': 2,
      'Centre-Forward': 3,
      'Left Winger': 4,
      'Attacking Midfield': 5,
      'Left Midfield': 5,
      'Right Midfield': 5,
      'Central Midfield': 6,
      'Defensive Midfield': 7,
      'Right-Back': 8,
      'Centre-Back': 9,
      'Left-Back': 10,
      'Goalkeeper': 11
    };
    return positionMap[position] || 999;
  };

  const sortedPlayers = [...players].sort((a, b) => {
    if (sortBy === 'position') {
      const orderA = getPositionOrder(a.position);
      const orderB = getPositionOrder(b.position);
      if (orderA !== orderB) {
        return sortOrder === 'asc' ? orderA - orderB : orderB - orderA;
      }
      return a.name.localeCompare(b.name);
    }

    const multiplier = sortOrder === 'asc' ? 1 : -1;
    if (sortBy === 'total') {
      return (a.total_points - b.total_points) * multiplier;
    } else {
      return (a.last_week_points - b.last_week_points) * multiplier;
    }
  });

  const totalPoints = players.reduce((sum, p) => sum + p.total_points, 0);
  const lastWeekTotal = players.reduce((sum, p) => sum + p.last_week_points, 0);
  const currentRatio = formatRatio(totalPoints, initialBudget);

  const getPointsIcon = (points: number) => {
    if (points > 0) return <TrendingUp className="w-4 h-4 text-green-400" />;
    if (points < 0) return <TrendingDown className="w-4 h-4 text-red-400" />;
    return <Minus className="w-4 h-4 text-gray-400" />;
  };

  const getPositionColor = (position: string) => {
    if (position === 'Goalkeeper') return 'bg-yellow-500/20 text-yellow-300 border-yellow-400/30';
    if (['Centre-Back', 'Left-Back', 'Right-Back'].includes(position)) return 'bg-blue-500/20 text-blue-300 border-blue-400/30';
    if (['Defensive Midfield', 'Central Midfield', 'Attacking Midfield', 'Left Midfield', 'Right Midfield'].includes(position)) return 'bg-green-500/20 text-green-300 border-green-400/30';
    return 'bg-red-500/20 text-red-300 border-red-400/30';
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
      <div className="absolute inset-0 flex items-center justify-center opacity-20 pointer-events-none">
        <img
          src="/My_Team.png"
          alt="Background"
          className="max-w-3xl w-full h-auto object-contain"
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

          <div className="flex items-center gap-3">
            <img
              src="/My_Team.png"
              alt="My Team"
              className="w-20 h-20 object-contain drop-shadow-2xl"
            />
          </div>

          <button
            onClick={onComplete}
            className="p-2 bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 text-green-300 rounded-lg transition-colors"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 pb-8 relative z-10">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">{getTranslation('screens.myTeam', language)}</h1>

          <div className="flex justify-center gap-4 mb-6">
            {initialBudget > 0 && (
              <div className="bg-purple-500/20 backdrop-blur-md border border-purple-400/50 rounded-xl py-4 px-6">
                <div className="text-purple-200 text-sm mb-1">Current Ratio</div>
                <div className="text-3xl font-bold text-white">{currentRatio}</div>
              </div>
            )}
            <div className="bg-cyan-500/20 backdrop-blur-md border border-cyan-400/50 rounded-xl py-4 px-6">
              <div className="text-cyan-200 text-sm mb-1">{getTranslation('screens.totalPoints', language)}</div>
              <div className="text-3xl font-bold text-white">{totalPoints.toFixed(1)}</div>
            </div>
            <div className="bg-green-500/20 backdrop-blur-md border border-green-400/50 rounded-xl py-4 px-6">
              <div className="text-green-200 text-sm mb-1">{getTranslation('screens.weeklyPoints', language)}</div>
              <div className="text-3xl font-bold text-white">{lastWeekTotal.toFixed(1)}</div>
            </div>
          </div>
        </div>

        <div className="bg-black/30 backdrop-blur-md border border-cyan-400/30 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-cyan-500/20 border-b border-cyan-400/30">
                  <th className="px-4 py-3 text-left text-sm font-bold text-cyan-300">#</th>
                  <th className="px-4 py-3 text-left text-sm font-bold text-cyan-300">{getTranslation('common.player', language)}</th>
                  <th
                    className="px-4 py-3 text-left text-sm font-bold text-cyan-300 cursor-pointer hover:text-cyan-100 transition-colors"
                    onClick={() => handleSort('position')}
                  >
                    <div className="flex items-center gap-1">
                      {getTranslation('screens.position', language)}
                      {sortBy === 'position' && (
                        <span className="text-xs">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-bold text-cyan-300">{getTranslation('common.team', language)}</th>
                  <th
                    className="px-4 py-3 text-center text-sm font-bold text-cyan-300 cursor-pointer hover:text-cyan-100 transition-colors"
                    onClick={() => handleSort('total')}
                  >
                    <div className="flex items-center justify-center gap-1">
                      {getTranslation('screens.totalPoints', language)}
                      {sortBy === 'total' && (
                        <span className="text-xs">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  <th
                    className="px-4 py-3 text-center text-sm font-bold text-cyan-300 cursor-pointer hover:text-cyan-100 transition-colors"
                    onClick={() => handleSort('weekly')}
                  >
                    <div className="flex items-center justify-center gap-1">
                      {getTranslation('screens.weeklyPoints', language)}
                      {sortBy === 'weekly' && (
                        <span className="text-xs">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-bold text-cyan-300">Custo/pt</th>
                </tr>
              </thead>
              <tbody>
                {sortedPlayers.map((player, index) => (
                  <tr
                    key={player.id}
                    className="border-b border-cyan-400/10 hover:bg-cyan-500/10 transition-colors"
                  >
                    <td className="px-4 py-4 text-cyan-100 font-semibold">{index + 1}</td>
                    <td className="px-4 py-4">
                      <div className="text-white font-semibold">{player.name}</div>
                      <div className="text-xs text-cyan-200">€{(player.value / 1000000).toFixed(1)}M</div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-semibold border ${getPositionColor(player.position)}`}>
                        {player.position}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-cyan-100">{player.club}</div>
                      <div className="text-xs text-cyan-300">{player.league}</div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <div className="text-2xl font-bold text-white">{player.total_points.toFixed(1)}</div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-center gap-2">
                        {getPointsIcon(player.last_week_points)}
                        <span className={`text-xl font-bold ${
                          player.last_week_points > 0 ? 'text-green-400' :
                          player.last_week_points < 0 ? 'text-red-400' :
                          'text-gray-400'
                        }`}>
                          {player.last_week_points > 0 ? '+' : ''}{player.last_week_points.toFixed(1)}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      {player.cost_per_point !== undefined && player.cost_per_point > 0 ? (
                        <div className="text-lg font-bold text-cyan-100">
                          €{Math.round(player.cost_per_point).toLocaleString()}
                        </div>
                      ) : (
                        <div className="text-sm text-cyan-300/70">—</div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {players.length === 0 && (
            <div className="text-center py-12">
              <p className="text-cyan-300 text-lg">No players selected yet</p>
            </div>
          )}
        </div>

        <div className="mt-6 text-center text-cyan-200 text-sm">
          <p>Points are updated after each matchday</p>
        </div>
      </div>
    </div>
  );
}
