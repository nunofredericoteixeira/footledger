import { Calendar, MapPin, Trophy } from 'lucide-react';
import type { Match, Team } from '../lib/supabase';

interface MatchCardProps {
  match: Match;
  homeTeam: Team;
  awayTeam: Team;
  onClick?: () => void;
}

export default function MatchCard({ match, homeTeam, awayTeam, onClick }: MatchCardProps) {
  const matchDate = new Date(match.match_date);
  const isFinished = match.status === 'finished';
  const isLive = match.status === 'live';

  return (
    <div
      onClick={onClick}
      className="bg-gradient-to-br from-blue-800 to-blue-900 rounded-lg shadow-lg p-6 hover:shadow-2xl transition-all cursor-pointer border border-cyan-500/30 hover:border-cyan-400"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-sm text-cyan-200">
          <Calendar className="w-4 h-4" />
          <span>{matchDate.toLocaleDateString()}</span>
        </div>
        {isLive && (
          <span className="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full animate-pulse">
            LIVE
          </span>
        )}
        {isFinished && (
          <span className="bg-cyan-500 text-blue-900 text-xs font-bold px-3 py-1 rounded-full">
            FT
          </span>
        )}
        {!isLive && !isFinished && (
          <span className="bg-cyan-500 text-blue-900 text-xs font-bold px-3 py-1 rounded-full">
            {matchDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] gap-4 items-center mb-4">
        <div className="text-right">
          <p className="font-bold text-lg text-white truncate">{homeTeam.name}</p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-3xl font-bold text-cyan-300">{match.home_score}</span>
          <span className="text-2xl font-bold text-cyan-500">-</span>
          <span className="text-3xl font-bold text-cyan-300">{match.away_score}</span>
        </div>

        <div className="text-left">
          <p className="font-bold text-lg text-white truncate">{awayTeam.name}</p>
        </div>
      </div>

      {match.location && (
        <div className="flex items-center gap-2 text-sm text-cyan-200">
          <MapPin className="w-4 h-4" />
          <span>{match.location}</span>
        </div>
      )}
    </div>
  );
}
