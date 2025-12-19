import { useState, useEffect } from 'react';
import { ChevronLeft, Settings as SettingsIcon, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useLanguage } from '../lib/LanguageContext';
import { getTranslation } from '../lib/translations';

interface SettingsProps {
  userId: string;
  onBack: () => void;
}

function Settings({ userId, onBack }: SettingsProps) {
  const { language } = useLanguage();
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    loadUserEmail();
  }, [userId]);

  const loadUserEmail = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.email) {
      setEmail(user.email);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setError('');

    if (newPassword !== confirmPassword) {
      setError(getTranslation('screens.passwordMismatch', language));
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (updateError) throw updateError;

      setMessage(getTranslation('screens.passwordChanged', language));
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setError(err.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-800 to-gray-700 relative overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center opacity-15 pointer-events-none"
        style={{ backgroundImage: "url('/Campo de futebol.png')" }}
      />
      <div
        className="absolute inset-0 bg-contain bg-center bg-no-repeat opacity-25 pointer-events-none"
        style={{
          backgroundImage: "url('/Settings.png')",
          maskImage: "radial-gradient(ellipse 80% 70% at 50% 40%, black 15%, rgba(0,0,0,0.5) 50%, transparent 75%)",
          WebkitMaskImage: "radial-gradient(ellipse 80% 70% at 50% 40%, black 15%, rgba(0,0,0,0.5) 50%, transparent 75%)"
        }}
      />

      <div className="bg-gradient-to-b from-black to-transparent py-6 px-6 relative z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <button
            onClick={onBack}
            className="p-2 bg-gray-700/50 hover:bg-gray-700/70 border border-gray-500/50 text-gray-300 rounded-lg transition-all hover:scale-110"
            title={getTranslation('dashboard.back', language)}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <img
            src="/FL_Logo.png"
            alt="FootLedger"
            className="w-12 h-12 object-contain drop-shadow"
          />
          <div className="w-10" />
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 pb-12 relative z-10">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-3">
            <img src="/Settings.png" alt="" className="w-24 h-24 object-contain" />
          </div>
          <h1 className="text-5xl font-bold text-white mb-3">{getTranslation('screens.settings', language)}</h1>
          <p className="text-gray-300 text-lg">{getTranslation('screens.manageAccount', language)}</p>
        </div>

        <div className="bg-black/60 backdrop-blur-md border-2 border-gray-600 rounded-xl p-8">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <Mail className="w-6 h-6" />
            {getTranslation('screens.accountSettings', language)}
          </h2>

          <div className="mb-8">
            <label className="block text-gray-300 mb-2 font-semibold">Email</label>
            <div className="bg-gray-800/50 border border-gray-600 rounded-lg px-4 py-3">
              <p className="text-white">{email}</p>
            </div>
          </div>

          <div className="border-t border-gray-700 pt-8">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Lock className="w-5 h-5" />
              {getTranslation('screens.changePassword', language)}
            </h3>

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-gray-300 mb-2 font-semibold">
                  {getTranslation('screens.newPassword', language)}
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-gray-800/50 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-gray-400"
                    placeholder="••••••••"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
                  >
                    {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-gray-300 mb-2 font-semibold">
                  {getTranslation('screens.confirmPassword', language)}
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-gray-800/50 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-gray-400"
                    placeholder="••••••••"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {message && (
                <div className="bg-green-500/20 border border-green-500 rounded-lg px-4 py-3">
                  <p className="text-green-300 text-sm">{message}</p>
                </div>
              )}

              {error && (
                <div className="bg-red-500/20 border border-red-500 rounded-lg px-4 py-3">
                  <p className="text-red-300 text-sm">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-500 hover:to-gray-600 text-white font-bold py-3 px-6 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Updating...' : getTranslation('screens.changePassword', language)}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Settings;
