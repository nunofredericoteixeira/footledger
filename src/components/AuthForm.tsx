import { useState } from 'react';
import { Mail, Lock, ArrowRight } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface AuthFormProps {
  onSuccess: () => void;
  onRegisterSuccess: (userId: string) => void;
}

type AuthMode = 'login' | 'register' | 'forgot';

export default function AuthForm({ onSuccess, onRegisterSuccess }: AuthFormProps) {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (mode === 'forgot') {
      setLoading(true);
      try {
        const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/reset-password`;
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to reset password');
        }

        setSuccessMessage(`Your new password is: ${data.newPassword}. Please save it securely!`);
        setEmail('');
      } catch (err: any) {
        setError(err.message || 'Failed to reset password');
      } finally {
        setLoading(false);
      }
      return;
    }

    if (mode === 'register' && password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      if (mode === 'login') {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) throw signInError;
        onSuccess();
      } else {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });

        if (signUpError) throw signUpError;
        if (data.user) {
          onRegisterSuccess(data.user.id);
        }
      }
    } catch (err: any) {
      setError(err.message || `Failed to ${mode === 'login' ? 'sign in' : 'sign up'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-cyan-600 to-green-500 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-black/40 backdrop-blur-md rounded-2xl shadow-2xl p-8 border border-cyan-400/30 relative z-20">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-white mb-2">
              {mode === 'login' ? 'Welcome Back' : mode === 'register' ? 'Create Account' : 'Reset Password'}
            </h2>
            <p className="text-cyan-200">
              {mode === 'login' ? 'Sign in to continue' : mode === 'register' ? 'Register to get started' : 'Enter your email to reset your password'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-cyan-200 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-cyan-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-11 pr-4 py-3 bg-blue-900 border border-cyan-500/30 text-white rounded-lg focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition-all"
                  placeholder="your@email.com"
                />
              </div>
            </div>

            {mode !== 'forgot' && (
              <div>
                <label className="block text-sm font-medium text-cyan-200 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-cyan-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full pl-11 pr-4 py-3 bg-blue-900 border border-cyan-500/30 text-white rounded-lg focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition-all"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            )}

            {mode === 'register' && (
              <div>
                <label className="block text-sm font-medium text-cyan-200 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-cyan-400" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="w-full pl-11 pr-4 py-3 bg-blue-900 border border-cyan-500/30 text-white rounded-lg focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition-all"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-500/20 border border-red-500 text-red-200 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {successMessage && (
              <div className="bg-emerald-500/20 border border-emerald-500 text-emerald-200 px-4 py-3 rounded-lg text-sm">
                {successMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="group w-full py-3 px-4 bg-cyan-400 text-blue-900 rounded-lg hover:bg-cyan-300 transition-all shadow-lg hover:shadow-2xl disabled:bg-gray-600 disabled:cursor-not-allowed font-bold text-lg flex items-center justify-center gap-2"
            >
              {loading ? (
                'Processing...'
              ) : (
                <>
                  {mode === 'login' ? 'Sign In' : mode === 'register' ? 'Create Account' : 'Send Reset Link'}
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center space-y-3">
            {mode === 'login' && (
              <button
                onClick={() => {
                  setMode('forgot');
                  setError('');
                  setSuccessMessage('');
                }}
                className="text-cyan-300 hover:text-cyan-200 transition-colors text-sm block w-full"
              >
                Forgot your password?
              </button>
            )}
            <button
              onClick={() => {
                setMode(mode === 'login' ? 'register' : 'login');
                setError('');
                setSuccessMessage('');
                setConfirmPassword('');
              }}
              className="text-cyan-300 hover:text-cyan-200 transition-colors text-sm block w-full"
            >
              {mode === 'login' ? (
                <>
                  Don't have an account? <span className="font-bold">Sign up</span>
                </>
              ) : (
                <>
                  Already have an account? <span className="font-bold">Sign in</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
