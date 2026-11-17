'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/src/lib/api';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Warehouse,
  Clock,
  User,
  CheckCircle2,
  AlertCircle,
  Power,
  ChevronDown,
  ChevronUp,
  Receipt
} from 'lucide-react';

interface TransactionItem {
  id: string;
  amount: number;
  paymentMethod: string;
  createdAt: string;
  program?: {
    name: string;
  };
}

interface ShiftItem {
  id: string;
  startTime: string;
  endTime: string | null;
  startCash: number;
  expectedCash: number | null;
  actualCash: number | null;
  isClosed: boolean;
  user?: {
    id: string;
    name: string;
    email: string;
  };
  transactions: TransactionItem[];
}

interface BoxItem {
  id: string;
  name: string;
  isActive: boolean;
  shifts: ShiftItem[];
}

export default function BoxesManagementPage() {
  const router = useRouter();

  const [boxes, setBoxes] = useState<BoxItem[]>([]);
  const [selectedBoxId, setSelectedBoxId] = useState<string | null>(null);
  const [expandedShiftId, setExpandedShiftId] = useState<string | null>(null);

  // Form state
  const [newBoxName, setNewBoxName] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Alerts
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');

    if (!token || role !== 'ADMIN') {
      router.push('/login');
      return;
    }

    fetchBoxes();
  }, [router]);

  const fetchBoxes = async () => {
    try {
      setLoading(true);
      const res = await api.get('/boxes');
      setBoxes(res.data);
      if (res.data.length > 0 && !selectedBoxId) {
        setSelectedBoxId(res.data[0].id);
      }
    } catch (error) {
      console.error('Failed to load boxes:', error);
      setErrorMsg('Failed to load wash boxes and shifts.');
    } finally {
      setLoading(false);
    }
  };

  // Create new box
  const handleCreateBox = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBoxName.trim()) return;

    setErrorMsg('');
    setSuccessMsg('');
    setSubmitting(true);

    try {
      const res = await api.post('/boxes', { name: newBoxName });
      const createdBox = { ...res.data, shifts: res.data.shifts || [] };
      setBoxes((prev) => [...prev, createdBox]);
      setSelectedBoxId(createdBox.id);
      setNewBoxName('');
      setSuccessMsg(`Box "${createdBox.name}" created!`);
    } catch (error: any) {
      setErrorMsg(error.response?.data?.error || 'Failed to create box.');
    } finally {
      setSubmitting(false);
    }
  };

  // Toggle active status
  const handleToggleBox = async (box: BoxItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await api.patch(`/boxes/${box.id}/toggle`);
      setBoxes((prev) =>
        prev.map((item) => (item.id === box.id ? { ...item, isActive: res.data.isActive } : item))
      );
      setSuccessMsg(
        `Box "${box.name}" is now ${res.data.isActive ? 'active' : 'deactivated'}.`
      );
    } catch (error: any) {
      setErrorMsg(error.response?.data?.error || 'Failed to update box status.');
    }
  };

  // Delete box
  const handleDeleteBox = async (box: BoxItem, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Delete "${box.name}"?`)) return;

    setErrorMsg('');
    setSuccessMsg('');

    try {
      await api.delete(`/boxes/${box.id}`);
      const remaining = boxes.filter((item) => item.id !== box.id);
      setBoxes(remaining);
      if (selectedBoxId === box.id) {
        setSelectedBoxId(remaining.length > 0 ? remaining[0].id : null);
      }
      setSuccessMsg(`Box "${box.name}" deleted.`);
    } catch (error: any) {
      setErrorMsg(
        error.response?.data?.error ||
          'Cannot delete box with shift history. Deactivate it instead.'
      );
    }
  };

  const selectedBox = boxes.find((b) => b.id === selectedBoxId) || null;

  const formatDateTime = (isoString: string | null) => {
    if (!isoString) return 'In progress';
    return new Date(isoString).toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 md:p-10">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link
              href="/admin"
              className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl hover:bg-slate-800 transition"
            >
              <ArrowLeft className="w-5 h-5 text-slate-400" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Warehouse className="w-6 h-6 text-indigo-400" /> Wash Boxes & Shifts
              </h1>
              <p className="text-slate-400 text-sm">
                Manage car wash bays and inspect shift history & cash reconciliation
              </p>
            </div>
          </div>

          {/* Add Box Form */}
          <form onSubmit={handleCreateBox} className="flex items-center gap-2">
            <input
              type="text"
              required
              placeholder="e.g. Box #1"
              value={newBoxName}
              onChange={(e) => setNewBoxName(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm focus:border-indigo-500 outline-none"
            />
            <button
              type="submit"
              disabled={submitting}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 text-white font-medium px-4 py-2.5 rounded-xl text-sm flex items-center gap-2 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Add Box
            </button>
          </form>
        </div>

        {/* Feedback Alerts */}
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

        {/* Boxes Grid */}
        {loading ? (
          <p className="text-slate-400 text-sm">Loading boxes...</p>
        ) : boxes.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl text-center text-slate-400 text-sm">
            No wash boxes created yet. Add your first box above!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {boxes.map((box) => {
              const activeShift = box.shifts.find((s) => !s.isClosed);
              const isSelected = box.id === selectedBoxId;

              return (
                <div
                  key={box.id}
                  onClick={() => setSelectedBoxId(box.id)}
                  className={`p-5 rounded-2xl border transition cursor-pointer flex flex-col justify-between gap-4 ${
                    isSelected
                      ? 'bg-slate-900 border-indigo-500 ring-1 ring-indigo-500/40'
                      : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
                  } ${!box.isActive ? 'opacity-65' : ''}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-lg">{box.name}</h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Total shifts recorded: {box.shifts.length}
                      </p>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => handleToggleBox(box, e)}
                        title={box.isActive ? 'Deactivate box' : 'Activate box'}
                        className={`p-1.5 rounded-lg transition cursor-pointer ${
                          box.isActive
                            ? 'text-emerald-400 hover:bg-emerald-500/10'
                            : 'text-slate-500 hover:bg-slate-800'
                        }`}
                      >
                        <Power className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => handleDeleteBox(box, e)}
                        title="Delete box"
                        className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Status badge */}
                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                    {!box.isActive ? (
                      <span className="text-slate-400 bg-slate-800 px-2.5 py-1 rounded-full">
                        Deactivated
                      </span>
                    ) : activeShift ? (
                      <span className="inline-flex items-center gap-1.5 text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full font-medium">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        Active: {activeShift.user?.name || 'Worker'}
                      </span>
                    ) : (
                      <span className="text-slate-400 bg-slate-950 border border-slate-800 px-2.5 py-1 rounded-full">
                        Idle / Available
                      </span>
                    )}

                    <span className="text-indigo-400 font-medium">
                      {isSelected ? 'Viewing shifts' : 'Select →'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Selected Box Shifts History */}
        {selectedBox && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-6 border-b border-slate-800 flex flex-wrap justify-between items-center gap-2">
              <div>
                <h2 className="text-lg font-semibold">
                  Shift History — <span className="text-indigo-400">{selectedBox.name}</span>
                </h2>
                <p className="text-xs text-slate-400">
                  Click any shift to inspect individual wash transactions
                </p>
              </div>
              <span className="text-xs bg-slate-800 text-slate-300 px-3 py-1 rounded-full">
                {selectedBox.shifts.length} shifts
              </span>
            </div>

            {selectedBox.shifts.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-sm">
                No shifts have been opened in {selectedBox.name} yet.
              </div>
            ) : (
              <div className="divide-y divide-slate-800/70">
                {selectedBox.shifts.map((shift) => {
                  const totalRevenue = shift.transactions.reduce((acc, tx) => acc + tx.amount, 0);
                  const diff =
                    shift.isClosed &&
                    shift.actualCash !== null &&
                    shift.expectedCash !== null
                      ? shift.actualCash - shift.expectedCash
                      : null;
                  const isExpanded = expandedShiftId === shift.id;

                  return (
                    <div key={shift.id} className="p-5 hover:bg-slate-800/30 transition">
                      <div
                        onClick={() =>
                          setExpandedShiftId(isExpanded ? null : shift.id)
                        }
                        className="flex flex-wrap items-center justify-between gap-4 cursor-pointer"
                      >
                        {/* Worker & Time */}
                        <div className="space-y-1">
                          <div className="flex items-center gap-2.5">
                            <span className="font-semibold text-sm flex items-center gap-1.5">
                              <User className="w-4 h-4 text-indigo-400" />
                              {shift.user?.name || 'Unknown Worker'}
                            </span>
                            {!shift.isClosed ? (
                              <span className="text-[11px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-medium">
                                Open Shift
                              </span>
                            ) : (
                              <span className="text-[11px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full">
                                Closed
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-400 flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" />
                            {formatDateTime(shift.startTime)} — {formatDateTime(shift.endTime)}
                          </p>
                        </div>

                        {/* Financial Summary */}
                        <div className="flex flex-wrap items-center gap-6 text-xs">
                          <div>
                            <span className="text-slate-400 block">Washes / Revenue</span>
                            <strong className="text-sm text-white">
                              {shift.transactions.length} washes (${totalRevenue})
                            </strong>
                          </div>

                          <div>
                            <span className="text-slate-400 block">Start Cash</span>
                            <strong className="text-sm text-slate-200">${shift.startCash}</strong>
                          </div>

                          {shift.isClosed && (
                            <div>
                              <span className="text-slate-400 block">Cash Check (Act / Exp)</span>
                              <div className="flex items-center gap-1.5">
                                <strong className="text-sm text-white">
                                  ${shift.actualCash} / ${shift.expectedCash}
                                </strong>
                                {diff !== null && diff !== 0 && (
                                  <span
                                    className={`px-1.5 py-0.5 rounded font-bold ${
                                      diff < 0
                                        ? 'bg-red-500/20 text-red-400'
                                        : 'bg-amber-500/20 text-amber-400'
                                    }`}
                                  >
                                    {diff > 0 ? `+${diff}` : diff}
                                  </span>
                                )}
                              </div>
                            </div>
                          )}

                          <div className="text-slate-400">
                            {isExpanded ? (
                              <ChevronUp className="w-5 h-5" />
                            ) : (
                              <ChevronDown className="w-5 h-5" />
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Expanded Transactions List */}
                      {isExpanded && (
                        <div className="mt-4 pt-4 border-t border-slate-800/80">
                          {shift.transactions.length === 0 ? (
                            <p className="text-xs text-slate-500">
                              No washes recorded during this shift.
                            </p>
                          ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                              {shift.transactions.map((tx) => (
                                <div
                                  key={tx.id}
                                  className="bg-slate-950 border border-slate-800/90 rounded-xl p-3 flex items-center justify-between text-xs"
                                >
                                  <div className="flex items-center gap-2">
                                    <Receipt className="w-3.5 h-3.5 text-indigo-400" />
                                    <div>
                                      <p className="font-medium text-slate-200">
                                        {tx.program?.name || 'Wash Service'}
                                      </p>
                                      <p className="text-[11px] text-slate-500">
                                        {new Date(tx.createdAt).toLocaleTimeString('en-GB', {
                                          hour: '2-digit',
                                          minute: '2-digit'
                                        })}{' '}
                                        · {tx.paymentMethod}
                                      </p>
                                    </div>
                                  </div>
                                  <span className="font-bold text-emerald-400">${tx.amount}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}