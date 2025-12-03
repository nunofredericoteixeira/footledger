import { Shield, Calendar } from 'lucide-react';
import type { Team } from '../lib/supabase';

interface TeamCardProps {
  team: Team;
  onClick?: () => void;
}

export default function TeamCard({ team, onClick }: TeamCardProps) {
  return (
    <div
      onClick={onClick}
      className="bg-gradient-to-br from-blue-800 to-blue-900 rounded-lg shadow-lg p-6 hover:shadow-2xl transition-all cursor-pointer border border-cyan-500/30 hover:border-cyan-400"
    >
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          {team.logo_url ? (
            <img
              src={team.logo_url}
              alt={`${team.name} logo`}
              className="w-16 h-16 object-contain"
            />
          ) : (
            <div className="w-16 h-16 bg-gradient-to-br from-cyan-400 to-cyan-600 rounded-lg flex items-center justify-center">
              <Shield className="w-8 h-8 text-blue-900" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-xl font-bold text-white truncate">{team.name}</h3>
          {team.founded_year && (
            <div className="flex items-center gap-2 mt-2 text-cyan-200">
              <Calendar className="w-4 h-4" />
              <span className="text-sm">Founded {team.founded_year}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
