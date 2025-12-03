import { useState, useEffect, useMemo } from 'react';
import { Check, Lock, X, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase, type PositionGroup } from '../lib/supabase';

interface Player {
  id: string;
  name: string;
  league: string;
  club: string;
  position: string;
  value: number;
}

interface PickPlayersProps {
  userId: string;
  teamValue: number;
  onComplete: () => void;
  onBack?: () => void;
}

const POSITION_SHORT_MAP: Record<string, string> = {
  'Goalkeeper': 'GK',
  'Centre-Back': 'CB',
  'Left-Back': 'LB',
  'Right-Back': 'RB',
  'Defensive Midfield': 'DM',
  'Central Midfield': 'CM',
  'Attacking Midfield': 'AM',
  'Left Midfield': 'LM',
  'Right Midfield': 'RM',
  'Left Winger': 'LW',
  'Right Winger': 'RW',
  'Centre-Forward': 'CF',
  'Second Striker': 'SS',
};

const POSITION_EMOJI_MAP: Record<string, string> = {
  'GK': '🧤',
  'CB': '🛡️',
  'LB': '⬅️',
  'RB': '➡️',
  'DM': '🔒',
  'CM': '⚙️',
  'AM': '✨',
  'LM': '↖️',
  'RM': '↗️',
  'LW': '⚡',
  'RW': '💫',
  'CF': '⚽',
  'SS': '🎯',
};

