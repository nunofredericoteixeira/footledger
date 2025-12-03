import { useState, useEffect } from 'react';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from './lib/supabase';
import flLogo from '/public/FL_Logo.png';
import introImg from '/public/Intro.png';
import { LanguageProvider } from './lib/LanguageContext';
import AuthForm from './components/AuthForm';
import Dashboard from './components/Dashboard';
import PickTeam from './components/PickTeam';
import PickTactic from './components/PickTactic';
import PickPlayersFlexible from './components/PickPlayersFlexible';
import PickEleven from './components/PickEleven';
import MyTeam from './components/MyTeam';
import Leaderboard from './components/Leaderboard';
import AuctionPlayer from './components/AuctionPlayer';
import TopPlayers from './components/TopPlayers';
import MyLeague from './components/MyLeague';
import Tutorial from './components/Tutorial';
import Settings from './components/Settings';
import AdminPanel from './components/AdminPanel';
import type { User } from '@supabase/supabase-js';

type View = 'welcome' | 'auth' | 'dashboard' | 'pickteam' | 'picktactic' | 'pickplayers' | 'myteam' | 'pickeleven' | 'leaderboard' | 'auction' | 'topplayers' | 'league' | 'tutorial' | 'settings' | 'admin';

function AppContent() {
  const [view, setView] = useState<View>('welcome');
  const [user, setUser] = useState<User | null>(null);
  const [newUserId, setNewUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedTeamValue, setSelectedTeamValue] = useState(0);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkUserProfile = async (userId: string) => {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    const isUserAdmin = profile?.is_admin || false;
    setIsAdmin(isUserAdmin);
    setNewUserId(userId);
    setSelectedTeamValue(profile?.team_value || 0);
  };

  const checkUser = async () => {
    setLoading(true);
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    setUser(currentUser);

    if (currentUser) {
      await checkUserProfile(currentUser.id);
      setView('dashboard');
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setView('welcome');
    setUser(null);
    setIsAdmin(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-700 to-cyan-500 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400"></div>
      </div>
    );
  }

  if (view === 'welcome') {
    return (
      <div className="h-screen bg-gradient-to-b from-black via-cyan-600 to-green-500 flex flex-col overflow-hidden">
        <div className="bg-gradient-to-b from-black to-transparent py-4 px-6 flex-shrink-0">
          <div className="max-w-7xl mx-auto flex items-center justify-center">
            <img
              src={flLogo}
              alt="FootLedger Logo"
              className="w-16 h-16 object-contain"
            />
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center px-4 pb-6">
          <div className="text-center max-w-3xl flex flex-col items-center justify-center">
            <img
              src={introImg}
              alt="FootLedger Intro"
              className="mx-auto mb-4 w-[95%] max-h-[75vh] object-contain"
            />

            <button
              onClick={() => setView('auth')}
              className="group inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-cyan-400 to-green-400 text-gray-900 text-xl font-bold rounded-full hover:from-cyan-300 hover:to-green-300 transition-all shadow-lg hover:shadow-2xl hover:scale-105"
            >
              Enter App
              <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'auth') {
    return (
      <AuthForm
        onSuccess={() => checkUser()}
        onRegisterSuccess={async (userId) => {
          setNewUserId(userId);
          await checkUserProfile(userId);
          setView('dashboard');
        }}
      />
    );
  }

  if (!user && view !== 'welcome' && view !== 'auth') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-700 to-cyan-500 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400"></div>
      </div>
    );
  }

  if (view === 'dashboard') {
    const currentUserId = newUserId || user?.id;
    return (
      <Dashboard
        userId={currentUserId!}
        onNavigateToTeam={() => setView('pickteam')}
        onNavigateToTactic={() => setView('picktactic')}
        onNavigateToPlayers={() => setView('pickplayers')}
        onNavigateToMyTeam={() => setView('myteam')}
        onNavigateToEleven={() => setView('pickeleven')}
        onNavigateToLeaderboard={() => setView('leaderboard')}
        onNavigateToAuction={() => setView('auction')}
        onNavigateToTopPlayers={() => setView('topplayers')}
        onNavigateToLeague={() => setView('league')}
        onNavigateToTutorial={() => setView('tutorial')}
        onNavigateToSettings={() => setView('settings')}
        onNavigateToAdmin={() => setView('admin')}
        onLogout={handleLogout}
        isAdmin={isAdmin}
      />
    );
  }

  if (view === 'leaderboard') {
    return (
      <Leaderboard
        onBack={() => setView('dashboard')}
      />
    );
  }

  if (view === 'pickteam') {
    const currentUserId = newUserId || user?.id;
    return (
      <div className="relative">
        {isAdmin && (
          <div className="absolute top-4 right-4 z-50 flex gap-2">
            <button
              onClick={() => setView('dashboard')}
              className="p-2 bg-blue-800 border border-cyan-500/50 text-cyan-300 rounded-lg hover:bg-blue-700 transition-colors"
              title="Dashboard"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => setView('picktactic')}
              className="p-2 bg-blue-800 border border-cyan-500/50 text-cyan-300 rounded-lg hover:bg-blue-700 transition-colors"
              title="Next"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}
        <PickTeam
          userId={currentUserId!}
          onComplete={() => setView('dashboard')}
        />
      </div>
    );
  }

  if (view === 'picktactic') {
    const currentUserId = newUserId || user?.id;
    return (
      <div className="relative">
        {isAdmin && (
          <div className="absolute top-4 right-4 z-50 flex gap-2">
            <button
              onClick={() => setView('dashboard')}
              className="p-2 bg-blue-800 border border-cyan-500/50 text-cyan-300 rounded-lg hover:bg-blue-700 transition-colors"
              title="Dashboard"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => setView('pickteam')}
              className="p-2 bg-blue-800 border border-cyan-500/50 text-cyan-300 rounded-lg hover:bg-blue-700 transition-colors"
              title="Pick Team"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => setView('pickplayers')}
              className="p-2 bg-blue-800 border border-cyan-500/50 text-cyan-300 rounded-lg hover:bg-blue-700 transition-colors"
              title="Next"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}
        <PickTactic
          userId={currentUserId!}
          onTacticSelected={() => setView('dashboard')}
        />
      </div>
    );
  }

  if (view === 'pickplayers') {
    const currentUserId = newUserId || user?.id;
    return (
      <div className="relative">
        {isAdmin && (
          <div className="absolute top-4 right-4 z-50 flex gap-2">
            <button
              onClick={() => setView('dashboard')}
              className="p-2 bg-blue-800 border border-cyan-500/50 text-cyan-300 rounded-lg hover:bg-blue-700 transition-colors"
              title="Dashboard"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => setView('picktactic')}
              className="p-2 bg-blue-800 border border-cyan-500/50 text-cyan-300 rounded-lg hover:bg-blue-700 transition-colors"
              title="Pick Tactic"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          </div>
        )}
        <PickPlayersFlexible
          userId={currentUserId!}
          teamValue={selectedTeamValue}
          onComplete={() => setView('dashboard')}
          onBack={() => setView('dashboard')}
        />
      </div>
    );
  }

  if (view === 'myteam') {
    const currentUserId = newUserId || user?.id;
    return (
      <MyTeam
        userId={currentUserId!}
        onComplete={() => setView('pickeleven')}
        onBack={() => setView('dashboard')}
      />
    );
  }

  if (view === 'pickeleven') {
    const currentUserId = newUserId || user?.id;
    return (
      <PickEleven
        userId={currentUserId!}
        onComplete={() => {}}
        onBack={() => setView('dashboard')}
      />
    );
  }

  if (view === 'auction') {
    const currentUserId = newUserId || user?.id;
    return (
      <AuctionPlayer
        userId={currentUserId!}
        onBack={() => setView('dashboard')}
      />
    );
  }

  if (view === 'topplayers') {
    return (
      <TopPlayers
        onBack={() => setView('dashboard')}
      />
    );
  }

  if (view === 'league') {
    const currentUserId = newUserId || user?.id;
    return (
      <MyLeague
        userId={currentUserId!}
        onBack={() => setView('dashboard')}
      />
    );
  }

  if (view === 'tutorial') {
    return (
      <Tutorial
        onBack={() => setView('dashboard')}
      />
    );
  }

  if (view === 'settings') {
    const currentUserId = newUserId || user?.id;
    return (
      <Settings
        userId={currentUserId!}
        onBack={() => setView('dashboard')}
      />
    );
  }

  if (view === 'admin') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-700 to-cyan-500 py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <AdminPanel onNavigateToDashboard={() => setView('dashboard')} />
        </div>
      </div>
    );
  }

  return null;
}

function App() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user: currentUser } }) => {
      setUser(currentUser);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <LanguageProvider userId={user?.id || null}>
      <AppContent />
    </LanguageProvider>
  );
}

export default App;
