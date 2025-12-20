import { useState, useEffect, useMemo } from 'react';
import { Check, Lock } from 'lucide-react';
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
  const [initialTeamId, setInitialTeamId] = useState<string | null>(null);
  const [playersLocked, setPlayersLocked] = useState(false);

  const teamLocked = initialTeamId !== null;

  useEffect(() => {
    loadProfile();
    loadTeams();
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
        setInitialTeamId(data.selected_team_id);
        setSelectedTeamId(data.selected_team_id);
        setPlayersLocked(!!data.players_locked);
      } else {
        setInitialTeamId(null);
        setSelectedTeamId(null);
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
    if (teamLocked || playersLocked) {
      setError(getTranslation('dashboard.teamLockedMessage', language));
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
      setInitialTeamId(selectedTeamId);
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

  const lockMessage = teamLocked
    ? getTranslation('dashboard.teamLockedMessage', language)
    : getTranslation('dashboard.squadLockedMessage', language);

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

            {(teamLocked || playersLocked) && (
              <div className="mb-6 bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <Lock className="w-6 h-6 text-yellow-400" />
                  <div>
                    <div className="text-yellow-400 font-bold">Team Selection Locked</div>
                    <div className="text-yellow-200 text-sm">{lockMessage}</div>
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
                        onClick={() => {
                          if (!teamLocked && !playersLocked) {
                            setSelectedTeamId(team.id);
                          }
                        }}
                        className={`flex items-center justify-between p-4 rounded-lg transition-all ${
                          selectedTeamId === team.id
                            ? 'bg-cyan-500/20 border-2 border-cyan-400'
                            : 'bg-blue-800/50 hover:bg-blue-800 border border-cyan-500/20 cursor-pointer'
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
                          <div>
                            <p className="text-white font-semibold text-lg">{team.name}</p>
                            <p className="text-cyan-200 text-sm">{team.league}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-white font-bold">{formatValue(Number(team.team_value) || 0)}</p>
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
                  disabled={saving || !selectedTeamId || teamLocked || playersLocked}
                  className="w-full py-4 px-4 bg-cyan-400 text-blue-900 rounded-lg hover:bg-cyan-300 transition-all shadow-lg hover:shadow-2xl disabled:bg-gray-600 disabled:cursor-not-allowed font-bold text-lg flex items-center justify-center gap-2"
                >
                  {saving ? (
                    'Saving...'
                  ) : (teamLocked || playersLocked) ? (
                    <>
                      <Lock className="w-5 h-5" />
                      Locked
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
    </div>
  );
}
