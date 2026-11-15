'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/src/lib/api';
import { Plus, Trash2, ArrowLeft, Sparkles, FlaskConical, AlertCircle, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

interface Program {
  id: string;
  name: string;
  price: number;
  foamUsage: number;
}

export default function ServicesManagement() {
  const router = useRouter();

  // State management
  const [programs, setPrograms] = useState<Program[]>([]);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [foamUsage, setFoamUsage] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Validate authentication and load wash programs
  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');

    if (!token || role !== 'ADMIN') {
      router.push('/login');
      return;
    }

    fetchPrograms();
  }, [router]);

  // Fetch wash programs from the API
  const fetchPrograms = async () => {
    try {
      setLoading(true);
      const res = await api.get('/programs');
      setPrograms(res.data);
    } catch (error) {
      console.error('Error fetching programs:', error);
      setErrorMsg('Failed to load wash programs.');
    } finally {
      setLoading(false);
    }
  };

  // Create a new wash program
  const handleCreateProgram = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setSubmitting(true);

    try {
      const res = await api.post('/programs', {
        name,
        price: Number(price),
        foamUsage: Number(foamUsage)
      });

      setPrograms((prev) => [...prev, res.data]);
      setName('');
      setPrice('');
      setFoamUsage('');
      setSuccessMsg('Wash program created successfully!');
    } catch (error: any) {
      console.error('Failed to create program:', error);
      setErrorMsg(error.response?.data?.error || 'Failed to create wash program.');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete an existing wash program
  const handleDeleteProgram = async (id: string, programName: string) => {
    if (!confirm(`Are you sure you want to delete the program "${programName}"?`)) {
      return;
    }

    setErrorMsg('');
    setSuccessMsg('');

    try {
      await api.delete(`/programs/${id}`);
      setPrograms((prev) => prev.filter((item) => item.id !== id));
      setSuccessMsg(`Program "${programName}" has been deleted.`);
    } catch (error: any) {
      console.error('Failed to delete program:', error);
      setErrorMsg(error.response?.data?.error || 'Failed to delete program. It may be linked to existing transactions.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 md:p-10">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl hover:bg-slate-800 transition">
              <ArrowLeft className="w-5 h-5 text-slate-400" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-indigo-400" /> Wash Programs
              </h1>
              <p className="text-slate-400 text-sm">Manage service tiers, pricing, and chemical consumption</p>
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
          
          {/* Left Column: Create Form */}
          <form onSubmit={handleCreateProgram} className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4 h-fit">
            <h2 className="text-lg font-semibold mb-2">Add New Program</h2>
            
            <div>
              <label className="block text-xs text-slate-400 uppercase mb-1">Program Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Express Wash"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm focus:border-indigo-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 uppercase mb-1">Price ($)</label>
              <input
                type="number"
                required
                min="0"
                step="1"
                placeholder="e.g. 25"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm focus:border-indigo-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 uppercase mb-1 flex items-center gap-1.5">
                <FlaskConical className="w-3.5 h-3.5 text-indigo-400" />
                Foam Usage (ml)
              </label>
              <input
                type="number"
                required
                min="0"
                step="1"
                placeholder="e.g. 150"
                value={foamUsage}
                onChange={(e) => setFoamUsage(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm focus:border-indigo-500 outline-none"
              />
              <p className="text-xs text-slate-500 mt-1">Automatically deducted from warehouse stock upon each wash</p>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 text-white font-medium py-2.5 rounded-xl flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" /> {submitting ? 'Creating...' : 'Create Program'}
            </button>
          </form>

          {/* Right Column: Programs List */}
          <div className="lg:col-span-2 space-y-4">
            {loading ? (
              <p className="text-slate-400 text-sm">Loading programs...</p>
            ) : programs.length === 0 ? (
              <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl text-center text-slate-400 text-sm">
                No wash programs found. Add your first program using the form on the left!
              </div>
            ) : (
              programs.map((prog) => (
                <div key={prog.id} className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-base">{prog.name}</h3>
                      <span className="bg-emerald-500/10 text-emerald-400 text-xs font-bold px-2.5 py-1 rounded-lg">
                        ${prog.price}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <FlaskConical className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Foam Usage: <strong className="text-slate-300">{prog.foamUsage} ml</strong></span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeleteProgram(prog.id, prog.name)}
                    className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition cursor-pointer shrink-0"
                    title="Delete program"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
