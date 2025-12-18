import { useState, useEffect } from 'react';
import { Trophy, TrendingUp, ChevronLeft, Medal } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useLanguage } from '../lib/LanguageContext';
import { getTranslation } from '../lib/translations';

interface LeaderboardProps {
  onBack?: () => void;
  showTopPlayers?: boolean;
}

interface LeaderboardEntry {
  userId: string;
  userEmail: string;
  remainingBudget: number;
  usefulPoints: number;
  currentRatio: number | null;
  position: number;
}

function Leaderboard({ onBack, showTopPlayers = false }: LeaderboardProps) {
  const { language } = useLanguage();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    try {
      const [profilesResponse, usefulTotalsResponse, appUsersResponse] = await Promise.all([
        supabase
          .from('user_profiles')
          .select('id, remaining_budget, username, is_admin'),
        supabase
          .from('user_useful_points_totals')
          .select('user_id, useful_points'),
        supabase
          .from('app_users')
          .select('id, email, name')
      ]);

      const profiles = profilesResponse.data || [];
      const usefulTotals = usefulTotalsResponse.data || [];
      const appUsers = appUsersResponse.data || [];

      if (profiles.length > 0) {
        const userMetaById = appUsers.reduce<Record<string, { email?: string | null; name?: string | null }>>((acc, user) => {
          acc[user.id] = { email: user.email, name: user.name };
          return acc;
        }, {});

        const usefulPointsByUser = usefulTotals.reduce<Record<string, number>>((acc, row) => {
          acc[row.user_id] = Number(row.useful_points) || 0;
          return acc;
        }, {});

        const leaderboardData: LeaderboardEntry[] = profiles
          .map(profile => {
            const remainingBudget = Number(profile.remaining_budget) || 0;
            const usefulPoints = usefulPointsByUser[profile.id] || 0;
            const currentRatio = usefulPoints > 0 ? remainingBudget / usefulPoints : null;
            const meta = userMetaById[profile.id];
            const fallbackName =
              profile.id === 'ee0ca527-b03c-459f-92fd-4d4a9d129faa' && profile.is_admin
                ? 'GiniusMind'
                : `User ${profile.id.slice(0, 6)}`;

            const displayName =
              profile.username ||
              meta?.name ||
              meta?.email ||
              fallbackName;

            return {
              userId: profile.id,
              userEmail: displayName,
              remainingBudget,
              usefulPoints,
              currentRatio
            };
          })
          .sort((a, b) => {
            const ratioA = entryRatioValue(a.currentRatio);
            const ratioB = entryRatioValue(b.currentRatio);

            if (ratioA === ratioB) {
              return a.remainingBudget - b.remainingBudget;
            }

            return ratioA - ratioB;
          })
          .map((entry, index) => ({
            ...entry,
            position: index + 1
          }));

        setEntries(leaderboardData);
      }
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const entryRatioValue = (ratio: number | null) =>
    ratio === null || ratio === undefined ? Infinity : ratio;

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
      <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
        <img
          src="/Leader_board.png"
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
              src="/Leader_board.png"
              alt="Leaderboard"
              className="w-20 h-20 object-contain drop-shadow-2xl"
            />
          </div>

          <div className="w-10"></div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 pb-12 relative z-10">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-3">
            <Trophy className="w-12 h-12 text-yellow-400" />
            <h1 className="text-5xl font-bold text-white">{getTranslation('screens.leaderboard', language)}</h1>
          </div>
          <p className="text-cyan-200 text-lg">Ranked by current ratio (budget ÷ PtsTU)</p>
          <p className="text-cyan-300 text-sm mt-1">Lower current ratio = better ranking</p>
        </div>

        {entries.length === 0 ? (
          <div className="bg-black/40 backdrop-blur-md border border-cyan-400/30 rounded-xl p-12 text-center">
            <TrendingUp className="w-16 h-16 text-cyan-400 mx-auto mb-4 opacity-50" />
            <h2 className="text-2xl font-bold text-white mb-2">No Rankings Yet</h2>
            <p className="text-cyan-200">Rankings will appear once players start earning points</p>
          </div>
        ) : (
          <div className="bg-black/40 backdrop-blur-md border border-cyan-400/30 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-cyan-500/20 border-b border-cyan-400/30">
                    <th className="px-6 py-4 text-left text-cyan-300 font-bold">{getTranslation('screens.rank', language)}</th>
                    <th className="px-6 py-4 text-left text-cyan-300 font-bold">{getTranslation('screens.manager', language)}</th>
                    <th className="px-6 py-4 text-right text-cyan-300 font-bold">{getTranslation('screens.budget', language)}</th>
                    <th className="px-6 py-4 text-right text-cyan-300 font-bold">{getTranslation('screens.usefulPoints', language)}</th>
                    <th className="px-6 py-4 text-right text-cyan-300 font-bold">{getTranslation('screens.currentRatio', language)}</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry, index) => (
                    <tr
                      key={entry.userId}
                      className={`border-b border-cyan-400/10 transition-colors ${
                        entry.position <= 3
                          ? 'bg-gradient-to-r from-yellow-500/10 to-transparent hover:from-yellow-500/20'
                          : 'hover:bg-cyan-500/10'
                      }`}
                    >
                      <td className="px-6 py-4">
                        {getPositionBadge(entry.position)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-green-400 rounded-full flex items-center justify-center">
                            <span className="text-black font-bold">
                              {entry.userEmail.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <span className="text-white font-medium">{entry.userEmail}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-cyan-200 font-mono">
                          €{entry.remainingBudget.toLocaleString('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-green-300 font-bold text-lg">
                          {entry.usefulPoints}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="inline-block bg-cyan-500/20 border border-cyan-400/30 rounded-lg px-3 py-1">
                          <span className="text-cyan-100 font-bold">
                            {entry.currentRatio === null ? '—' : `${entry.currentRatio.toFixed(2)} €`}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="mt-8 bg-black/40 backdrop-blur-md border border-cyan-400/30 rounded-xl p-6">
          <h3 className="text-xl font-bold text-white mb-3">How Rankings Work</h3>
          <ul className="space-y-2 text-cyan-200">
            <li className="flex items-start gap-2">
              <span className="text-cyan-400 mt-1">•</span>
              <span>Rankings are calculated by dividing your remaining budget by total PtsTU</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-cyan-400 mt-1">•</span>
              <span>Lower current ratio means better value and higher ranking</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-cyan-400 mt-1">•</span>
              <span>In case of a tie, the user with the lower remaining budget ranks higher</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-cyan-400 mt-1">•</span>
              <span>All managers appear, even if they still have 0 PtsTU</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default Leaderboard;
