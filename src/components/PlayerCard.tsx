import { User, Hash } from 'lucide-react';
import type { Player } from '../lib/supabase';

interface PlayerCardProps {
  player: Player;
  teamName?: string;
  onClick?: () => void;
}

export default function PlayerCard({ player, teamName, onClick }: PlayerCardProps) {
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow cursor-pointer border border-gray-200"
    >
      <div className="flex items-center gap-4">
        <div className="flex-shrink-0">
          <div className="w-14 h-14 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
            {player.jersey_number ? (
              <span className="text-2xl font-bold text-white">{player.jersey_number}</span>
            ) : (
              <User className="w-7 h-7 text-white" />
            )}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-gray-900 truncate">{player.name}</h4>
          <p className="text-sm text-gray-600">{player.position}</p>
          {teamName && (
            <p className="text-xs text-gray-500 mt-1">{teamName}</p>
          )}
        </div>
      </div>
    </div>
  );
}
