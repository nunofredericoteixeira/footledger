import { useState } from 'react';
import { X } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface AddTeamModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddTeamModal({ onClose, onSuccess }: AddTeamModalProps) {
  const [name, setName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [foundedYear, setFoundedYear] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { error: insertError } = await supabase
        .from('teams')
        .insert({
          name,
          logo_url: logoUrl || null,
          founded_year: foundedYear ? parseInt(foundedYear) : null,
        });

      if (insertError) throw insertError;

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create team');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50">
      <div className="bg-gradient-to-br from-blue-800 to-blue-900 rounded-lg max-w-md w-full p-6 border border-cyan-500/30">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-white">Add New Team</h2>
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
              Team Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3 py-2 bg-blue-900 border border-cyan-500/30 text-white rounded-lg focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
              placeholder="Enter team name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-cyan-200 mb-1">
              Logo URL
            </label>
            <input
              type="url"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              className="w-full px-3 py-2 bg-blue-900 border border-cyan-500/30 text-white rounded-lg focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
              placeholder="https://example.com/logo.png"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-cyan-200 mb-1">
              Founded Year
            </label>
            <input
              type="number"
              value={foundedYear}
              onChange={(e) => setFoundedYear(e.target.value)}
              min="1800"
              max={new Date().getFullYear()}
              className="w-full px-3 py-2 bg-blue-900 border border-cyan-500/30 text-white rounded-lg focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
              placeholder="e.g., 1902"
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
              {loading ? 'Creating...' : 'Create Team'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
