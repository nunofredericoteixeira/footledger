import { useState, useEffect, useMemo } from 'react';
import { Check, Filter, Lock } from 'lucide-react';
import { supabase, type Team } from '../lib/supabase';
import { useLanguage } from '../lib/LanguageContext';
import { getTranslation } from '../lib/translations';

interface PickTeamProps {
  userId: string;
  onComplete: () => void;
}

export default function PickTeam({ userId, onComplete }: PickTeamProps) {
  const { language } = useLanguage();
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [leagueFilter, setLeagueFilter] = useState<string>('all');
  const [teamFilter, setTeamFilter] = useState<string>('');
  const [valueFilter, setValueFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [playersLocked, setPlayersLocked] = useState(false);

  useEffect(() => {
    loadTeams();
  }, []);

  useEffect(() => {
    loadProfile();
  }, [userId]);

  const loadProfile = async () => {
    try {
      const { data, error: profileError } = await supabase
        .from('user_profiles')
        .select('selected_team_id, players_locked')
        .eq('id', userId)
        .maybeSingle();

      if (profileError) throw profileError;

      if (data) {
        setSelectedTeamId(data.selected_team_id);
        setPlayersLocked(!!data.players_locked);
      } else {
        setPlayersLocked(false);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load your current team selection');
    }
  };

  const loadTeams = async () => {
    setLoading(true);
    try {
      const { data, error: fetchError } = await supabase
        .from('teams')
        .select('*')
        .order('team_value', { ascending: false });

      if (fetchError) throw fetchError;

      setTeams(data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load teams');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (playersLocked) {
      setError('Team selection is locked after finalizing your squad.');
      return;
    }

    if (!selectedTeamId) {
      setError('Please select a team');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const selectedTeam = teams.find(t => t.id === selectedTeamId);
      const teamValue = selectedTeam?.team_value || 0;

      await supabase
        .from('user_player_selections')
        .delete()
        .eq('user_id', userId);

      const { error: upsertError } = await supabase
        .from('user_profiles')
        .upsert({
          id: userId,
          selected_team_id: selectedTeamId,
          team_value: teamValue,
          remaining_budget: teamValue,
          players_locked: false,
        }, {
          onConflict: 'id'
        });

      if (upsertError) throw upsertError;

      setSuccess(true);
      setTimeout(() => {
        onComplete();
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to save team selection');
    } finally {
      setSaving(false);
    }
  };

  const leagues = useMemo(() => {
    const uniqueLeagues = [...new Set(teams.map(t => t.league).filter(Boolean))];
    return uniqueLeagues.sort();
  }, [teams]);

  const filteredTeams = useMemo(() => {
    return teams.filter(team => {
      const matchesLeague = leagueFilter === 'all' || (team.league && team.league === leagueFilter);
      const matchesTeam = teamFilter === '' || (team.name && team.name.toLowerCase().includes(teamFilter.toLowerCase()));

      let matchesValue = true;
      if (valueFilter !== 'all') {
        const value = Number(team.team_value) || 0;
        switch (valueFilter) {
          case 'over1b':
            matchesValue = value >= 1000000000;
            break;
          case '500m-1b':
            matchesValue = value >= 500000000 && value < 1000000000;
            break;
          case '200m-500m':
            matchesValue = value >= 200000000 && value < 500000000;
            break;
          case 'under200m':
            matchesValue = value < 200000000;
            break;
        }
      }

      return matchesLeague && matchesTeam && matchesValue;
    });
  }, [teams, leagueFilter, teamFilter, valueFilter]);

  const formatValue = (value: number) => {
    if (value >= 1000000000) {
      return `€${(value / 1000000000).toFixed(2)}B`;
    } else if (value >= 1000000) {
      return `€${(value / 1000000).toFixed(0)}M`;
    }
    return `€${value.toLocaleString()}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-cyan-600 to-green-500">
      <div className="bg-gradient-to-b from-black to-transparent py-6 px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-center">
          <img
            src="/Pick_Your_Team.png"
            alt="Pick Your Team"
            className="w-20 h-20 object-contain"
          />
        </div>
      </div>

      <div className="flex items-center justify-center px-4 pb-8">
        <div className="w-full max-w-5xl">
        <div className="bg-black/40 backdrop-blur-md rounded-2xl shadow-2xl p-8 border border-cyan-400/30">
          <div className="text-center mb-8">
            <h2 className="text-4xl font-bold text-white mb-2">Pick a Team</h2>
            <p className="text-cyan-200">Choose your team to get started</p>
          </div>

          {playersLocked && (
            <div className="mb-6 bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <Lock className="w-6 h-6 text-yellow-400" />
                <div>
                  <div className="text-yellow-400 font-bold">Team Selection Locked</div>
                  <div className="text-yellow-200 text-sm">You finalized your 23-player squad, so team changes are closed.</div>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-cyan-200 mb-2">
                Liga
              </label>
              <select
                value={leagueFilter}
                onChange={(e) => setLeagueFilter(e.target.value)}
                className="w-full px-4 py-3 bg-blue-900 border border-cyan-500/30 text-white rounded-lg focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition-all"
              >
                <option value="all">All Leagues</option>
                {leagues.map(league => (
                  <option key={league} value={league}>{league}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-cyan-200 mb-2">
                Equipa
              </label>
              <input
                type="text"
                value={teamFilter}
                onChange={(e) => setTeamFilter(e.target.value)}
                placeholder="Search team name..."
                className="w-full px-4 py-3 bg-blue-900 border border-cyan-500/30 text-white rounded-lg focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-cyan-200 mb-2">
                Valor
              </label>
              <select
                value={valueFilter}
                onChange={(e) => setValueFilter(e.target.value)}
                className="w-full px-4 py-3 bg-blue-900 border border-cyan-500/30 text-white rounded-lg focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition-all"
              >
                <option value="all">All Values</option>
                <option value="over1b">Over €1B</option>
                <option value="500m-1b">€500M - €1B</option>
                <option value="200m-500m">€200M - €500M</option>
                <option value="under200m">Under €200M</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400"></div>
            </div>
          ) : (
            <>
              <div className="bg-blue-900/50 rounded-lg p-4 mb-4">
                <p className="text-cyan-200 text-sm">
                  Showing {filteredTeams.length} of {teams.length} teams
                  {selectedTeamId && (
                    <span className="ml-2 text-cyan-300 font-semibold">
                      • {teams.find(t => t.id === selectedTeamId)?.name} selected
                    </span>
                  )}
                </p>
              </div>

              <div className="max-h-96 overflow-y-auto space-y-2 mb-6 custom-scrollbar">
                {filteredTeams.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-cyan-200">No teams found with selected filters</p>
                  </div>
                ) : (
                  filteredTeams.map((team) => (
                    <div
                      key={team.id}
                      onClick={() => setSelectedTeamId(team.id)}
                      className={`flex items-center justify-between p-4 rounded-lg transition-all cursor-pointer ${
                        selectedTeamId === team.id
                          ? 'bg-cyan-500/20 border-2 border-cyan-400'
                          : 'bg-blue-800/50 hover:bg-blue-800 border border-cyan-500/20'
                      }`}
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-all ${
                          selectedTeamId === team.id
                            ? 'bg-cyan-400 border-cyan-400'
                            : 'border-cyan-500/50'
                        }`}>
                          {selectedTeamId === team.id && (
                            <Check className="w-4 h-4 text-blue-900" />
                          )}
                        </div>

                        {team.logo_url ? (
                          <img
                            src={team.logo_url}
                            alt={team.name}
                            className="w-10 h-10 object-contain"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-cyan-500/20 rounded-lg flex items-center justify-center">
                            <span className="text-lg font-bold text-cyan-300">
                              {team.name.charAt(0)}
                            </span>
                          </div>
                        )}

                        <div className="flex-1">
                          <p className="font-bold text-lg text-white">{team.name}</p>
                          <div className="flex items-center gap-3 mt-1">
                            {team.league && (
                              <span className="text-sm text-cyan-300">
                                {team.league}
                              </span>
                            )}
                          </div>
                        </div>

                        {team.team_value > 0 && (
                          <div className="text-right">
                            <div className="text-xs text-cyan-300 mb-1">Budget</div>
                            <div className="text-2xl font-bold text-cyan-400">
                              {formatValue(team.team_value)}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {error && (
                <div className="bg-red-500/20 border border-red-500 text-red-200 px-4 py-3 rounded-lg text-sm mb-4">
                  {error}
                </div>
              )}

              {success && (
                <div className="bg-green-500/20 border border-green-500 text-green-200 px-4 py-3 rounded-lg text-sm mb-4 flex items-center gap-2">
                  <Check className="w-5 h-5" />
                  Team saved successfully! Redirecting...
                </div>
              )}

              <button
                onClick={handleSave}
                disabled={saving || !selectedTeamId || playersLocked}
                className="w-full py-4 px-4 bg-cyan-400 text-blue-900 rounded-lg hover:bg-cyan-300 transition-all shadow-lg hover:shadow-2xl disabled:bg-gray-600 disabled:cursor-not-allowed font-bold text-lg flex items-center justify-center gap-2"
              >
                {saving ? (
                  'Saving...'
                ) : playersLocked ? (
                  <>
                    <Lock className="w-5 h-5" />
                    Squad Locked
                  </>
                ) : (
                  <>
                    <Check className="w-5 h-5" />
                    Confirm Selection
                  </>
                )}
              </button>
            </>
          )}
        </div>
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(30, 58, 138, 0.3);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(34, 211, 238, 0.5);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(34, 211, 238, 0.7);
        }
      `}</style>
    </div>
  );
}
