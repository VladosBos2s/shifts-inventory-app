'use client';
import { useState, useEffect } from 'react';
import { api } from '@/src/lib/api';
import { Play, Square, PlusCircle, LogOut, CheckCircle2, AlertCircle } from 'lucide-react';

export default function OperatorDashboard() {
  const [boxes, setBoxes] = useState<any[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);
  const [activeShifts, setActiveShifts] = useState<any[]>([]);
  const [activeShift, setActiveShift] = useState<any>(null);

  const [selectedBox, setSelectedBox] = useState('');
  const [startCash, setStartCash] = useState('');
  const [selectedProgram, setSelectedProgram] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH');

  const [isClosing, setIsClosing] = useState(false);
  const [actualCash, setActualCash] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const userId = localStorage.getItem('userId');
      const [boxesRes, progRes, shiftsRes] = await Promise.all([
        api.get('/boxes'),
        api.get('/programs'),
        api.get('/shifts/active')
      ]);

      setBoxes(boxesRes.data);
      setPrograms(progRes.data);
      setActiveShifts(shiftsRes.data);

      const myShift = shiftsRes.data.find((s: any) => s.userId === userId && !s.isClosed);
      setActiveShift(myShift || null);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Failed to load data');
    }
  };

  const handleStartShift = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      const userId = localStorage.getItem('userId');
      const res = await api.post('/shifts/start', {
        userId,
        boxId: selectedBox,
        startCash: startCash === '' ? 0 : Math.round(Number(startCash))
      });
      setActiveShift(res.data);
      setStartCash('');
      setSuccessMsg('Shift started successfully!');
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Failed to start shift');
    }
  };

  const handleConfirmCloseShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeShift) return;
    setErrorMsg('');

    try {
      const res = await api.post(`/shifts/${activeShift.id}/close`, {
        actualCash: actualCash === '' ? 0 : Math.round(Number(actualCash))
      });
      const diff = res.data.difference;
      setActiveShift(null);
      setIsClosing(false);
      setActualCash('');
      setSuccessMsg(
        `Shift closed! Expected: $${res.data.expectedCash}, Actual: $${res.data.actualCash} (Diff: ${diff >= 0 ? `+${diff}` : diff})`
      );
      fetchData();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Failed to close shift');
    }
  };

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeShift || !selectedProgram) return;
    setErrorMsg('');

    try {
      await api.post('/transactions', {
        shiftId: activeShift.id,
        programId: selectedProgram,
        paymentMethod
      });
      setSuccessMsg('Wash recorded & chemicals deducted!');
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Failed to add service');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <header className="flex justify-between items-center bg-slate-900 border border-slate-800 p-6 rounded-2xl">
          <div>
            <h1 className="text-xl font-bold">Operator Dashboard</h1>
            <p className="text-slate-400 text-sm">Manage your active shift and register washes</p>
          </div>
          <button
            onClick={() => { localStorage.clear(); window.location.href = '/login'; }}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-xl text-sm transition cursor-pointer"
          >
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </header>

        {errorMsg && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-4 rounded-xl flex items-center gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0" /> {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm p-4 rounded-xl flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" /> {successMsg}
          </div>
        )}

        {!activeShift ? (
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Play className="w-5 h-5 text-emerald-500" /> Start New Shift
            </h2>
            <form onSubmit={handleStartShift} className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-slate-400 uppercase mb-1">Select Garage Box</label>
                <select
                  value={selectedBox}
                  onChange={(e) => setSelectedBox(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm"
                >
                  <option value="">Choose Box...</option>
                  {boxes.filter((b) => b.isActive).map((b) => {
                    const isOccupied = activeShifts.some((s) => s.boxId === b.id && !s.isClosed);
                    return (
                      <option key={b.id} value={b.id} disabled={isOccupied}>
                        {b.name} {isOccupied ? '(Occupied)' : '(Available)'}
                      </option>
                    );
                  })}
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-400 uppercase mb-1">Starting Cash ($)</label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  required
                  placeholder="0"
                  value={startCash}
                  onChange={(e) => setStartCash(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm"
                />
              </div>
              <div className="flex items-end">
                <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 py-2.5 rounded-xl font-medium text-sm transition cursor-pointer">
                  Start Shift
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-emerald-950/30 border border-emerald-500/20 p-6 rounded-2xl space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <span className="inline-block bg-emerald-500/20 text-emerald-400 text-xs px-2.5 py-1 rounded-full font-medium mb-2">
                    SHIFT ACTIVE
                  </span>
                  <h2 className="text-lg font-bold">{activeShift.box?.name || 'Working on Shift'}</h2>
                  <p className="text-sm text-slate-400">Started with cash: ${activeShift.startCash}</p>
                </div>
                {!isClosing && (
                  <button
                    onClick={() => setIsClosing(true)}
                    className="flex items-center gap-2 bg-red-600 hover:bg-red-500 px-4 py-2.5 rounded-xl text-sm font-medium transition cursor-pointer"
                  >
                    <Square className="w-4 h-4" /> End Shift
                  </button>
                )}
              </div>

              {isClosing && (
                <form onSubmit={handleConfirmCloseShift} className="pt-4 border-t border-emerald-500/20 flex flex-wrap items-end gap-3">
                  <div className="flex-1 min-w-[200px]">
                    <label className="block text-xs text-slate-300 uppercase mb-1">Actual Cash in Register ($)</label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      required
                      autoFocus
                      placeholder="Enter counted cash..."
                      value={actualCash}
                      onChange={(e) => setActualCash(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-sm"
                    />
                  </div>
                  <button type="button" onClick={() => setIsClosing(false)} className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-sm cursor-pointer">
                    Cancel
                  </button>
                  <button type="submit" className="px-5 py-2.5 bg-red-600 hover:bg-red-500 rounded-xl text-sm font-semibold cursor-pointer">
                    Confirm Close
                  </button>
                </form>
              )}
            </div>

            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-5">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-indigo-500" /> Register Wash Service
              </h2>

              <form onSubmit={handleAddTransaction} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {programs.map((p) => (
                    <button
                      type="button"
                      key={p.id}
                      onClick={() => setSelectedProgram(p.id)}
                      className={`p-3.5 rounded-xl border text-left transition cursor-pointer flex justify-between items-center ${
                        selectedProgram === p.id
                          ? 'bg-indigo-600/20 border-indigo-500 text-white'
                          : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <span className="font-medium text-sm">{p.name}</span>
                      <span className="font-bold text-emerald-400">${p.price}</span>
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2 grid grid-cols-3 gap-2">
                    {['CASH', 'CARD', 'BLIK'].map((method) => (
                      <button
                        type="button"
                        key={method}
                        onClick={() => setPaymentMethod(method)}
                        className={`py-2.5 rounded-xl border text-sm font-medium transition cursor-pointer ${
                          paymentMethod === method
                            ? 'bg-emerald-600/20 border-emerald-500 text-emerald-400'
                            : 'bg-slate-950 border-slate-800 text-slate-400'
                        }`}
                      >
                        {method}
                      </button>
                    ))}
                  </div>

                  <button
                    type="submit"
                    disabled={!selectedProgram}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/40 py-2.5 rounded-xl font-medium text-sm transition cursor-pointer"
                  >
                    Add Transaction
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}