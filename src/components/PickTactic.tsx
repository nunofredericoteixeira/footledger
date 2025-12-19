import { useState, useEffect } from 'react';
import { supabase, type Tactic } from '../lib/supabase';
import { CheckCircle2, Search, Shield } from 'lucide-react';

type PickTacticProps = {
  userId: string;
  onTacticSelected: () => void;
};

export default function PickTactic({ userId, onTacticSelected }: PickTacticProps) {
  const [tactics, setTactics] = useState<Tactic[]>([]);
  const [selectedTactic, setSelectedTactic] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [hasTeam, setHasTeam] = useState(false);

  useEffect(() => {
    checkTeamSelection();
    loadTactics();
    loadUserSelection();
  }, []);

  const checkTeamSelection = async () => {
    const { data } = await supabase
      .from('user_profiles')
      .select('selected_team_id')
      .eq('id', userId)
      .maybeSingle();

    setHasTeam(!!data?.selected_team_id);
  };

  const loadTactics = async () => {
    const { data, error } = await supabase
      .from('tactics')
      .select('*')
      .order('name');

    if (error) {
      console.error('Error loading tactics:', error);
    } else {
      const filtered = (data || []).filter(
        (tactic) =>
          tactic.position_groups && Object.keys(tactic.position_groups).length > 0 &&
          tactic.position_requirements && Object.keys(tactic.position_requirements).length > 0
      );
      setTactics(filtered);
    }
    setLoading(false);
  };

  const loadUserSelection = async () => {
    const { data } = await supabase
      .from('user_tactic_selection')
      .select('tactic_id')
      .eq('user_id', userId)
      .maybeSingle();

    if (data) {
      setSelectedTactic(data.tactic_id);
    }
  };

  const handleSelectTactic = async (tacticId: string) => {
    if (!hasTeam) {
      alert('Please select your team first!');
      return;
    }

    setSaving(true);
    setSelectedTactic(tacticId);

    const selectedTacticData = tactics.find(t => t.id === tacticId);

    const { data: existing } = await supabase
      .from('user_tactic_selection')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (existing) {
      await supabase
        .from('user_tactic_selection')
        .update({ tactic_id: tacticId, updated_at: new Date().toISOString() })
        .eq('user_id', userId);
    } else {
      await supabase
        .from('user_tactic_selection')
        .insert({ user_id: userId, tactic_id: tacticId });
    }

    if (selectedTacticData) {
      await supabase
        .from('user_profiles')
        .update({
          position_requirements: selectedTacticData.position_requirements,
          position_groups: selectedTacticData.position_groups,
          players_locked: false
        })
        .eq('id', userId);

      await supabase
        .from('user_player_selections')
        .delete()
        .eq('user_id', userId);
    }

    setSuccess(true);
    setTimeout(() => {
      setSuccess(false);
    }, 2000);
    setSaving(false);
  };

  const handleContinue = () => {
    if (selectedTactic) {
      onTacticSelected();
    }
  };

  const filteredTactics = tactics.filter(tactic =>
    tactic.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tactic.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-black via-cyan-600 to-green-500 flex items-center justify-center">
        <div className="text-white text-xl">Loading tactical systems...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-cyan-600 to-green-500 relative">
      <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
        <img
          src="/Choose_the_Tactical_System.png"
          alt="Background"
          className="max-w-3xl w-full h-auto object-contain"
        />
      </div>
      <div className="bg-gradient-to-b from-black to-transparent py-6 px-6 relative z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-center">
          <img
            src="/Choose_the_Tactical_System.png"
            alt="Choose Tactical System"
            className="w-20 h-20 object-contain"
          />
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-8 px-4 relative z-10">
        {!hasTeam && (
          <div className="mb-8 bg-red-500/20 border border-red-400 rounded-xl p-6 text-center max-w-2xl mx-auto">
            <Shield className="w-12 h-12 text-red-400 mx-auto mb-3" />
            <h3 className="text-xl font-bold text-white mb-2">Team Selection Required</h3>
            <p className="text-red-200">You must select your team before choosing a tactical system.</p>
          </div>
        )}

        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4">Choose Your Tactical System</h1>
          <p className="text-slate-300 text-lg max-w-2xl mx-auto">
            Select the formation that will define your team's playing style and player requirements
          </p>
        </div>

        <div className="mb-8">
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search tactical systems..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 mb-8">
          {filteredTactics.map((tactic) => (
            <button
              key={tactic.id}
              onClick={() => handleSelectTactic(tactic.id)}
              disabled={saving}
              className={`group relative p-6 rounded-2xl border-2 transition-all duration-300 ${
                selectedTactic === tactic.id
                  ? 'bg-emerald-500/20 border-emerald-500 shadow-lg shadow-emerald-500/20 scale-105'
                  : 'bg-slate-800/50 border-slate-700 hover:border-slate-600 hover:bg-slate-800/70 hover:scale-105'
              }`}
            >
              {selectedTactic === tactic.id && (
                <div className="absolute -top-2 -right-2">
                  <div className="bg-emerald-500 rounded-full p-1">
                    <CheckCircle2 className="w-5 h-5 text-white" />
                  </div>
                </div>
              )}

              <div className="text-center">
                <div className={`text-2xl font-bold mb-3 transition-colors ${
                  selectedTactic === tactic.id ? 'text-emerald-400' : 'text-white group-hover:text-emerald-400'
                }`}>
                  {tactic.name}
                </div>
                <p className="text-slate-400 text-xs leading-relaxed">
                  {tactic.description}
                </p>
              </div>
            </button>
          ))}
        </div>

        {filteredTactics.length === 0 && (
          <div className="text-center py-12">
            <p className="text-slate-400 text-lg">No tactical systems found matching your search.</p>
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-500/20 border border-green-500 text-green-200 px-4 py-3 rounded-lg text-center flex items-center justify-center gap-2">
            <CheckCircle2 className="w-5 h-5" />
            Tactic saved successfully!
          </div>
        )}

        {selectedTactic && (
          <div className="flex justify-center">
            <button
              onClick={handleContinue}
              disabled={saving}
              className="px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 disabled:opacity-50 disabled:cursor-not-allowed text-lg"
            >
              {saving ? 'Saving...' : 'Continue to Dashboard'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
