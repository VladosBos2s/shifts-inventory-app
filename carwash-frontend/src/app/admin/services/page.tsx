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

  const [programs, setPrograms] = useState<Program[]>([]);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [foamUsage, setFoamUsage] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');

    if (!token || role !== 'ADMIN') {
      router.push('/login');
      return;
    }

    fetchPrograms();
  }, [router]);

  const fetchPrograms = async () => {
    try {
      setLoading(true);
      const res = await api.get('/programs');
      setPrograms(res.data);
    } catch (error) {
      console.error('Error fetching programs:', error);
      setErrorMsg('Не удалось загрузить список программ');
    } finally {
      setLoading(false);
    }
  };

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
      setSuccessMsg('Программа успешно добавлена!');
    } catch (error: any) {
      console.error('Failed to create program:', error);
      setErrorMsg(error.response?.data?.error || 'Ошибка при создании программы');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteProgram = async (id: string, programName: string) => {
    if (!confirm(`Вы действительно хотите удалить программу "${programName}"?`)) {
      return;
    }

    setErrorMsg('');
    setSuccessMsg('');

    try {
      await api.delete(`/programs/${id}`);
      setPrograms((prev) => prev.filter((item) => item.id !== id));
      setSuccessMsg(`Программа "${programName}" удалена`);
    } catch (error: any) {
      console.error('Failed to delete program:', error);
      setErrorMsg(error.response?.data?.error || 'Ошибка при удалении программы');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 md:p-10">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Шапка */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl hover:bg-slate-800 transition">
              <ArrowLeft className="w-5 h-5 text-slate-400" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-indigo-400" /> Wash Programs
              </h1>
              <p className="text-slate-400 text-sm">Управление программами мойки, ценами и расходом пены</p>
            </div>
          </div>
        </div>

        {/* Уведомления */}
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
          
          {/* Левая колонка: Форма создания */}
          <form onSubmit={handleCreateProgram} className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4 h-fit">
            <h2 className="text-lg font-semibold mb-2">Добавить программу</h2>
            
            <div>
              <label className="block text-xs text-slate-400 uppercase mb-1">Название программы</label>
              <input
                type="text"
                required
                placeholder="например, Экспресс мойка"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm focus:border-indigo-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 uppercase mb-1">Цена ($ / руб)</label>
              <input
                type="number"
                required
                min="0"
                step="1"
                placeholder="например, 500"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm focus:border-indigo-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 uppercase mb-1 flex items-center gap-1.5">
                <FlaskConical className="w-3.5 h-3.5 text-indigo-400" />
                Расход пены (мл)
              </label>
              <input
                type="number"
                required
                min="0"
                step="1"
                placeholder="например, 150"
                value={foamUsage}
                onChange={(e) => setFoamUsage(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm focus:border-indigo-500 outline-none"
              />
              <p className="text-xs text-slate-500 mt-1">Автоматически спишется со склада при каждой мойке</p>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 text-white font-medium py-2.5 rounded-xl flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" /> {submitting ? 'Создание...' : 'Создать программу'}
            </button>
          </form>

          {/* Правая колонка: Список программ */}
          <div className="lg:col-span-2 space-y-4">
            {loading ? (
              <p className="text-slate-400 text-sm">Загрузка программ...</p>
            ) : programs.length === 0 ? (
              <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl text-center text-slate-400 text-sm">
                Программы мойки пока не созданы. Добавьте первую с помощью формы слева!
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
                      <span>Расход пены: <strong className="text-slate-300">{prog.foamUsage} мл</strong></span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeleteProgram(prog.id, prog.name)}
                    className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition cursor-pointer shrink-0"
                    title="Удалить программу"
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
