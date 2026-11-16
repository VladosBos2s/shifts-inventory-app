'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/src/lib/api';
import {
  Plus,
  Trash2,
  ArrowLeft,
  Sparkles,
  FlaskConical,
  AlertCircle,
  CheckCircle2,
  X
} from 'lucide-react';
import Link from 'next/link';

interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
}

interface ProgramConsumable {
  id: string;
  inventoryId: string;
  quantity: number;
  inventory: InventoryItem;
}

interface Program {
  id: string;
  name: string;
  price: number;
  consumables: ProgramConsumable[];
}

interface ConsumableInput {
  inventoryId: string;
  quantity: string;
}

export default function ServicesManagement() {
  const router = useRouter();

  // Data state
  const [programs, setPrograms] = useState<Program[]>([]);
  const [inventoryList, setInventoryList] = useState<InventoryItem[]>([]);

  // Form state
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [selectedConsumables, setSelectedConsumables] = useState<ConsumableInput[]>([]);

  // UI state
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

    fetchInitialData();
  }, [router]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [programsRes, inventoryRes] = await Promise.all([
        api.get('/programs'),
        api.get('/inventory')
      ]);
      setPrograms(programsRes.data);
      setInventoryList(inventoryRes.data);
    } catch (error) {
      console.error('Error loading services data:', error);
      setErrorMsg('Failed to load wash programs or inventory items.');
    } finally {
      setLoading(false);
    }
  };

  // Add a new empty chemical row
  const handleAddConsumableRow = () => {
    if (inventoryList.length === 0) {
      setErrorMsg('No chemicals found in warehouse inventory. Add stock items first.');
      return;
    }
    setSelectedConsumables((prev) => [
      ...prev,
      { inventoryId: inventoryList[0].id, quantity: '' }
    ]);
  };

  // Update chemical selection or dosage
  const handleConsumableChange = (
    index: number,
    field: keyof ConsumableInput,
    value: string
  ) => {
    setSelectedConsumables((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, [field]: value } : item))
    );
  };

  // Remove chemical row
  const handleRemoveConsumableRow = (index: number) => {
    setSelectedConsumables((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Create program with consumables
  const handleCreateProgram = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    // Validate consumables
    const validConsumables = selectedConsumables
      .filter((c) => c.inventoryId && Number(c.quantity) > 0)
      .map((c) => ({
        inventoryId: c.inventoryId,
        quantity: Number(c.quantity)
      }));

    if (selectedConsumables.length > 0 && validConsumables.length !== selectedConsumables.length) {
      setErrorMsg('Please specify a valid dosage (> 0) for all selected chemicals.');
      return;
    }

    // Check duplicate chemicals
    const uniqueIds = new Set(validConsumables.map((c) => c.inventoryId));
    if (uniqueIds.size !== validConsumables.length) {
      setErrorMsg('Each chemical can only be added once per program.');
      return;
    }

    setSubmitting(true);

    try {
      const res = await api.post('/programs', {
        name,
        price: Number(price),
        consumables: validConsumables
      });

      setPrograms((prev) => [...prev, res.data]);
      setName('');
      setPrice('');
      setSelectedConsumables([]);
      setSuccessMsg('Wash program created successfully!');
    } catch (error: any) {
      console.error('Failed to create program:', error);
      setErrorMsg(error.response?.data?.error || 'Failed to create wash program.');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete program
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
      setErrorMsg(
        error.response?.data?.error ||
          'Failed to delete program. It may be linked to existing transactions.'
      );
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 md:p-10">
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
                <Sparkles className="w-6 h-6 text-indigo-400" /> Wash Programs
              </h1>
              <p className="text-slate-400 text-sm">
                Manage service tiers, pricing, and warehouse chemical recipes
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
          {/* Left Column: Create Form */}
          <form
            onSubmit={handleCreateProgram}
            className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4 h-fit"
          >
            <h2 className="text-lg font-semibold mb-2">Add New Program</h2>

            <div>
              <label className="block text-xs text-slate-400 uppercase mb-1">
                Program Name
              </label>
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
              <label className="block text-xs text-slate-400 uppercase mb-1">
                Price ($)
              </label>
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

            {/* Dynamic Chemical Selector */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between">
                <label className="block text-xs text-slate-400 uppercase flex items-center gap-1.5">
                  <FlaskConical className="w-3.5 h-3.5 text-indigo-400" />
                  Chemicals Used
                </label>
                <button
                  type="button"
                  onClick={handleAddConsumableRow}
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Chemical
                </button>
              </div>

              {selectedConsumables.length === 0 ? (
                <p className="text-xs text-slate-500 bg-slate-950/60 border border-dashed border-slate-800 rounded-xl p-3 text-center">
                  No chemicals attached (e.g. Rinse only). Click &quot;+ Add Chemical&quot; to assign stock usage.
                </p>
              ) : (
                <div className="space-y-2">
                  {selectedConsumables.map((item, index) => {
                    const selectedInv = inventoryList.find((inv) => inv.id === item.inventoryId);
                    return (
                      <div key={index} className="flex items-center gap-2">
                        <select
                          value={item.inventoryId}
                          onChange={(e) =>
                            handleConsumableChange(index, 'inventoryId', e.target.value)
                          }
                          className="flex-1 bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs focus:border-indigo-500 outline-none"
                        >
                          {inventoryList.map((inv) => (
                            <option key={inv.id} value={inv.id}>
                              {inv.name} ({inv.unit})
                            </option>
                          ))}
                        </select>

                        <input
                          type="number"
                          required
                          min="1"
                          step="1"
                          placeholder={selectedInv?.unit || 'ml'}
                          value={item.quantity}
                          onChange={(e) =>
                            handleConsumableChange(index, 'quantity', e.target.value)
                          }
                          className="w-20 bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs focus:border-indigo-500 outline-none"
                        />

                        <button
                          type="button"
                          onClick={() => handleRemoveConsumableRow(index)}
                          className="p-1.5 text-slate-500 hover:text-red-400 rounded-lg transition cursor-pointer"
                          title="Remove"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
              <p className="text-xs text-slate-500">
                Automatically deducted from warehouse stock upon each wash
              </p>
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
                <div
                  key={prog.id}
                  className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-start justify-between gap-4"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-base">{prog.name}</h3>
                      <span className="bg-emerald-500/10 text-emerald-400 text-xs font-bold px-2.5 py-1 rounded-lg">
                        ${prog.price}
                      </span>
                    </div>

                    {/* Consumables badges */}
                    {prog.consumables && prog.consumables.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {prog.consumables.map((c) => (
                          <span
                            key={c.id}
                            className="inline-flex items-center gap-1.5 bg-slate-950 border border-slate-800 text-slate-300 text-xs px-2.5 py-1 rounded-lg"
                          >
                            <FlaskConical className="w-3 h-3 text-indigo-400" />
                            <span>{c.inventory?.name}:</span>
                            <strong className="text-white">
                              {c.quantity} {c.inventory?.unit}
                            </strong>
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500">No chemical consumption</p>
                    )}
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