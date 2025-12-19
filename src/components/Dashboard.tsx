import { useState, useEffect } from 'react';
import { Users, Target, Trophy, Calendar, Lock, Clock, Award, Gavel, LogOut, HelpCircle, Globe, Settings, Shield } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { languages, getTranslation } from '../lib/translations';
import { useLanguage } from '../lib/LanguageContext';

interface DashboardProps {
  userId: string;
  onNavigateToTeam: () => void;
  onNavigateToTactic: () => void;
  onNavigateToPlayers: () => void;
  onNavigateToMyTeam: () => void;
  onNavigateToEleven: () => void;
  onNavigateToLeaderboard: () => void;
  onNavigateToAuction: () => void;
  onNavigateToTopPlayers: () => void;
  onNavigateToLeague: () => void;
  onNavigateToTutorial: () => void;
  onNavigateToSettings: () => void;
  onNavigateToAdmin: () => void;
  onLogout: () => void;
  isAdmin?: boolean;
}

interface SelectionPeriod {
  isOpen: boolean;
  message: string;
}

function Dashboard({ userId, onNavigateToTeam, onNavigateToTactic, onNavigateToPlayers, onNavigateToMyTeam, onNavigateToEleven, onNavigateToLeaderboard, onNavigateToAuction, onNavigateToTopPlayers, onNavigateToLeague, onNavigateToTutorial, onNavigateToSettings, onNavigateToAdmin, onLogout, isAdmin = false }: DashboardProps) {
  const [teamPeriod, setTeamPeriod] = useState<SelectionPeriod>({ isOpen: false, message: '' });
  const [tacticPeriod, setTacticPeriod] = useState<SelectionPeriod>({ isOpen: false, message: '' });
  const [playersPeriod, setPlayersPeriod] = useState<SelectionPeriod>({ isOpen: false, message: '' });
  const [hasTeam, setHasTeam] = useState(false);
  const [hasTactic, setHasTactic] = useState(false);
  const [hasPlayers, setHasPlayers] = useState(false);
  const [playersLocked, setPlayersLocked] = useState(false);
  const { language, setLanguage } = useLanguage();
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const [welcomeName, setWelcomeName] = useState<string>('');
  const [showWelcome, setShowWelcome] = useState(true);
  const playersSelectionOpen = playersPeriod.isOpen || !playersLocked;
  const canNavigateToPlayers = hasTactic && playersSelectionOpen;
  const playersStatusMessage = playersPeriod.isOpen
    ? playersPeriod.message
    : !playersLocked
      ? getTranslation('dashboard.initialSquadOpen', language)
      : playersPeriod.message;

  useEffect(() => {
    checkUserSelections();
    checkSelectionPeriods();
    loadWelcomeName();
    const timer = setTimeout(() => setShowWelcome(false), 10000);

    const interval = setInterval(() => {
      checkSelectionPeriods();
    }, 60000);

    return () => {
      clearInterval(interval);
      clearTimeout(timer);
    };
  }, [userId]);

  const loadWelcomeName = async () => {
    try {
      const { data: authData } = await supabase.auth.getUser();
      const metaUsername = authData.user?.user_metadata?.username;
      if (metaUsername) {
        setWelcomeName(metaUsername);
        return;
      }

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('username')
        .eq('id', userId)
        .maybeSingle();
      if (profile?.username) {
        setWelcomeName(profile.username);
        return;
      }
    } catch (e) {
      console.error('Failed to load welcome name', e);
    }
    setWelcomeName('Gestor');
  };

  const changeLanguage = async (newLang: typeof language) => {
    setLanguage(newLang);
    setShowLanguageMenu(false);
  };

  const checkUserSelections = async () => {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('selected_team_id, players_locked')
      .eq('id', userId)
      .maybeSingle();

    const { data: tacticSelection } = await supabase
      .from('user_tactic_selection')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    const { data: playerSelections } = await supabase
      .from('user_player_selections')
      .select('id')
      .eq('user_id', userId);

    setHasTeam(!!profile?.selected_team_id);
    setPlayersLocked(!!profile?.players_locked);
    setHasTactic(!!tacticSelection);
    setHasPlayers(!!playerSelections && playerSelections.length > 0);
  };

  const checkSelectionPeriods = () => {
    setTeamPeriod(checkPeriod('team'));
    setTacticPeriod(checkPeriod('tactic'));
    setPlayersPeriod(checkPeriod('players'));
  };

  const checkPeriod = (type: 'team' | 'tactic' | 'players'): SelectionPeriod => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    if (type === 'team') {
      const seasonEnd = new Date(currentYear, 5, 30);

      if (now > seasonEnd) {
        const nextSeasonEnd = new Date(currentYear + 1, 5, 30);
        const msUntilOpen = nextSeasonEnd.getTime() - now.getTime();
        const daysUntilOpen = Math.floor(msUntilOpen / (1000 * 60 * 60 * 24));
        return {
          isOpen: false,
          message: `Season ends June 30 • ${daysUntilOpen} days remaining`
        };
      }

      const msUntilSeasonEnd = seasonEnd.getTime() - now.getTime();
      const daysUntilSeasonEnd = Math.floor(msUntilSeasonEnd / (1000 * 60 * 60 * 24));

      return {
        isOpen: true,
        message: `Open until June 30 • ${daysUntilSeasonEnd} days remaining`
      };
    }

    if (type === 'tactic') {
      const seasonEnd = new Date(currentYear, 5, 30);

      if (now > seasonEnd) {
        const nextSeasonEnd = new Date(currentYear + 1, 5, 30);
        const msUntilOpen = nextSeasonEnd.getTime() - now.getTime();
        const daysUntilOpen = Math.floor(msUntilOpen / (1000 * 60 * 60 * 24));
        return {
          isOpen: false,
          message: `Season ends June 30 • ${daysUntilOpen} days remaining`
        };
      }

      const msUntilSeasonEnd = seasonEnd.getTime() - now.getTime();
      const daysUntilSeasonEnd = Math.floor(msUntilSeasonEnd / (1000 * 60 * 60 * 24));

      return {
        isOpen: true,
        message: `Open until June 30 • ${daysUntilSeasonEnd} days remaining`
      };
    }

    if (type === 'players') {
      const isJanuary = currentMonth === 0;

      if (isJanuary) {
        return {
          isOpen: true,
          message: 'January transfer window open'
        };
      } else {
        const nextJanuary = new Date(currentMonth < 0 ? currentYear : currentYear + 1, 0, 1);
        const msUntilJanuary = nextJanuary.getTime() - now.getTime();
        const daysUntilJanuary = Math.floor(msUntilJanuary / (1000 * 60 * 60 * 24));
        const monthsUntilJanuary = Math.floor(daysUntilJanuary / 30);

        return {
          isOpen: false,
          message: `Transfer window opens in January • ${monthsUntilJanuary}mo ${daysUntilJanuary % 30}d`
        };
      }
    }

    return { isOpen: false, message: '' };
  };

  const getDayName = (type: 'team' | 'tactic' | 'players'): string => {
    if (type === 'team') return 'Until June 30';
    if (type === 'tactic') return 'Until June 30';
    return 'January Only';
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-cyan-600 to-green-500 relative">
      <div
        className="absolute inset-0 flex items-center justify-center opacity-25 pointer-events-none z-10"
      >
        <img
          src="/campo de futebol 1.webp"
          alt="Football Field"
          className="object-contain"
          style={{ width: '60%', height: '60%' }}
        />
      </div>
      <div className="bg-gradient-to-b from-black to-transparent py-6 px-6 relative z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="relative z-[100]">
            <button
              onClick={() => setShowLanguageMenu(!showLanguageMenu)}
              className="p-2 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/50 text-cyan-300 rounded-lg transition-all hover:scale-110 flex items-center gap-2 min-w-[80px]"
              title="Change Language"
            >
              <Globe className="w-5 h-5" />
              <span className="text-sm font-semibold uppercase">{language}</span>
            </button>
            {showLanguageMenu && (
              <>
                <div
                  className="fixed inset-0 z-[90]"
                  onClick={() => setShowLanguageMenu(false)}
                />
                <div className="absolute top-full left-0 mt-2 bg-black/95 backdrop-blur-md border-2 border-cyan-500/50 rounded-lg overflow-hidden shadow-2xl z-[100] min-w-[200px]">
                  {(Object.keys(languages) as Language[]).map((lang) => (
                    <button
                      key={lang}
                      onClick={() => changeLanguage(lang)}
                      className={`w-full px-4 py-3 text-left hover:bg-cyan-500/20 transition-colors flex items-center gap-2 ${
                        language === lang ? 'bg-cyan-500/30 text-cyan-300' : 'text-white'
                      }`}
                    >
                      <span className="font-bold uppercase text-base">{lang}</span>
                      <span className="text-sm opacity-80">{languages[lang]}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
          <img
            src="/FL_Logo.png?v=2"
            alt="FootLedger"
            className="w-16 h-16 object-contain"
          />
          <button
            onClick={onLogout}
            className="p-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-red-300 rounded-lg transition-all hover:scale-110"
            title={getTranslation('dashboard.logout', language)}
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 pb-12 relative z-20">
        <h1 className="text-5xl font-bold text-white text-center mb-3">{getTranslation('dashboard.title', language)}</h1>
        <p className="text-cyan-200 text-center mb-6 text-lg">{getTranslation('dashboard.subtitle', language)}</p>
        {showWelcome && (
          <div className="mt-2 mb-8 flex items-center gap-4 bg-black/50 border border-cyan-400/40 rounded-xl px-5 py-4 shadow-lg">
            <img
              src="/FL_Logo.png"
              alt="FootLedger Logo"
              className="w-12 h-12 object-contain drop-shadow"
            />
            <div>
              <p className="text-cyan-200 text-sm">Bem-vindo</p>
              <p className="text-white text-2xl font-bold leading-tight">{welcomeName || 'Gestor'}</p>
            </div>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <button
            onClick={onNavigateToTeam}
            disabled={!teamPeriod.isOpen && hasTeam}
            className={`relative bg-black/60 backdrop-blur-md border-2 rounded-xl p-6 md:p-8 transition-all ${
              teamPeriod.isOpen || !hasTeam
                ? 'border-cyan-400 hover:bg-black/70 hover:scale-105 hover:shadow-2xl hover:shadow-cyan-500/50'
                : 'border-gray-600 opacity-60 cursor-not-allowed'
            }`}
          >
            <div className="flex items-start justify-between mb-4">
              <img
                src="/Pick_Your_Team.png"
                alt=""
                className="w-16 h-16 object-contain"
              />
              {hasTeam && (
                <div className="bg-green-500/20 px-2 py-1 rounded-full whitespace-nowrap">
                  <span className="text-green-300 text-xs md:text-sm font-bold">✓ {getTranslation('dashboard.completed', language)}</span>
                </div>
              )}
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-white mb-2 leading-tight">{getTranslation('dashboard.pickYourTeam', language)}</h2>
            <p className="text-sm md:text-base text-cyan-200 mb-4">{getTranslation('dashboard.selectFavoriteTeam', language)}</p>

            <div className={`flex items-start gap-2 px-3 py-2 rounded-lg ${
              teamPeriod.isOpen ? 'bg-green-500/20' : 'bg-red-500/20'
            }`}>
              {teamPeriod.isOpen ? (
                <Clock className="w-4 h-4 md:w-5 md:h-5 text-green-300 animate-pulse flex-shrink-0 mt-0.5" />
              ) : (
                <Lock className="w-4 h-4 md:w-5 md:h-5 text-red-300 flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-1 min-w-0">
                <p className={`font-bold text-xs md:text-sm ${teamPeriod.isOpen ? 'text-green-300' : 'text-red-300'}`}>
                  {teamPeriod.isOpen ? getTranslation('dashboard.openNow', language) : getTranslation('dashboard.closed', language)}
                </p>
                <p className={`text-xs ${teamPeriod.isOpen ? 'text-green-200' : 'text-red-200'} break-words`}>
                  {teamPeriod.message}
                </p>
              </div>
            </div>
          </button>

          <button
            onClick={hasTeam ? onNavigateToTactic : undefined}
            disabled={!hasTeam || (!tacticPeriod.isOpen && hasTactic)}
            className={`relative bg-black/60 backdrop-blur-md border-2 rounded-xl p-6 md:p-8 transition-all ${
              hasTeam && (tacticPeriod.isOpen || !hasTactic)
                ? 'border-cyan-400 hover:bg-black/70 hover:scale-105 hover:shadow-2xl hover:shadow-cyan-500/50'
                : 'border-gray-600 opacity-60 cursor-not-allowed'
            }`}
          >
            <div className="flex items-start justify-between mb-4">
              <img
                src="/Choose_the_Tactical_System.png"
                alt=""
                className="w-16 h-16 object-contain"
              />
              {hasTeam && hasTactic && (
                <div className="bg-green-500/20 px-2 py-1 rounded-full whitespace-nowrap">
                  <span className="text-green-300 text-xs md:text-sm font-bold">✓ {getTranslation('dashboard.completed', language)}</span>
                </div>
              )}
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-white mb-2 leading-tight">{getTranslation('dashboard.chooseTacticalSystem', language)}</h2>
            <p className="text-sm md:text-base text-cyan-200 mb-4">
              {!hasTeam ? getTranslation('dashboard.pickTeamFirst', language) : getTranslation('dashboard.selectOnceTactic', language)}
            </p>

            <div className={`flex items-start gap-2 px-3 py-2 rounded-lg ${
              tacticPeriod.isOpen ? 'bg-green-500/20' : 'bg-red-500/20'
            }`}>
              {tacticPeriod.isOpen ? (
                <Clock className="w-4 h-4 md:w-5 md:h-5 text-green-300 animate-pulse flex-shrink-0 mt-0.5" />
              ) : (
                <Lock className="w-4 h-4 md:w-5 md:h-5 text-red-300 flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-1 min-w-0">
                <p className={`font-bold text-xs md:text-sm ${tacticPeriod.isOpen ? 'text-green-300' : 'text-red-300'}`}>
                  {tacticPeriod.isOpen ? getTranslation('dashboard.openNow', language) : getTranslation('dashboard.closed', language)}
                </p>
                <p className={`text-xs ${tacticPeriod.isOpen ? 'text-green-200' : 'text-red-200'} break-words`}>
                  {tacticPeriod.message}
                </p>
              </div>
            </div>
          </button>

          <button
            onClick={canNavigateToPlayers ? onNavigateToPlayers : undefined}
            disabled={!canNavigateToPlayers}
            className={`relative bg-black/60 backdrop-blur-md border-2 rounded-xl p-6 md:p-8 transition-all ${
              canNavigateToPlayers
                ? 'border-cyan-400 hover:bg-black/70 hover:scale-105 hover:shadow-2xl hover:shadow-cyan-500/50'
                : 'border-gray-600 opacity-60 cursor-not-allowed'
            }`}
          >
            <div className="flex items-start justify-between mb-4">
              <img
                src="/Pick_Your_Players.png"
                alt=""
                className="w-16 h-16 object-contain"
              />
              {hasTactic && hasPlayers && (
                <div className="bg-green-500/20 px-2 py-1 rounded-full whitespace-nowrap">
                  <span className="text-green-300 text-xs md:text-sm font-bold">✓ {getTranslation('dashboard.completed', language)}</span>
                </div>
              )}
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-white mb-2 leading-tight">{getTranslation('dashboard.pickYourPlayers', language)}</h2>
            <p className="text-sm md:text-base text-cyan-200 mb-4">
              {!hasTactic ? getTranslation('dashboard.selectTacticFirst', language) : getTranslation('dashboard.build23PlayerSquad', language)}
            </p>

            <div className={`flex items-start gap-2 px-3 py-2 rounded-lg ${
              playersSelectionOpen ? 'bg-green-500/20' : 'bg-red-500/20'
            }`}>
              {playersSelectionOpen ? (
                <Clock className="w-4 h-4 md:w-5 md:h-5 text-green-300 animate-pulse flex-shrink-0 mt-0.5" />
              ) : (
                <Lock className="w-4 h-4 md:w-5 md:h-5 text-red-300 flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-1 min-w-0">
                <p className={`font-bold text-xs md:text-sm ${playersSelectionOpen ? 'text-green-300' : 'text-red-300'}`}>
                  {playersSelectionOpen ? getTranslation('dashboard.openNow', language) : getTranslation('dashboard.closed', language)}
                </p>
                <p className={`text-xs ${playersSelectionOpen ? 'text-green-200' : 'text-red-200'} break-words`}>
                  {playersStatusMessage}
                </p>
              </div>
            </div>
          </button>

          <button
            onClick={onNavigateToMyTeam}
            className="relative bg-black/60 backdrop-blur-md border-2 border-cyan-400 rounded-xl p-6 md:p-8 transition-all hover:bg-black/70 hover:scale-105 hover:shadow-2xl hover:shadow-cyan-500/50"
          >
            <div className="flex items-start justify-between mb-4">
              <img
                src="/My_Team.png"
                alt=""
                className="w-16 h-16 object-contain"
              />
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-white mb-2 leading-tight">{getTranslation('dashboard.myTeam', language)}</h2>
            <p className="text-sm md:text-base text-cyan-200 mb-4">{getTranslation('dashboard.viewYourSquad', language)}</p>

            <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-cyan-500/20">
              <Calendar className="w-4 h-4 md:w-5 md:h-5 text-cyan-300 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="font-bold text-xs md:text-sm text-cyan-300">{getTranslation('dashboard.alwaysAvailable', language)}</p>
                <p className="text-xs text-cyan-200 break-words">{getTranslation('dashboard.checkYourTeamAnytime', language)}</p>
              </div>
            </div>
          </button>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <button
            onClick={onNavigateToEleven}
            className="bg-gradient-to-r from-yellow-500 to-orange-500 backdrop-blur-md border-2 border-yellow-400 rounded-xl p-6 md:p-8 transition-all hover:from-yellow-400 hover:to-orange-400 hover:scale-105 hover:shadow-2xl hover:shadow-yellow-500/50"
          >
            <div className="flex items-center gap-3 mb-3">
              <img
                src="/Eleven of the Week.png"
                alt=""
                className="w-12 h-12 md:w-16 md:h-16 object-contain bg-black/30 p-2 rounded-lg flex-shrink-0"
              />
              <div className="text-left flex-1 min-w-0">
                <h2 className="text-lg md:text-xl font-bold text-white mb-1 leading-tight">{getTranslation('dashboard.pickElevenOfWeek', language)}</h2>
                <p className="text-sm text-yellow-100">{getTranslation('dashboard.selectWeeklyEleven', language)}</p>
              </div>
            </div>
            <div className="bg-black/30 px-3 py-2 rounded-lg inline-block">
              <p className="font-bold text-xs md:text-sm text-white whitespace-nowrap">{getTranslation('dashboard.tuesdayTimeSlot', language)}</p>
            </div>
          </button>

          <button
            onClick={onNavigateToAuction}
            className="bg-gradient-to-r from-pink-500 to-rose-500 backdrop-blur-md border-2 border-pink-400 rounded-xl p-6 md:p-8 transition-all hover:from-pink-400 hover:to-rose-400 hover:scale-105 hover:shadow-2xl hover:shadow-pink-500/50"
          >
            <div className="flex items-center gap-3 mb-3">
              <img
                src="/Player_Auction.png"
                alt=""
                className="w-12 h-12 md:w-16 md:h-16 object-contain bg-black/30 p-2 rounded-lg flex-shrink-0"
              />
              <div className="text-left flex-1 min-w-0">
                <h2 className="text-lg md:text-xl font-bold text-white mb-1 leading-tight">{getTranslation('dashboard.playerAuction', language)}</h2>
                <p className="text-sm text-pink-100">{getTranslation('dashboard.bidExclusivePlayers', language)}</p>
              </div>
            </div>
            <div className="bg-black/30 px-3 py-2 rounded-lg inline-block">
              <p className="font-bold text-xs md:text-sm text-white whitespace-nowrap">{getTranslation('dashboard.liveAuctions', language)}</p>
            </div>
          </button>

          <button
            onClick={onNavigateToTopPlayers}
            className="bg-gradient-to-r from-emerald-500 to-teal-500 backdrop-blur-md border-2 border-emerald-400 rounded-xl p-6 md:p-8 transition-all hover:from-emerald-400 hover:to-teal-400 hover:scale-105 hover:shadow-2xl hover:shadow-emerald-500/50"
          >
            <div className="flex items-center gap-3 mb-3">
              <img
                src="/Top Players.png"
                alt=""
                className="w-12 h-12 md:w-16 md:h-16 object-contain bg-black/30 p-2 rounded-lg flex-shrink-0"
              />
              <div className="text-left flex-1 min-w-0">
                <h2 className="text-lg md:text-xl font-bold text-white mb-1 leading-tight">{getTranslation('dashboard.topPlayers', language)}</h2>
                <p className="text-sm text-emerald-100">{getTranslation('dashboard.viewBestPerformers', language)}</p>
              </div>
            </div>
            <div className="bg-black/30 px-3 py-2 rounded-lg inline-block">
              <p className="font-bold text-xs md:text-sm text-white whitespace-nowrap">{getTranslation('dashboard.alwaysAvailable', language)}</p>
            </div>
          </button>

          <button
            onClick={onNavigateToLeaderboard}
            className="bg-gradient-to-r from-blue-500 to-sky-500 backdrop-blur-md border-2 border-blue-400 rounded-xl p-6 md:p-8 transition-all hover:from-blue-400 hover:to-sky-400 hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/50"
          >
            <div className="flex items-center gap-3 mb-3">
              <img
                src="/Leader_board.png"
                alt=""
                className="w-12 h-12 md:w-16 md:h-16 object-contain bg-black/30 p-2 rounded-lg flex-shrink-0"
              />
              <div className="text-left flex-1 min-w-0">
                <h2 className="text-lg md:text-xl font-bold text-white mb-1 leading-tight">{getTranslation('dashboard.leaderboard', language)}</h2>
                <p className="text-sm text-blue-100">{getTranslation('dashboard.seeTopManagers', language)}</p>
              </div>
            </div>
            <div className="bg-black/30 px-3 py-2 rounded-lg inline-block">
              <p className="font-bold text-xs md:text-sm text-white whitespace-nowrap">{getTranslation('dashboard.alwaysAvailable', language)}</p>
            </div>
          </button>

          <button
            onClick={onNavigateToLeague}
            className="bg-gradient-to-r from-purple-500 to-violet-500 backdrop-blur-md border-2 border-purple-400 rounded-xl p-6 md:p-8 transition-all hover:from-purple-400 hover:to-violet-400 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/50"
          >
            <div className="flex items-center gap-3 mb-3">
              <img
                src="/My_League.png"
                alt=""
                className="w-12 h-12 md:w-16 md:h-16 object-contain bg-black/30 p-2 rounded-lg flex-shrink-0"
              />
              <div className="text-left flex-1 min-w-0">
                <h2 className="text-lg md:text-xl font-bold text-white mb-1 leading-tight">{getTranslation('dashboard.myLeague', language)}</h2>
                <p className="text-sm text-purple-100">{getTranslation('dashboard.createJoinPrivateLeagues', language)}</p>
              </div>
            </div>
            <div className="bg-black/30 px-3 py-2 rounded-lg inline-block">
              <p className="font-bold text-xs md:text-sm text-white whitespace-nowrap">{getTranslation('dashboard.alwaysAvailable', language)}</p>
            </div>
          </button>

          <button
            onClick={onNavigateToTutorial}
            className="bg-gradient-to-r from-cyan-500 to-blue-500 backdrop-blur-md border-2 border-cyan-400 rounded-xl p-6 md:p-8 transition-all hover:from-cyan-400 hover:to-blue-400 hover:scale-105 hover:shadow-2xl hover:shadow-cyan-500/50"
          >
            <div className="flex items-center gap-3 mb-3">
              <img
                src="/Tutorial.png"
                alt=""
                className="w-12 h-12 md:w-16 md:h-16 object-contain bg-black/30 p-2 rounded-lg flex-shrink-0"
              />
              <div className="text-left flex-1 min-w-0">
                <h2 className="text-lg md:text-xl font-bold text-white mb-1 leading-tight">{getTranslation('dashboard.tutorial', language)}</h2>
                <p className="text-sm text-cyan-100">{getTranslation('dashboard.learnHowToPlay', language)}</p>
              </div>
            </div>
            <div className="bg-black/30 px-3 py-2 rounded-lg inline-block">
              <p className="font-bold text-xs md:text-sm text-white whitespace-nowrap">{getTranslation('dashboard.alwaysAvailable', language)}</p>
            </div>
          </button>

          <button
            onClick={onNavigateToSettings}
            className="bg-gradient-to-r from-gray-700 to-gray-600 backdrop-blur-md border-2 border-gray-500 rounded-xl p-6 md:p-8 transition-all hover:from-gray-600 hover:to-gray-500 hover:scale-105 hover:shadow-2xl hover:shadow-gray-500/50"
          >
            <div className="flex items-center gap-3 mb-3">
              <img
                src="/Settings.png"
                alt=""
                className="w-12 h-12 md:w-16 md:h-16 object-contain bg-black/30 p-2 rounded-lg flex-shrink-0"
              />
              <div className="text-left flex-1 min-w-0">
                <h2 className="text-lg md:text-xl font-bold text-white mb-1 leading-tight">{getTranslation('screens.settings', language)}</h2>
                <p className="text-sm text-gray-100">{getTranslation('screens.manageAccount', language)}</p>
              </div>
            </div>
            <div className="bg-black/30 px-3 py-2 rounded-lg inline-block">
              <p className="font-bold text-xs md:text-sm text-white whitespace-nowrap">{getTranslation('dashboard.alwaysAvailable', language)}</p>
            </div>
          </button>

          {isAdmin && (
            <button
              onClick={onNavigateToAdmin}
              className="bg-gradient-to-r from-red-600 to-red-500 backdrop-blur-md border-2 border-red-400 rounded-xl p-6 md:p-8 transition-all hover:from-red-500 hover:to-red-400 hover:scale-105 hover:shadow-2xl hover:shadow-red-500/50"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 md:w-16 md:h-16 bg-black/30 p-2 rounded-lg flex-shrink-0 flex items-center justify-center">
                  <Shield className="w-8 h-8 md:w-12 md:h-12 text-white" />
                </div>
                <div className="text-left flex-1 min-w-0">
                  <h2 className="text-lg md:text-xl font-bold text-white mb-1 leading-tight">Admin Panel</h2>
                  <p className="text-sm text-red-100">Manage users & sync data</p>
                </div>
              </div>
              <div className="bg-black/30 px-3 py-2 rounded-lg inline-block">
                <p className="font-bold text-xs md:text-sm text-white whitespace-nowrap">Admin Only</p>
              </div>
            </button>
          )}
          </div>
        </div>

        {/* Welcome banner (auto-hide after 10s) */}
        {showWelcome && (
          <div className="max-w-7xl mx-auto mt-4 flex items-center gap-4 bg-black/50 border border-cyan-400/40 rounded-xl px-5 py-4 shadow-lg">
            <img
              src="/FL_Logo.png"
              alt="FootLedger Logo"
              className="w-12 h-12 object-contain drop-shadow"
            />
            <div>
              <p className="text-cyan-200 text-sm">Bem-vindo</p>
              <p className="text-white text-2xl font-bold leading-tight">{welcomeName || 'Gestor'}</p>
            </div>
          </div>
        )}
      </div>
  );
}

export default Dashboard;
