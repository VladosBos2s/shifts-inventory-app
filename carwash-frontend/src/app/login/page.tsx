'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/src/lib/api';
import { Lock, Mail, KeyRound, ArrowLeft, CheckCircle2 } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // First-time password setup state
  const [isSetupMode, setIsSetupMode] = useState(false);
  const [employeeName, setEmployeeName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const completeAuthRedirect = (data: any) => {
    localStorage.setItem('token', data.token);
    localStorage.setItem('role', data.user.role);
    localStorage.setItem('userId', data.user.id);
    if (data.user.name) {
      localStorage.setItem('userName', data.user.name);
    }

    if (data.user.role === 'ADMIN') {
      router.push('/admin');
    } else {
      router.push('/operator');
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await api.post('/auth/login', { email, password });

      // Created account by admin without password
      if (res.data.requiresPasswordSetup) {
        setEmployeeName(res.data.name || '');
        setIsSetupMode(true);
        setPassword('');
        return;
      }

      completeAuthRedirect(res.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleSetupPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 4) {
      setError('Password must be at least 4 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const res = await api.post('/auth/setup-password', {
        email,
        password: newPassword
      });

      completeAuthRedirect(res.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to set up password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">
        {!isSetupMode ? (
          <>
            <h1 className="text-2xl font-bold text-white mb-2">Welcome Back</h1>
            <p className="text-slate-400 mb-6 text-sm">
              Sign in to your Car Wash Operations account
            </p>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 rounded-xl mb-4">
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1 uppercase tracking-wider">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 w-5 h-5 text-slate-500" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-10 py-2.5 text-white focus:outline-none focus:border-indigo-500 text-sm"
                    placeholder="name@wash.com"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Password
                  </label>
                  <span className="text-[11px] text-slate-500">
                    First time? Leave blank &amp; click Sign In
                  </span>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 w-5 h-5 text-slate-500" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-10 py-2.5 text-white focus:outline-none focus:border-indigo-500 text-sm"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 text-white font-medium py-2.5 rounded-xl transition duration-200 shadow-lg shadow-indigo-600/20 text-sm cursor-pointer"
              >
                {loading ? 'Checking...' : 'Sign In'}
              </button>
            </form>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => {
                setIsSetupMode(false);
                setError('');
                setNewPassword('');
                setConfirmPassword('');
              }}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white mb-4 transition cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
            </button>

            <div className="flex items-center gap-2.5 mb-2">
              <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
                <KeyRound className="w-5 h-5" />
              </div>
              <h1 className="text-xl font-bold text-white">
                {employeeName ? `Welcome, ${employeeName}!` : 'Activate Account'}
              </h1>
            </div>

            <p className="text-slate-400 mb-6 text-sm">
              Set up your personal password for <span className="text-slate-200">{email}</span>
            </p>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 rounded-xl mb-4">
                {error}
              </div>
            )}

            <form onSubmit={handleSetupPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1 uppercase tracking-wider">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 w-5 h-5 text-slate-500" />
                  <input
                    type="password"
                    required
                    minLength={4}
                    autoFocus
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-10 py-2.5 text-white focus:outline-none focus:border-emerald-500 text-sm"
                    placeholder="Min 4 characters"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1 uppercase tracking-wider">
                  Confirm Password
                </label>
                <div className="relative">
                  <CheckCircle2 className="absolute left-3 top-3 w-5 h-5 text-slate-500" />
                  <input
                    type="password"
                    required
                    minLength={4}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-10 py-2.5 text-white focus:outline-none focus:border-emerald-500 text-sm"
                    placeholder="Repeat password"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-600/50 text-white font-medium py-2.5 rounded-xl transition duration-200 shadow-lg shadow-emerald-600/20 text-sm cursor-pointer"
              >
                {loading ? 'Activating...' : 'Save Password & Enter'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}