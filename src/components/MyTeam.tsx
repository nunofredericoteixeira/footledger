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
  total_points_useful: number;
  weekly_points_useful: number;
  cost_per_point_useful?: number;
}

interface AuctionRosterPlayer {
  winId: string;
  name: string;
  league: string;
  club: string;
  position: string;
  value: number;
  usefulPoints: number;
  wonAt?: string | null;
}

interface MyTeamProps {
  userId: string;
  onComplete: () => void;
  onBack?: () => void;
}

export default function MyTeam({ userId, onComplete, onBack }: MyTeamProps) {
  const { language } = useLanguage();
  const [players, setPlayers] = useState<PlayerWithPoints[]>([]);
  const [auctionPlayers, setAuctionPlayers] = useState<AuctionRosterPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'total' | 'weekly' | 'position'>('position');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [initialBudget, setInitialBudget] = useState(0);
  const [markingWin, setMarkingWin] = useState<string | null>(null);
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

  const formatAuctionDate = (wonAt?: string | null) => {
    if (!wonAt) return null;
    const date = new Date(wonAt);
    if (Number.isNaN(date.getTime())) return null;
    return date.toLocaleDateString(language === 'pt' ? 'pt-PT' : 'en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatAuctionWeek = (wonAt?: string | null) => {
    if (!wonAt) return null;
    const date = new Date(wonAt);
    if (Number.isNaN(date.getTime())) return null;
    const start = new Date(date);
    const day = start.getDay();
    const distanceToMonday = (day + 6) % 7;
    start.setDate(start.getDate() - distanceToMonday);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);

    const formatter = new Intl.DateTimeFormat(language === 'pt' ? 'pt-PT' : 'en-US', {
      day: '2-digit',
      month: 'short'
    });
    return `${formatter.format(start)} - ${formatter.format(end)}`;
  };

  useEffect(() => {
    loadPlayerPoints();
  }, [userId]);

  const loadPlayerPoints = async () => {
    try {
      await supabase.rpc('sync_auction_wins');

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

      const playerIds = userSelections?.map(s => s.player_id) || [];

      let playersData: Player[] | null = null;
      let totalsData:
        | {
            player_id: string;
            total_points: number;
            last_week_points: number;
            useful_total_points: number;
            useful_week_points: number;
          }[]
        | null = null;

      if (playerIds.length > 0) {
        const playersResponse = await supabase
          .from('player_pool')
          .select('*')
          .in('id', playerIds);
        playersData = playersResponse.data;

        const totalsResponse = await supabase
          .from('user_player_total_points')
          .select('player_id, total_points, last_week_points, useful_total_points, useful_week_points')
          .eq('user_id', userId)
          .in('player_id', playerIds);
        totalsData = totalsResponse.data;
      } else {
        setPlayers([]);
      }

      const totalsMap = (totalsData || []).reduce((acc, row) => {
        acc[row.player_id] = {
          total_points: row.total_points ?? 0,
          last_week_points: row.last_week_points ?? 0,
          useful_total_points: row.useful_total_points ?? 0,
          useful_week_points: row.useful_week_points ?? 0
        };
        return acc;
      }, {} as Record<string, { total_points: number; last_week_points: number; useful_total_points: number; useful_week_points: number }>);

      if (playersData) {
        const playersWithPoints: PlayerWithPoints[] = playersData.map(player => {
          const totals = totalsMap[player.id] || {
            total_points: 0,
            last_week_points: 0,
            useful_total_points: 0,
            useful_week_points: 0
          };
          const costPerPointUseful = totals.useful_total_points > 0 ? player.value / totals.useful_total_points : undefined;
          return {
            ...player,
            total_points: totals.total_points,
            last_week_points: totals.last_week_points,
            total_points_useful: totals.useful_total_points,
            weekly_points_useful: totals.useful_week_points,
            cost_per_point_useful: costPerPointUseful
          };
        });

        setPlayers(playersWithPoints);
      }

      const { data: auctionPoints } = await supabase
        .from('user_auction_useful_points')
        .select('win_id, useful_points, player_name, position, club, league, player_value, won_at')
        .eq('user_id', userId)
        .order('won_at', { ascending: false });

      const rosterAuctionPlayers: AuctionRosterPlayer[] = (auctionPoints || []).map(row => ({
        winId: row.win_id,
        name: row.player_name,
        league: row.league || '',
        club: row.club || '',
        position: row.position || 'N/A',
        value: Number(row.player_value) || 0,
        usefulPoints: Number(row.useful_points) || 0,
        wonAt: row.won_at
      }));

      setAuctionPlayers(rosterAuctionPlayers);
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
      return (a.total_points_useful - b.total_points_useful) * multiplier;
    } else {
      return (a.weekly_points_useful - b.weekly_points_useful) * multiplier;
    }
  });

  const totalPoints = players.reduce((sum, p) => sum + p.total_points, 0);
  const lastWeekTotal = players.reduce((sum, p) => sum + p.last_week_points, 0);
  const totalUseful = players.reduce((sum, p) => sum + p.total_points_useful, 0);
  const weeklyUseful = players.reduce((sum, p) => sum + p.weekly_points_useful, 0);
  const totalAuctionUseful = auctionPlayers.reduce((sum, p) => sum + p.usefulPoints, 0);
  const combinedUseful = totalUseful + totalAuctionUseful;
  const currentRatio = formatRatio(combinedUseful, initialBudget);

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

  const handleMarkAuctionPlayerUsed = async (winId: string) => {
    setMarkingWin(winId);
    try {
      await supabase
        .from('user_auction_wins')
        .update({
          is_used: true,
          used_in_week: new Date().toISOString().slice(0, 10)
        })
        .eq('id', winId)
        .eq('user_id', userId);
      await loadPlayerPoints();
    } catch (error) {
      console.error('Failed to mark auction player as used:', error);
    } finally {
      setMarkingWin(null);
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

          <div className="flex flex-wrap justify-center gap-4 mb-6">
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
            <div className="bg-amber-500/20 backdrop-blur-md border border-amber-400/50 rounded-xl py-4 px-6">
              <div className="text-amber-200 text-sm mb-1">PtsT úteis</div>
              <div className="text-3xl font-bold text-white">{totalUseful.toFixed(1)}</div>
            </div>
            {auctionPlayers.length > 0 && (
              <div className="bg-pink-500/20 backdrop-blur-md border border-pink-400/50 rounded-xl py-4 px-6">
                <div className="text-pink-200 text-sm mb-1">PtsTU Leiloados</div>
                <div className="text-3xl font-bold text-white">{totalAuctionUseful.toFixed(1)}</div>
              </div>
            )}
            <div className="bg-green-500/20 backdrop-blur-md border border-green-400/50 rounded-xl py-4 px-6">
              <div className="text-green-200 text-sm mb-1">{getTranslation('screens.weeklyPoints', language)}</div>
              <div className="text-3xl font-bold text-white">{lastWeekTotal.toFixed(1)}</div>
            </div>
            <div className="bg-amber-500/20 backdrop-blur-md border border-amber-400/50 rounded-xl py-4 px-6">
              <div className="text-amber-200 text-sm mb-1">PtsS úteis</div>
              <div className="text-3xl font-bold text-white">{weeklyUseful.toFixed(1)}</div>
            </div>
            {auctionPlayers.length > 0 && (
              <div className="bg-indigo-500/20 backdrop-blur-md border border-indigo-400/50 rounded-xl py-4 px-6">
                <div className="text-indigo-200 text-sm mb-1">PtsTU Total</div>
                <div className="text-3xl font-bold text-white">{combinedUseful.toFixed(1)}</div>
              </div>
            )}
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
                  <th className="px-4 py-3 text-center text-sm font-bold text-cyan-300">PtsT</th>
                  <th className="px-4 py-3 text-center text-sm font-bold text-cyan-300">PtsTU</th>
                  <th className="px-4 py-3 text-center text-sm font-bold text-cyan-300">PtsS</th>
                  <th className="px-4 py-3 text-center text-sm font-bold text-cyan-300">PtsSU</th>
                  <th className="px-4 py-3 text-center text-sm font-bold text-cyan-300">Custo/pt útil</th>
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
                    <td className="px-4 py-4 text-center text-white font-bold">{player.total_points.toFixed(1)}</td>
                    <td className="px-4 py-4 text-center text-white font-bold">{player.total_points_useful.toFixed(1)}</td>
                    <td className="px-4 py-4 text-center text-white font-bold">
                      {player.last_week_points > 0 ? `+${player.last_week_points.toFixed(1)}` : player.last_week_points.toFixed(1)}
                    </td>
                    <td className="px-4 py-4 text-center text-white font-bold">
                      {player.weekly_points_useful > 0 ? `+${player.weekly_points_useful.toFixed(1)}` : player.weekly_points_useful.toFixed(1)}
                    </td>
                    <td className="px-4 py-4 text-center">
                      {player.cost_per_point_useful !== undefined && player.cost_per_point_useful > 0 ? (
                        <div className="text-lg font-bold text-cyan-100">
                          €{Math.round(player.cost_per_point_useful).toLocaleString()}
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

        <div className="mt-10">
          <div className="bg-black/40 backdrop-blur-md border border-purple-400/40 rounded-2xl p-6">
            <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
              <div>
                <h2 className="text-2xl font-bold text-white">
                  {getTranslation('screens.auctionedPlayers', language)}
                </h2>
                <p className="text-purple-200 text-sm">
                  {getTranslation('screens.auctionedPlayersInfo', language)}
                </p>
              </div>
            </div>

            {auctionPlayers.length === 0 ? (
              <p className="text-purple-200">{getTranslation('screens.noAuctionedPlayers', language)}</p>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {auctionPlayers.map((player) => (
                  <div
                    key={player.winId}
                    className="p-4 border border-purple-400/30 rounded-xl bg-purple-500/10 flex flex-col gap-3"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white font-semibold text-lg">{player.name}</p>
                        <p className="text-sm text-purple-200">{player.position} • {player.club}</p>
                        {player.wonAt && (
                          <p className="text-xs text-purple-300 mt-1">
                            {formatAuctionWeek(player.wonAt)
                              ? `Semana do leilão: ${formatAuctionWeek(player.wonAt)}`
                              : formatAuctionDate(player.wonAt)}
                          </p>
                        )}
                        {player.wonAt && (
                          <p className="text-xs text-purple-300">
                            {formatAuctionDate(player.wonAt)}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-purple-300">PtsTU</p>
                        <p className="text-2xl font-bold text-white">{player.usefulPoints.toFixed(1)}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm text-purple-200">
                      <span>{player.league}</span>
                      <span>€{Math.round(player.value).toLocaleString()}</span>
                    </div>
                    <button
                      onClick={() => handleMarkAuctionPlayerUsed(player.winId)}
                      disabled={markingWin === player.winId}
                      className="mt-2 w-full px-4 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {markingWin === player.winId
                        ? 'A atualizar...'
                        : getTranslation('screens.markAsUsed', language)}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