export default function PickPlayersFlexible({ userId, teamValue, onComplete, onBack }: PickPlayersProps) {
  const [allPlayers, setAllPlayers] = useState<Player[]>([]);
  const [selectedPlayers, setSelectedPlayers] = useState<Player[]>([]);
  const [initialBudget, setInitialBudget] = useState(teamValue);
  const [remainingBudget, setRemainingBudget] = useState(teamValue);
  const [loading, setLoading] = useState(true);
  const [isLocked, setIsLocked] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [positionGroups, setPositionGroups] = useState<Record<string, PositionGroup> | null>(null);
  const [hasTactic, setHasTactic] = useState(false);

  useEffect(() => {
    checkTacticSelection();
    loadPlayers();
    loadUserSelections();
  }, [userId]);

  useEffect(() => {
    // Keep local budget in sync if parent updates the team value (e.g. after team selection).
    setInitialBudget(teamValue);
    if (selectedPlayers.length === 0) {
      setRemainingBudget(teamValue);
    }
  }, [teamValue, selectedPlayers.length]);

  const checkTacticSelection = async () => {
    const { data } = await supabase
      .from('user_tactic_selection')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    setHasTactic(!!data);
  };

  const loadPlayers = async () => {
    setLoading(true);
    try {
      let allData: Player[] = [];
      let from = 0;
      const pageSize = 1000;
      let hasMore = true;

      while (hasMore) {
        const { data, error } = await supabase
          .from('player_pool')
          .select('*')
          .order('value', { ascending: false })
          .range(from, from + pageSize - 1);

        if (error) throw error;

        if (data && data.length > 0) {
          allData = [...allData, ...data];
          from += pageSize;
          hasMore = data.length === pageSize;
        } else {
          hasMore = false;
        }
      }

      setAllPlayers(allData);
    } catch (err) {
      console.error('Error loading players:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadUserSelections = async () => {
    try {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('team_value, players_locked, position_groups, selected_team_id')
        .eq('id', userId)
        .maybeSingle();

      console.log('Profile data:', profile);

      let resolvedBudget = profile?.team_value ?? teamValue;

      // Fallback to the selected team's value if the profile budget is missing.
      if ((!resolvedBudget || resolvedBudget === 0) && profile?.selected_team_id) {
        const { data: teamRow, error: teamError } = await supabase
          .from('teams')
          .select('team_value')
          .eq('id', profile.selected_team_id)
          .maybeSingle();

        if (!teamError && teamRow?.team_value) {
          resolvedBudget = teamRow.team_value;
        }
      }

      // As an absolute fallback, keep the prop value.
      if (!resolvedBudget) {
        resolvedBudget = teamValue;
      }

      if (profile) {
        setInitialBudget(resolvedBudget);
        setIsLocked(profile.players_locked || false);
        setPositionGroups(profile.position_groups);
        console.log('Position groups set to:', profile.position_groups);
      }

      const { data: selections } = await supabase
        .from('user_player_selections')
        .select('player_id')
        .eq('user_id', userId);

      if (selections && selections.length > 0) {
        const playerIds = selections.map(s => s.player_id);
        const { data: selectedPlayersData } = await supabase
          .from('player_pool')
          .select('*')
          .in('id', playerIds);

        if (selectedPlayersData) {
          setSelectedPlayers(selectedPlayersData);

          const totalSpent = selectedPlayersData.reduce((sum, p) => sum + p.value, 0);
          const remaining = resolvedBudget - totalSpent;
          setRemainingBudget(remaining);
          console.log('Budget calculation - Initial:', resolvedBudget, 'Spent:', totalSpent, 'Remaining:', remaining);
        }
      } else {
        setRemainingBudget(resolvedBudget);
      }
    } catch (err) {
      console.error('Error loading user selections:', err);
    }
  };

  const groupCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    if (!positionGroups) return counts;

    Object.keys(positionGroups).forEach(groupName => {
      const group = positionGroups[groupName];
      const groupPositions = group.positions.map(shortCode =>
        Object.keys(POSITION_SHORT_MAP).find(fullName => POSITION_SHORT_MAP[fullName] === shortCode)
      ).filter(Boolean);

      counts[groupName] = selectedPlayers.filter(p => groupPositions.includes(p.position)).length;
    });

    return counts;
  }, [selectedPlayers, positionGroups]);

  const totalRequired = useMemo(() => {
    if (!positionGroups) return 0;
    return Object.values(positionGroups).reduce((sum, group) => sum + group.count, 0);
  }, [positionGroups]);

  const isSquadValid = useMemo(() => {
    if (!positionGroups) return false;
    if (selectedPlayers.length !== totalRequired) return false;

    for (const [groupName, group] of Object.entries(positionGroups)) {
      if (groupCounts[groupName] !== group.count) {
        return false;
      }
    }
    return true;
  }, [selectedPlayers, groupCounts, positionGroups, totalRequired]);

  const openGroupModal = (groupName: string) => {
    if (isLocked) return;
    setSelectedGroup(groupName);
    setShowModal(true);
    setSearchQuery('');
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedGroup(null);
    setSearchQuery('');
  };

  const togglePlayerSelection = async (player: Player) => {
    if (!hasTactic) {
      alert('Please choose your tactical system first!');
      return;
    }

    if (isLocked || !positionGroups || !selectedGroup) return;

    const isSelected = selectedPlayers.some(p => p.id === player.id);

    if (isSelected) {
      try {
        await supabase
          .from('user_player_selections')
          .delete()
          .eq('user_id', userId)
          .eq('player_id', player.id);

        setSelectedPlayers(prev => prev.filter(p => p.id !== player.id));
        setRemainingBudget(remainingBudget + player.value);
      } catch (err) {
        console.error('Error removing player:', err);
      }
    } else {
      const groupCount = groupCounts[selectedGroup] || 0;
      const maxForGroup = positionGroups[selectedGroup]?.count || 0;

      if (groupCount >= maxForGroup) {
        alert(`You already have ${maxForGroup} player(s) in ${selectedGroup}!`);
        return;
      }

      if (player.value > remainingBudget) {
        alert('Not enough budget to select this player!');
        return;
      }

      try {
        await supabase
          .from('user_player_selections')
          .insert({
            user_id: userId,
            player_id: player.id,
          });

        setSelectedPlayers(prev => [...prev, player]);
        setRemainingBudget(remainingBudget - player.value);
      } catch (err) {
        console.error('Error adding player:', err);
      }
    }
  };

  const handleLockSquad = async () => {
    if (!isSquadValid) {
      alert(`Your squad is not complete! Please select exactly ${totalRequired} players with the required positions.`);
      return;
    }

    try {
      await supabase
        .from('user_profiles')
        .update({ players_locked: true })
        .eq('id', userId);

      setIsLocked(true);
      setSuccess(true);
      setTimeout(() => {
        onComplete();
      }, 1500);
    } catch (err) {
      console.error('Error locking squad:', err);
      alert('Failed to lock squad. Please try again.');
    }
  };

  const formatValue = (value: number) => {
    if (value >= 1000000000) {
      return `€${(value / 1000000000).toFixed(2)}B`;
    }
    if (value >= 1000000) {
      return `€${(value / 1000000).toFixed(1)}M`;
    }
    return `€${(value / 1000).toFixed(0)}K`;
  };

  const getPlayersForGroup = (groupName: string) => {
    if (!positionGroups) return [];
    const group = positionGroups[groupName];
    if (!group) return [];

    const allowedPositions = group.positions.map(shortCode =>
      Object.keys(POSITION_SHORT_MAP).find(fullName => POSITION_SHORT_MAP[fullName] === shortCode)
    ).filter(Boolean);

    return allPlayers.filter(p => allowedPositions.includes(p.position));
  };

  const getSelectedPlayersForGroup = (groupName: string) => {
    if (!positionGroups) return [];
    const group = positionGroups[groupName];
    if (!group) return [];

    const allowedPositions = group.positions.map(shortCode =>
      Object.keys(POSITION_SHORT_MAP).find(fullName => POSITION_SHORT_MAP[fullName] === shortCode)
    ).filter(Boolean);

    return selectedPlayers.filter(p => allowedPositions.includes(p.position));
  };

  const filteredModalPlayers = useMemo(() => {
    if (!selectedGroup) return [];

    const groupPlayers = getPlayersForGroup(selectedGroup);

    if (!searchQuery) return groupPlayers;

    return groupPlayers.filter(player =>
      player.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      player.club.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [selectedGroup, allPlayers, searchQuery, positionGroups]);

  const getGroupEmoji = (groupName: string) => {
    if (!positionGroups) return '⚽';
    const group = positionGroups[groupName];
    if (!group || group.positions.length === 0) return '⚽';
    return POSITION_EMOJI_MAP[group.positions[0]] || '⚽';
  };

  const getGroupShortNames = (groupName: string) => {
    if (!positionGroups) return '';
    const group = positionGroups[groupName];
    if (!group) return '';
    return group.positions.join('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-cyan-600 to-green-500 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-cyan-600 to-green-500 relative overflow-hidden">
      <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
        <img
          src="/campo de futebol 1.webp"
          alt="Football field"
          className="max-w-5xl w-full h-auto object-contain"
        />
      </div>
      <div className="absolute inset-0 flex items-center justify-center opacity-20 pointer-events-none">
        <img
          src="/fl-dragon.png"
          alt="FL Dragon watermark"
          className="max-w-4xl w-full h-auto object-contain drop-shadow-[0_0_25px_rgba(0,0,0,0.4)]"
        />
      </div>

      <div className="bg-gradient-to-b from-black to-transparent py-6 px-6 relative z-10">
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
              src="/fl-dragon.png"
              alt="FL Dragon"
              className="w-16 h-16 object-contain drop-shadow-[0_0_12px_rgba(0,0,0,0.7)]"
            />
          </div>

          <button
            onClick={onComplete}
            disabled={!isLocked}
            className="p-2 bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 text-green-300 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {!hasTactic && (
          <div className="mb-8 bg-red-500/20 border border-red-400 rounded-xl p-6 text-center max-w-2xl mx-auto">
            <Lock className="w-12 h-12 text-red-400 mx-auto mb-3" />
            <h3 className="text-xl font-bold text-white mb-2">Tactical System Required</h3>
            <p className="text-red-200">You must choose your tactical system before picking players.</p>
          </div>
        )}

        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Pick Your Players</h1>
          <p className="text-cyan-200">Select {totalRequired} players for your squad based on your tactic</p>
        </div>

        <div className="bg-blue-800/50 backdrop-blur-sm border border-cyan-500/30 rounded-xl p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-lg p-4 border border-cyan-500/30">
              <div className="text-cyan-300 text-sm mb-1">Initial Budget</div>
              <div className="text-2xl font-bold text-white">{formatValue(initialBudget)}</div>
            </div>

            <div className="bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-lg p-4 border border-cyan-500/30">
              <div className="text-cyan-300 text-sm mb-1">Remaining Budget</div>
              <div className="text-2xl font-bold text-white">{formatValue(remainingBudget)}</div>
            </div>

            <div className="bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-lg p-4 border border-cyan-500/30">
              <div className="text-cyan-300 text-sm mb-1">Players Selected</div>
              <div className="text-2xl font-bold text-white">{selectedPlayers.length} / {totalRequired}</div>
            </div>

            <div className="bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-lg p-4 border border-cyan-500/30">
              <div className="text-cyan-300 text-sm mb-1">Squad Status</div>
              <div className={`text-2xl font-bold ${isSquadValid ? 'text-green-400' : 'text-yellow-400'}`}>
                {isSquadValid ? 'Complete' : 'Incomplete'}
              </div>
            </div>
          </div>

          {success && (
            <div className="mt-6 bg-green-500/20 border border-green-500 text-green-200 px-4 py-3 rounded-lg flex items-center justify-center gap-2">
              <Check className="w-5 h-5" />
              Squad locked successfully! Redirecting...
            </div>
          )}

          {isSquadValid && !isLocked && (
            <div className="mt-6">
              <button
                onClick={handleLockSquad}
                className="w-full py-4 bg-gradient-to-r from-green-500 to-green-600 text-white font-bold rounded-lg hover:from-green-600 hover:to-green-700 transition-all shadow-lg flex items-center justify-center gap-2"
              >
                <Lock className="w-5 h-5" />
                Lock Squad & Continue
              </button>
            </div>
          )}

          {isLocked && !success && (
            <div className="mt-6 bg-green-500/20 border border-green-500/50 rounded-lg p-4 flex items-center gap-3">
              <Lock className="w-6 h-6 text-green-400" />
              <div>
                <div className="text-green-400 font-bold">Squad Locked</div>
                <div className="text-cyan-200 text-sm">Your squad has been finalized</div>
              </div>
            </div>
          )}
        </div>

        {!positionGroups && (
          <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-4 text-yellow-300">
            <p className="font-bold">No position groups found!</p>
            <p className="text-sm mt-2">Please select a tactic first to see position requirements.</p>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {positionGroups && Object.entries(positionGroups).map(([groupName, group]) => {
            const count = groupCounts[groupName] || 0;
            const isComplete = count === group.count;
            const selectedForGroup = getSelectedPlayersForGroup(groupName);
            const emoji = getGroupEmoji(groupName);
            const shortNames = getGroupShortNames(groupName);

            return (
              <div
                key={groupName}
                className={`bg-black/60 backdrop-blur-md border-2 rounded-xl p-4 transition-all ${
                  isComplete
                    ? 'border-green-400 bg-green-500/10 shadow-lg shadow-green-500/20'
                    : 'border-cyan-400 hover:border-cyan-300 hover:shadow-lg hover:shadow-cyan-500/30 cursor-pointer'
                } ${isLocked ? 'opacity-75' : ''}`}
                onClick={() => !isLocked && openGroupModal(groupName)}
              >
                <div className="text-center mb-3">
                  <div className="text-3xl mb-2">{emoji}</div>
                  <div className="text-lg font-bold text-white drop-shadow-lg">{groupName}</div>
                  <div className="text-sm font-bold text-cyan-200 drop-shadow-md">{shortNames}</div>
                </div>

                <div className={`text-center py-2 rounded-lg mb-3 ${
                  isComplete
                    ? 'bg-green-500/30 text-green-300 font-bold'
                    : 'bg-cyan-500/20 text-cyan-200 font-bold'
                }`}>
                  <span className="text-lg">{count} / {group.count}</span>
                  {isComplete && <Check className="inline-block w-5 h-5 ml-1" />}
                </div>

                {selectedForGroup.length > 0 && (
                  <div className="space-y-1">
                    {selectedForGroup.map(player => (
                      <div key={player.id} className="text-xs text-white font-medium truncate bg-black/50 rounded px-2 py-1 border border-cyan-500/30">
                        <span className="font-bold text-cyan-300">{POSITION_SHORT_MAP[player.position]}</span> {player.name}
                      </div>
                    ))}
                  </div>
                )}

                {!isLocked && (
                  <div className="mt-3 text-center text-xs text-cyan-300 font-semibold">
                    Click to select
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {showModal && selectedGroup && positionGroups && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-blue-900 border border-cyan-500/30 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-cyan-500/30">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    Select {selectedGroup}
                  </h2>
                  <p className="text-cyan-300 text-sm mt-1">
                    {groupCounts[selectedGroup] || 0} / {positionGroups[selectedGroup]?.count || 0} selected
                    <span className="ml-2 text-cyan-400">({getGroupShortNames(selectedGroup)})</span>
                  </p>
                </div>
                <button
                  onClick={closeModal}
                  className="p-2 hover:bg-blue-800 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6 text-cyan-400" />
                </button>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-cyan-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search players or clubs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-blue-800 border border-cyan-500/30 rounded-lg text-white placeholder-cyan-300/50 focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-2">
                {filteredModalPlayers.length === 0 ? (
                  <div className="text-center py-12 text-cyan-300">
                    No players found
                  </div>
                ) : (
                  <>
                    <div className="text-cyan-300 text-sm mb-4 bg-blue-800 p-2 rounded">
                      Showing {filteredModalPlayers.length} players
                    </div>
                    {filteredModalPlayers.map((player) => {
                    const isSelected = selectedPlayers.some(p => p.id === player.id);
                    const canAfford = player.value <= remainingBudget || isSelected;

                    return (
                      <div
                        key={player.id}
                        onClick={() => canAfford && togglePlayerSelection(player)}
                        className={`p-4 rounded-lg border transition-all ${
                          isSelected
                            ? 'bg-cyan-500/20 border-cyan-400 cursor-pointer'
                            : canAfford
                            ? 'bg-blue-800/50 border-cyan-500/30 hover:bg-blue-800 cursor-pointer'
                            : 'bg-gray-700/30 border-gray-600/30 opacity-50 cursor-not-allowed'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <span className="bg-cyan-500/20 text-cyan-300 px-2 py-1 rounded text-xs font-bold">
                                {POSITION_SHORT_MAP[player.position]}
                              </span>
                              <div className="text-lg font-bold text-white">{player.name}</div>
                              {isSelected && (
                                <div className="bg-cyan-400 text-blue-900 rounded-full p-1">
                                  <Check className="w-4 h-4" />
                                </div>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-2 text-sm">
                              <span className="text-cyan-300">{player.club}</span>
                              <span className="text-cyan-400">•</span>
                              <span className="text-cyan-300">{player.league}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-xl font-bold text-white">{formatValue(player.value)}</div>
                            {!canAfford && (
                              <div className="text-xs text-red-400 mt-1">Not enough budget</div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  </>
                )}
              </div>
            </div>

            <div className="p-6 border-t border-cyan-500/30 bg-blue-900/50">
              <button
                onClick={closeModal}
                className="w-full py-3 bg-cyan-500 text-blue-900 font-bold rounded-lg hover:bg-cyan-400 transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
