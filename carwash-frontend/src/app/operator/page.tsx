'use client';
import { useState, useEffect } from 'react';
import { api } from '@/src/lib/api';
import { Play, Square, PlusCircle, DollarSign, LogOut, CheckCircle2 } from 'lucide-react';

export default function OperatorDashboard() {
  const [boxes, setBoxes] = useState<any[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);
  const [activeShift, setActiveShift] = useState<any>(null);
  const [selectedBox, setSelectedBox] = useState('');
  const [startCash, setStartCash] = useState(0);
  const [selectedProgram, setSelectedProgram] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [successMsg, setSuccessMsg] = useState('');
  const [shifts, setShifts] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const boxesRes = await api.get('/boxes');
      const progRes = await api.get('/programs');
      const shiftsRes = await api.get('/shifts');
      
      setBoxes(boxesRes.data);
      setPrograms(progRes.data);
      setShifts(shiftsRes.data);

      // searcing of active shifts
      const active = shiftsRes.data.find((s: any) => s.status === 'ACTIVE');
      setActiveShift(active || null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleStartShift = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const userId = localStorage.getItem('userId');
      const res = await api.post('/shifts/start', {
        userId,
        boxId: selectedBox,
        startCash: Number(startCash)
      });
      setActiveShift(res.data);
      setSuccessMsg('Shift started successfully!');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to start shift');
    }
  };

  const handleEndShift = async () => {
    if (!activeShift) return;
    const endCash = prompt('Enter cash amount in register at closing:');
    if (endCash === null) return;

    try {
      await api.post(`/shifts/${activeShift.id}/end`, { endCash: Number(endCash) });
      setActiveShift(null);
      setSuccessMsg('Shift closed successfully!');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to end shift');
    }
  };

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeShift) return;
    try {
      await api.post('/transactions', {
        shiftId: activeShift.id,
        programId: selectedProgram,
        paymentMethod
      });
      setSuccessMsg('Service/Transaction added successfully!');
      setSelectedProgram('');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to add service');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <header className="flex justify-between items-center bg-slate-900 border border-slate-800 p-6 rounded-2xl">
          <div>
            <h1 className="text-xl font-bold">Operator Dashboard</h1>
            <p className="text-slate-400 text-sm">Manage your active shift and register car wash services</p>
          </div>
          <button 
            onClick={() => { localStorage.clear(); window.location.href = '/login'; }}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-xl text-sm transition"
          >
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </header>

        {successMsg && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm p-4 rounded-xl flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5" /> {successMsg}
          </div>
        )}

        {!activeShift ? (
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2"><Play className="w-5 h-5 text-emerald-500" /> Start New Shift</h2>
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
                  {boxes.map((b) => {
    
         const isOccupied = shifts.some((s: any) => s.boxId === b.id && s.status === 'ACTIVE');

    return (
      <option key={b.id} value={b.id} disabled={isOccupied}>
        {b.name} {isOccupied ? '❌ (Occupied)' : '✅ (Available)'}
      </option>
    );
  })}
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-400 uppercase mb-1">Starting Cash</label>
                <input
                  type="number"
                  value={startCash}
                  onChange={(e) => setStartCash(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm"
                  placeholder="0.00"
                />
              </div>
              <div className="flex items-end">
                <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 py-2.5 rounded-xl font-medium text-sm transition">
                  Start Shift
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-emerald-950/30 border border-emerald-500/20 p-6 rounded-2xl flex justify-between items-center">
              <div>
                <span className="inline-block bg-emerald-500/20 text-emerald-400 text-xs px-2.5 py-1 rounded-full font-medium mb-2">SHIFT ACTIVE</span>
                <h2 className="text-lg font-bold">Working on Shift</h2>
                <p className="text-sm text-slate-400">Started with cash: ${activeShift.startCash}</p>
              </div>
              <button onClick={handleEndShift} className="flex items-center gap-2 bg-red-600 hover:bg-red-500 px-4 py-2.5 rounded-xl text-sm font-medium transition">
                <Square className="w-4 h-4" /> End Shift
              </button>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
              <h2 className="text-lg font-semibold flex items-center gap-2"><PlusCircle className="w-5 h-5 text-indigo-500" /> Register Wash Service</h2>
              <form onSubmit={handleAddTransaction} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 uppercase mb-1">Wash Program / Service</label>
                  <select
                    value={selectedProgram}
                    onChange={(e) => setSelectedProgram(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm"
                  >
                    <option value="">Select Service...</option>
                    {programs.map((p) => (
                      <option key={p.id} value={p.id}>{p.name} (${p.price})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 uppercase mb-1">Payment Method</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm"
                  >
                    <option value="CASH">Cash</option>
                    <option value="CARD">Card</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 py-2.5 rounded-xl font-medium text-sm transition">
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