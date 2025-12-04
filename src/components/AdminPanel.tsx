import { useState, useEffect } from 'react';
import { Shield, Trash2, Users, AlertTriangle, TestTube, Upload, CalendarRange, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import DataSyncPanel from './DataSyncPanel';

interface UserProfile {
  id: string;
  email: string;
  created_at: string;
  team_name?: string;
  tactic_name?: string;
}

interface AdminPanelProps {
  onNavigateToDashboard?: () => void;
}

export default function AdminPanel({ onNavigateToDashboard }: AdminPanelProps = {}) {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [populatingPlayers, setPopulatingPlayers] = useState(false);
  const [weekDate, setWeekDate] = useState<string>('');
  const [settingWeek, setSettingWeek] = useState(false);
  const [weekMessage, setWeekMessage] = useState<string | null>(null);

  useEffect(() => {
    checkAdminStatus();
  }, []);

  const checkAdminStatus = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('is_admin')
        .eq('id', user.id)
        .maybeSingle();

      if (profile?.is_admin) {
        setIsAdmin(true);
        loadUsers();
      } else {
        setLoading(false);
      }
    }
  };

  const loadUsers = async () => {
    setLoading(true);
    try {
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select(`
          id,
          selected_team_id,
          teams:selected_team_id (name)
        `);

      const { data: tactics } = await supabase
        .from('user_tactic_selection')
        .select(`
          user_id,
          tactics:tactic_id (name)
        `);

      const { data: { users: authUsers } } = await supabase.auth.admin.listUsers();

      const userList: UserProfile[] = authUsers.map(user => {
        const profile = profiles?.find(p => p.id === user.id);
        const tactic = tactics?.find(t => t.user_id === user.id);

        return {
          id: user.id,
          email: user.email || 'No email',
          created_at: user.created_at,
          team_name: profile?.teams?.name,
          tactic_name: tactic?.tactics?.name,
        };
      });

      setUsers(userList);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResetMySelections = async () => {
    setResetting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from('user_tactic_selection')
        .delete()
        .eq('user_id', user.id);

      await supabase
        .from('user_player_selections')
        .delete()
        .eq('user_id', user.id);

      await supabase
        .from('weekly_eleven_selections')
        .delete()
        .eq('user_id', user.id);

      await supabase
        .from('user_profiles')
        .update({
          selected_team_id: null,
          team_value: null,
          position_requirements: null,
          total_points: 0
        })
        .eq('id', user.id);

      alert('Your selections have been reset! You can now make new selections.');
    } catch (error: any) {
      console.error('Error resetting selections:', error);
      alert('Error resetting selections: ' + error.message);
    } finally {
      setResetting(false);
    }
  };

  const handlePopulatePlayers = async () => {
    setPopulatingPlayers(true);
    try {
      const response = await fetch('/Jogadores_Valor.xlsx - Sheet1.csv');
      const csvText = await response.text();

      const lines = csvText.trim().split('\n');
      const players = [];

      console.log('First 3 lines of CSV:');
      console.log(lines[0]);
      console.log(lines[1]);
      console.log(lines[2]);

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const parts = line.split(',');

        if (i === 1) {
          console.log('First data line parts:', parts);
          console.log('Column E (index 4):', parts[4]);
          console.log('Column F (index 5):', parts[5]);
        }

        if (parts.length < 7) {
          console.warn(`Line ${i} has only ${parts.length} parts`);
          continue;
        }

        const league = parts[0].trim();
        const club = parts[1].trim();
        const name = parts[2].trim();
        const position = parts[3].trim();
        const valueStr = parts[5].trim();
        const value = parseInt(valueStr);

        if (i <= 5) {
          console.log(`Line ${i} - ${name}: valueStr="${valueStr}", parsed=${value}, position=${position}`);
        }

        if (league && club && name && position && !isNaN(value)) {
          players.push({ league, club, name, position, value });
        } else {
          if (i <= 5) {
            console.log(`  SKIPPED - league:${!!league}, club:${!!club}, name:${!!name}, position:${!!position}, isNaN:${isNaN(value)}`);
          }
        }
      }

      console.log(`Parsed ${players.length} players from CSV`);

      // Show first 3 players being sent
      console.log('First 3 players being sent:', players.slice(0, 3));

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/populate-player-pool`;
      const { data: { session } } = await supabase.auth.getSession();

      const populateResponse = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ players }),
      });

      const data = await populateResponse.json();

      if (!populateResponse.ok) {
        throw new Error(data.error || 'Failed to populate players');
      }

      alert(`Success! ${data.total} players populated.`);
    } catch (error: any) {
      console.error('Error populating players:', error);
      alert('Error populating players: ' + error.message);
    } finally {
      setPopulatingPlayers(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (confirmDelete !== userId) {
      setConfirmDelete(userId);
      return;
    }

    setDeletingUserId(userId);
    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-user`;
      const { data: { session } } = await supabase.auth.getSession();

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete user');
      }

      await loadUsers();
      setConfirmDelete(null);
    } catch (error: any) {
      console.error('Error deleting user:', error);
      alert('Error deleting user: ' + error.message);
    } finally {
      setDeletingUserId(null);
    }
  };

  const handleSetWeekDates = async () => {
    setWeekMessage(null);
    setSettingWeek(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setWeekMessage('Not authenticated');
        return;
      }

      const { data: selections, error: selError } = await supabase
        .from('weekly_eleven_selections')
        .select('id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (selError) throw selError;
      const selectionId = selections?.[0]?.id;
      if (!selectionId) {
        setWeekMessage('No weekly eleven selection found to update.');
        return;
      }

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/set-weekly-dates`;
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          selectionId,
          referenceDate: weekDate || undefined,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to set week dates');
      }

      setWeekMessage(`Updated week: ${data.weekStart} → ${data.weekEnd}`);
    } catch (error: any) {
      console.error('Error setting week dates:', error);
      setWeekMessage(error.message || 'Error setting week dates');
    } finally {
      setSettingWeek(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Shield className="w-16 h-16 text-red-400 mb-4" />
        <h3 className="text-xl font-bold text-white mb-2">Access Denied</h3>
        <p className="text-cyan-200">You do not have permission to access this page.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="bg-gradient-to-br from-red-500 to-red-600 p-3 rounded-xl">
          <Shield className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">Admin Panel</h2>
          <p className="text-cyan-200">Manage registered users</p>
        </div>
      </div>

      <DataSyncPanel />

      <div className="bg-blue-800/50 rounded-xl border border-cyan-500/30 p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-green-500 to-green-600 p-3 rounded-xl">
            <CalendarRange className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Set Weekly Dates (Admin)</h3>
            <p className="text-cyan-200 text-sm">
              Escolhe a data de referência; a semana é calculada automaticamente (terça a segunda).
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-cyan-200 mb-2">Data de referência</label>
            <input
              type="date"
              value={weekDate}
              onChange={(e) => setWeekDate(e.target.value)}
              className="w-full bg-blue-900/60 border border-cyan-500/40 text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
            />
            <p className="text-xs text-cyan-300 mt-1">
              Se deixar vazio, usa a data de hoje.
            </p>
          </div>
          <div className="flex items-end">
            <button
              onClick={handleSetWeekDates}
              disabled={settingWeek}
              className="w-full py-3 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold rounded-lg hover:from-green-600 hover:to-green-700 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {settingWeek && <Loader2 className="w-5 h-5 animate-spin" />}
              Definir semana
            </button>
          </div>
        </div>

        {weekMessage && (
          <div className="text-sm text-cyan-100 bg-cyan-500/10 border border-cyan-500/40 rounded-lg px-3 py-2">
            {weekMessage}
          </div>
        )}
      </div>

      <div className="bg-blue-800/50 rounded-xl border border-cyan-500/30 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-blue-900/70">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-bold text-cyan-300 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-4 text-left text-sm font-bold text-cyan-300 uppercase tracking-wider">
                  Team
                </th>
                <th className="px-6 py-4 text-left text-sm font-bold text-cyan-300 uppercase tracking-wider">
                  Tactic
                </th>
                <th className="px-6 py-4 text-left text-sm font-bold text-cyan-300 uppercase tracking-wider">
                  Registered
                </th>
                <th className="px-6 py-4 text-right text-sm font-bold text-cyan-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cyan-500/20">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-blue-700/30 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-white font-medium">{user.email}</div>
                    <div className="text-cyan-300 text-xs">{user.id.slice(0, 8)}...</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-cyan-200">
                      {user.team_name || <span className="text-gray-400">Not set</span>}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-cyan-200">
                      {user.tactic_name || <span className="text-gray-400">Not set</span>}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-cyan-200 text-sm">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    {confirmDelete === user.id ? (
                      <div className="flex items-center justify-end gap-2">
                        <span className="text-red-400 text-sm flex items-center gap-1">
                          <AlertTriangle className="w-4 h-4" />
                          Confirm?
                        </span>
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          disabled={deletingUserId === user.id}
                          className="px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:bg-gray-600 text-sm font-bold"
                        >
                          {deletingUserId === user.id ? 'Deleting...' : 'Yes, Delete'}
                        </button>
                        <button
                          onClick={() => setConfirmDelete(null)}
                          className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        className="inline-flex items-center gap-2 px-3 py-1.5 bg-red-500/20 border border-red-500/50 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {users.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-cyan-300 mx-auto mb-3" />
            <p className="text-cyan-200">No users registered yet</p>
          </div>
        )}
      </div>

      <div className="bg-blue-800/30 border border-cyan-500/20 rounded-lg p-4">
        <p className="text-cyan-200 text-sm flex items-start gap-2">
          <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
          <span>
            <strong>Warning:</strong> Deleting a user will permanently remove their account and all associated data.
            This action cannot be undone.
          </span>
        </p>
      </div>

      <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-lg p-6">
        <div className="flex items-start gap-4">
          <div className="bg-gradient-to-br from-green-400 to-green-600 p-3 rounded-xl">
            <Upload className="w-6 h-6 text-blue-900" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-white mb-2">Populate Player Pool</h3>
            <p className="text-cyan-200 text-sm mb-4">
              Load all 3022 players from the CSV file into the database. This will clear existing players and insert fresh data.
            </p>
            <button
              onClick={handlePopulatePlayers}
              disabled={populatingPlayers}
              className="px-4 py-2 bg-green-500 text-blue-900 font-bold rounded-lg hover:bg-green-400 transition-colors disabled:bg-gray-600 disabled:text-gray-400"
            >
              {populatingPlayers ? 'Populating...' : 'Populate Players'}
            </button>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 rounded-lg p-6">
        <div className="flex items-start gap-4">
          <div className="bg-gradient-to-br from-cyan-400 to-cyan-600 p-3 rounded-xl">
            <TestTube className="w-6 h-6 text-blue-900" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-white mb-2">Test Mode - Navigation</h3>
            <p className="text-cyan-200 text-sm mb-4">
              As an admin, you can navigate to the dashboard to test all app screens.
              Reset your selections at any time to experiment with different choices.
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleResetMySelections}
                disabled={resetting}
                className="px-4 py-2 bg-yellow-500 text-blue-900 font-bold rounded-lg hover:bg-yellow-400 transition-colors disabled:bg-gray-600 disabled:text-gray-400"
              >
                {resetting ? 'Resetting...' : 'Reset My Selections'}
              </button>
              {onNavigateToDashboard && (
                <button
                  onClick={onNavigateToDashboard}
                  className="px-4 py-2 bg-cyan-500 text-blue-900 font-bold rounded-lg hover:bg-cyan-400 transition-colors"
                >
                  Dashboard
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
