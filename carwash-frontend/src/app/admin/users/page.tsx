'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/src/lib/api';
import {
  Users,
  UserPlus,
  Trash2,
  ArrowLeft,
  ShieldCheck,
  User as UserIcon,
  AlertCircle,
  CheckCircle2,
  Mail,
  Clock,
  KeyRound
} from 'lucide-react';

interface UserItem {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'OPERATOR';
  isActivated: boolean;
  createdAt: string;
  _count?: {
    shifts: number;
  };
}

export default function UsersManagementPage() {
  const router = useRouter();

  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form state (без пароля!)
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'OPERATOR' | 'ADMIN'>('OPERATOR');

  // Alerts
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedRole = localStorage.getItem('role');

    if (!token || storedRole !== 'ADMIN') {
      router.push('/login');
      return;
    }

    fetchUsers();
  }, [router]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/users');
      setUsers(res.data);
    } catch (error: any) {
      console.error('Failed to load users:', error);
      setErrorMsg(error.response?.data?.error || 'Failed to load staff list.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setSubmitting(true);

    try {
      const res = await api.post('/users', {
        name,
        email,
        role
      });

      setUsers((prev) => [res.data, ...prev]);
      setName('');
      setEmail('');
      setRole('OPERATOR');
      setSuccessMsg(
        `Account for "${res.data.name}" created! They will set their own password on first login.`
      );
    } catch (error: any) {
      setErrorMsg(error.response?.data?.error || 'Failed to create user.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetPassword = async (user: UserItem) => {
    if (
      !confirm(
        `Reset password for "${user.name}"? They will be asked to create a new password on their next login.`
      )
    ) {
      return;
    }

    setErrorMsg('');
    setSuccessMsg('');

    try {
      await api.patch(`/users/${user.id}/reset-password`);
      setUsers((prev) =>
        prev.map((item) => (item.id === user.id ? { ...item, isActivated: false } : item))
      );
      setSuccessMsg(`Password reset for "${user.name}".`);
    } catch (error: any) {
      setErrorMsg(error.response?.data?.error || 'Failed to reset password.');
    }
  };

  const handleDeleteUser = async (user: UserItem) => {
    if (!confirm(`Are you sure you want to delete user "${user.name}" (${user.email})?`)) {
      return;
    }

    setErrorMsg('');
    setSuccessMsg('');

    try {
      await api.delete(`/users/${user.id}`);
      setUsers((prev) => prev.filter((item) => item.id !== user.id));
      setSuccessMsg(`User "${user.name}" has been deleted.`);
    } catch (error: any) {
      setErrorMsg(
        error.response?.data?.error ||
          'Failed to delete user. They may have existing shifts in history.'
      );
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/admin"
            className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl hover:bg-slate-800 transition"
          >
            <ArrowLeft className="w-5 h-5 text-slate-400" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Users className="w-6 h-6 text-indigo-400" /> Staff & Users
            </h1>
            <p className="text-slate-400 text-sm">
              Invite operators and admins — employees set their own password on first login
            </p>
          </div>
        </div>
      </div>

      {/* Feedback alerts */}
      {errorMsg && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-xl flex items-center gap-3 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-4 rounded-xl flex items-center gap-3 text-sm">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Invite / Create User Form */}
        <form
          onSubmit={handleCreateUser}
          className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4 h-fit"
        >
          <h2 className="text-lg font-semibold mb-2">Add New Employee</h2>

          <div>
            <label className="block text-xs text-slate-400 uppercase mb-1">Full Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Alex Johnson"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm focus:border-indigo-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs text-slate-400 uppercase mb-1">Email (Login)</label>
            <input
              type="email"
              required
              placeholder="operator@washsaas.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm focus:border-indigo-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs text-slate-400 uppercase mb-1">System Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as 'OPERATOR' | 'ADMIN')}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm focus:border-indigo-500 outline-none"
            >
              <option value="OPERATOR">OPERATOR (Wash Bay POS)</option>
              <option value="ADMIN">ADMIN (Full Management)</option>
            </select>
          </div>

          <p className="text-xs text-slate-500 bg-slate-950/60 border border-slate-800 rounded-xl p-3">
            No temporary password needed — the employee will create their personal password when
            signing in with this email for the first time.
          </p>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 text-white font-medium py-2.5 rounded-xl flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <UserPlus className="w-4 h-4" /> {submitting ? 'Creating...' : 'Create Employee'}
          </button>
        </form>

        {/* Right Column: Users List */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl h-fit">
          <div className="p-6 border-b border-slate-800 flex justify-between items-center">
            <h3 className="text-base font-semibold">Registered Staff</h3>
            <span className="text-xs text-slate-400 bg-slate-800 px-3 py-1 rounded-full">
              Total: {users.length}
            </span>
          </div>

          {loading ? (
            <div className="p-6 text-center text-slate-400 text-sm">Loading users...</div>
          ) : users.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm">No users found.</div>
          ) : (
            <div className="divide-y divide-slate-800/70">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="p-5 flex items-center justify-between gap-4 hover:bg-slate-800/30 transition"
                >
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-sm">{user.name}</span>

                      {user.role === 'ADMIN' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 px-2 py-0.5 rounded-full">
                          <ShieldCheck className="w-3 h-3" /> ADMIN
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                          <UserIcon className="w-3 h-3" /> OPERATOR
                        </span>
                      )}

                      {!user.isActivated && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full">
                          <Clock className="w-3 h-3" /> Awaiting Password Setup
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <Mail className="w-3.5 h-3.5" /> {user.email}
                      </span>
                      {user._count !== undefined && <span>Shifts: {user._count.shifts}</span>}
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    {user.isActivated && (
                      <button
                        onClick={() => handleResetPassword(user)}
                        className="p-2 text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 rounded-xl transition cursor-pointer"
                        title="Reset password"
                      >
                        <KeyRound className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteUser(user)}
                      className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition cursor-pointer"
                      title="Delete user"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}