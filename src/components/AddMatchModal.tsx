import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { supabase, type Team } from '../lib/supabase';

interface AddMatchModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddMatchModal({ onClose, onSuccess }: AddMatchModalProps) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [homeTeamId, setHomeTeamId] = useState('');
  const [awayTeamId, setAwayTeamId] = useState('');
  const [matchDate, setMatchDate] = useState('');
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadTeams();
  }, []);

  const loadTeams = async () => {
    const { data } = await supabase
      .from('teams')
      .select('*')
      .order('name');

    if (data) setTeams(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (homeTeamId === awayTeamId) {
      setError('Home and away teams must be different');
      return;
    }

    setLoading(true);

    try {
      const { error: insertError } = await supabase
        .from('matches')
        .insert({
          home_team_id: homeTeamId,
          away_team_id: awayTeamId,
          match_date: matchDate,
          location: location || null,
          status: 'scheduled',
        });

      if (insertError) throw insertError;

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create match');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50">
      <div className="bg-gradient-to-br from-blue-800 to-blue-900 rounded-lg max-w-md w-full p-6 border border-cyan-500/30">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-white">Add New Match</h2>
          <button
            onClick={onClose}
            className="text-cyan-300 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-cyan-200 mb-1">
              Home Team *
            </label>
            <select
              value={homeTeamId}
              onChange={(e) => setHomeTeamId(e.target.value)}
              required
              className="w-full px-3 py-2 bg-blue-900 border border-cyan-500/30 text-white rounded-lg focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
            >
              <option value="">Select home team</option>
              {teams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-cyan-200 mb-1">
              Away Team *
            </label>
            <select
              value={awayTeamId}
              onChange={(e) => setAwayTeamId(e.target.value)}
              required
              className="w-full px-3 py-2 bg-blue-900 border border-cyan-500/30 text-white rounded-lg focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
            >
              <option value="">Select away team</option>
              {teams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-cyan-200 mb-1">
              Match Date & Time *
            </label>
            <input
              type="datetime-local"
              value={matchDate}
              onChange={(e) => setMatchDate(e.target.value)}
              required
              className="w-full px-3 py-2 bg-blue-900 border border-cyan-500/30 text-white rounded-lg focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-cyan-200 mb-1">
              Location
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full px-3 py-2 bg-blue-900 border border-cyan-500/30 text-white rounded-lg focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
              placeholder="Stadium name"
            />
          </div>

          {error && (
            <div className="bg-red-500/20 border border-red-500 text-red-200 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-cyan-500/30 text-cyan-200 rounded-lg hover:bg-blue-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-cyan-500 text-blue-900 rounded-lg hover:bg-cyan-400 transition-colors disabled:bg-gray-600 font-bold"
            >
              {loading ? 'Creating...' : 'Create Match'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
