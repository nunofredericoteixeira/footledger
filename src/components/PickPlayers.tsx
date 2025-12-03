import { useState, useEffect, useMemo } from 'react';
import { Check, Lock, X, Search } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Player {
  id: string;
  name: string;
  league: string;
  club: string;
  position: string;
  value: number;
  total_points?: number;
}

interface PickPlayersProps {
  userId: string;
  teamValue: number;
  onComplete: () => void;
}

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

const POSITION_FULL_NAME_MAP: Record<string, string> = {
  'GK': 'Goalkeeper',
  'CB': 'Centre-Back',
  'LB': 'Left-Back',
  'RB': 'Right-Back',
  'DM': 'Defensive Midfield',
  'CM': 'Central Midfield',
  'AM': 'Attacking Midfield',
  'LM': 'Left Midfield',
  'RM': 'Right Midfield',
  'LW': 'Left Winger',
  'RW': 'Right Winger',
  'CF': 'Centre-Forward',
  'SS': 'Second Striker',
};

export default function PickPlayers({ userId, teamValue, onComplete }: PickPlayersProps) {
  const [allPlayers, setAllPlayers] = useState<Player[]>([]);
  const [selectedPlayers, setSelectedPlayers] = useState<Player[]>([]);
  const [remainingBudget, setRemainingBudget] = useState(teamValue);
  const [loading, setLoading] = useState(true);
  const [isLocked, setIsLocked] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [positionRequirements, setPositionRequirements] = useState<Record<string, number> | null>(null);

  useEffect(() => {
    loadPlayers();
    loadUserSelections();
  }, [userId]);

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

      console.log(`Loaded ${allData.length} total players`);

      const gks = allData.filter(p => p.position === 'Goalkeeper');
      console.log(`Goalkeepers: ${gks.length}, min value: ${Math.min(...gks.map(g => g.value))}, max value: ${Math.max(...gks.map(g => g.value))}`);

      const { data: pointsData, error: pointsError } = await supabase
        .from('player_weekly_points')
        .select('player_id, points');

      if (!pointsError && pointsData) {
        const playerTotalPoints = pointsData.reduce((acc, record) => {
          if (!acc[record.player_id]) {
            acc[record.player_id] = 0;
          }
          acc[record.player_id] += record.points;
          return acc;
        }, {} as Record<string, number>);

        allData = allData.map(player => ({
          ...player,
          total_points: playerTotalPoints[player.id] || 0
        }));
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
        .select('remaining_budget, players_locked, position_requirements')
        .eq('id', userId)
        .maybeSingle();

      if (profile) {
        setRemainingBudget(profile.remaining_budget || teamValue);
        setIsLocked(profile.players_locked || false);
        setPositionRequirements(profile.position_requirements);
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
        }
      }
    } catch (err) {
      console.error('Error loading user selections:', err);
    }
  };

  const positionCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    if (!positionRequirements) return counts;

    Object.keys(positionRequirements).forEach(shortPos => {
      const fullName = POSITION_FULL_NAME_MAP[shortPos];
      if (fullName) {
        counts[shortPos] = selectedPlayers.filter(p => p.position === fullName).length;
      }
    });
    return counts;
  }, [selectedPlayers, positionRequirements]);

  const totalRequired = useMemo(() => {
    if (!positionRequirements) return 0;
    return Object.values(positionRequirements).reduce((sum, count) => sum + count, 0);
  }, [positionRequirements]);

  const isSquadValid = useMemo(() => {
    if (!positionRequirements) return false;
    if (selectedPlayers.length !== totalRequired) return false;

    for (const [shortPos, required] of Object.entries(positionRequirements)) {
      if (positionCounts[shortPos] !== required) {
        return false;
      }
    }
    return true;
  }, [selectedPlayers, positionCounts, positionRequirements, totalRequired]);

  const openPositionModal = (shortPos: string) => {
    if (isLocked) return;
    setSelectedPosition(shortPos);
    setShowModal(true);
    setSearchQuery('');
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedPosition(null);
    setSearchQuery('');
  };

  const togglePlayerSelection = async (player: Player) => {
    if (isLocked) return;

    const isSelected = selectedPlayers.some(p => p.id === player.id);

    if (isSelected) {
      try {
        await supabase
          .from('user_player_selections')
          .delete()
          .eq('user_id', userId)
          .eq('player_id', player.id);

        setSelectedPlayers(prev => prev.filter(p => p.id !== player.id));
        const newBudget = remainingBudget + player.value;
        setRemainingBudget(newBudget);

        await supabase
          .from('user_profiles')
          .update({ remaining_budget: newBudget })
          .eq('id', userId);
      } catch (err) {
        console.error('Error removing player:', err);
      }
    } else {
      if (!positionRequirements || !selectedPosition) return;

      const positionCount = positionCounts[selectedPosition] || 0;
      const maxForPosition = positionRequirements[selectedPosition] || 0;

      if (positionCount >= maxForPosition) {
        alert(`You already have ${maxForPosition} ${selectedPosition} player(s)!`);
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
        const newBudget = remainingBudget - player.value;
        setRemainingBudget(newBudget);

        await supabase
          .from('user_profiles')
          .update({ remaining_budget: newBudget })
          .eq('id', userId);
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
      alert('Squad locked successfully!');
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

  const getPlayersForPosition = (shortPos: string) => {
    const fullName = POSITION_FULL_NAME_MAP[shortPos];
    if (!fullName) return [];
    return allPlayers.filter(p => p.position === fullName);
  };

  const getSelectedPlayersForPosition = (shortPos: string) => {
    const fullName = POSITION_FULL_NAME_MAP[shortPos];
    if (!fullName) return [];
    return selectedPlayers.filter(p => p.position === fullName);
  };

  const filteredModalPlayers = useMemo(() => {
    if (!selectedPosition) return [];

    const positionPlayers = getPlayersForPosition(selectedPosition);

    console.log(`Position: ${selectedPosition}, Total players: ${positionPlayers.length}`);

    if (positionPlayers.length > 0) {
      const values = positionPlayers.map(p => p.value).sort((a, b) => a - b);
      console.log(`Value range: €${values[0]} to €${values[values.length - 1]}`);
      console.log(`First 3 players (by order loaded):`, positionPlayers.slice(0, 3).map(p => ({ name: p.name, value: p.value })));
      console.log(`Last 3 players (by order loaded):`, positionPlayers.slice(-3).map(p => ({ name: p.name, value: p.value })));
    }

    if (!searchQuery) return positionPlayers;

    return positionPlayers.filter(player =>
      player.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      player.club.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [selectedPosition, allPlayers, searchQuery]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-cyan-600 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-cyan-600 to-green-500 relative">
      <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
        <img
          src="/Pick_Your_Players.png"
          alt="Background"
          className="max-w-3xl w-full h-auto object-contain"
        />
      </div>
      <div className="bg-gradient-to-b from-black to-transparent py-6 px-6 relative z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-center">
          <img
            src="/Pick_Your_Players.png"
            alt="Pick Your Players"
            className="w-20 h-20 object-contain"
          />
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 relative z-10">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Pick Your Players</h1>
          <p className="text-cyan-200">Select {totalRequired} players for your squad based on your tactic</p>
        </div>

        <div className="bg-blue-800/50 backdrop-blur-sm border border-cyan-500/30 rounded-xl p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-lg p-4 border border-cyan-500/30">
              <div className="text-cyan-300 text-sm mb-1">Remaining Budget</div>
              <div className="text-3xl font-bold text-white">{formatValue(remainingBudget)}</div>
            </div>

            <div className="bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-lg p-4 border border-cyan-500/30">
              <div className="text-cyan-300 text-sm mb-1">Players Selected</div>
              <div className="text-3xl font-bold text-white">{selectedPlayers.length} / {totalRequired}</div>
            </div>

            <div className="bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-lg p-4 border border-cyan-500/30">
              <div className="text-cyan-300 text-sm mb-1">Squad Status</div>
              <div className={`text-2xl font-bold ${isSquadValid ? 'text-green-400' : 'text-yellow-400'}`}>
                {isSquadValid ? 'Complete' : 'Incomplete'}
              </div>
            </div>
          </div>

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

          {isLocked && (
            <div className="mt-6 bg-green-500/20 border border-green-500/50 rounded-lg p-4 flex items-center gap-3">
              <Lock className="w-6 h-6 text-green-400" />
              <div>
                <div className="text-green-400 font-bold">Squad Locked</div>
                <div className="text-cyan-200 text-sm">Your squad has been finalized</div>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {positionRequirements && Object.entries(positionRequirements).map(([shortPos, required]) => {
            const count = positionCounts[shortPos] || 0;
            const isComplete = count === required;
            const selectedForPosition = getSelectedPlayersForPosition(shortPos);
            const emoji = POSITION_EMOJI_MAP[shortPos] || '⚽';
            const fullName = POSITION_FULL_NAME_MAP[shortPos] || shortPos;

            return (
              <div
                key={shortPos}
                className={`bg-blue-800/50 backdrop-blur-sm border rounded-xl p-4 transition-all ${
                  isComplete
                    ? 'border-green-500/50 bg-green-500/10'
                    : 'border-cyan-500/30 hover:border-cyan-400 cursor-pointer'
                } ${isLocked ? 'opacity-75' : ''}`}
                onClick={() => !isLocked && openPositionModal(shortPos)}
              >
                <div className="text-center mb-3">
                  <div className="text-3xl mb-2">{emoji}</div>
                  <div className="text-lg font-bold text-white">{shortPos}</div>
                  <div className="text-xs text-cyan-300">{fullName}</div>
                </div>

                <div className={`text-center py-2 rounded-lg mb-3 ${
                  isComplete
                    ? 'bg-green-500/20 text-green-400'
                    : 'bg-cyan-500/10 text-cyan-300'
                }`}>
                  <span className="font-bold">{count} / {required}</span>
                  {isComplete && <Check className="inline-block w-4 h-4 ml-1" />}
                </div>

                {selectedForPosition.length > 0 && (
                  <div className="space-y-1">
                    {selectedForPosition.map(player => (
                      <div key={player.id} className="text-xs text-cyan-200 truncate bg-blue-900/50 rounded px-2 py-1">
                        {player.name}
                      </div>
                    ))}
                  </div>
                )}

                {!isLocked && (
                  <div className="mt-3 text-center text-xs text-cyan-400">
                    Click to select
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      </div>

      {showModal && selectedPosition && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-blue-900 border border-cyan-500/30 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-cyan-500/30">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    Select {selectedPosition} - {POSITION_FULL_NAME_MAP[selectedPosition]}
                  </h2>
                  <p className="text-cyan-300 text-sm mt-1">
                    {positionCounts[selectedPosition] || 0} / {positionRequirements?.[selectedPosition] || 0} selected
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
                              {player.total_points !== undefined && (
                                <>
                                  <span className="text-cyan-400">•</span>
                                  <span className="text-yellow-400 font-semibold">{player.total_points} pts</span>
                                </>
                              )}
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
