'use client';
import { useState, useEffect } from 'react';
import { api } from '@/src/lib/api';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Package,
  AlertTriangle,
  RefreshCw,
  CheckCircle2,
  Plus,
  Trash2,
  ArrowLeft,
  AlertCircle
} from 'lucide-react';

interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  minStockLimit: number;
}

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('ml');
  const [minStockLimit, setMinStockLimit] = useState('2000');

  // Alerts
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');

    if (!token || role !== 'ADMIN') {
      router.push('/login');
      return;
    }

    fetchInventory();
  }, [router]);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const res = await api.get('/inventory');
      setItems(res.data);
    } catch (err: any) {
      console.error('Failed to load inventory', err);
      setErrorMsg(err.response?.data?.error || 'Failed to load inventory from server.');
    } finally {
      setLoading(false);
    }
  };

  // Create new stock item
  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setSubmitting(true);

    try {
      const res = await api.post('/inventory', {
        name,
        quantity: Number(quantity),
        unit,
        minStockLimit: Number(minStockLimit)
      });

      setItems((prev) => [...prev, res.data].sort((a, b) => a.name.localeCompare(b.name)));
      setName('');
      setQuantity('');
      setMinStockLimit('2000');
      setSuccessMsg(`"${res.data.name}" added to warehouse!`);
    } catch (err: any) {
      console.error('Failed to create item:', err);
      setErrorMsg(err.response?.data?.error || 'Failed to add inventory item.');
    } finally {
      setSubmitting(false);
    }
  };

  // Restock existing item
  const handleRestock = async (item: InventoryItem) => {
    const input = prompt(`How many ${item.unit} of "${item.name}" do you want to add?`, '5000');
    if (!input) return;

    const amount = Number(input);
    if (isNaN(amount) || amount <= 0) {
      alert('Please enter a valid positive number.');
      return;
    }

    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await api.patch(`/inventory/${item.id}/restock`, { amount });
      setItems((prev) => prev.map((el) => (el.id === item.id ? res.data : el)));
      setSuccessMsg(`Added ${amount} ${item.unit} to "${item.name}".`);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Failed to restock item.');
    }
  };

  // Delete item
  const handleDeleteItem = async (item: InventoryItem) => {
    if (!confirm(`Delete "${item.name}" from warehouse?`)) return;

    setErrorMsg('');
    setSuccessMsg('');

    try {
      await api.delete(`/inventory/${item.id}`);
      setItems((prev) => prev.filter((el) => el.id !== item.id));
      setSuccessMsg(`"${item.name}" has been removed.`);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Failed to delete item.');
    }
  };

  const lowStockCount = items.filter((item) => item.quantity <= item.minStockLimit).length;

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 md:p-10">
      <div className="max-w-5xl mx-auto space-y-8">
        <header className="flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <Link
              href="/admin"
              className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl hover:bg-slate-800 transition"
            >
              <ArrowLeft className="w-5 h-5 text-slate-400" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold">Warehouse & Inventory</h1>
              <p className="text-slate-400 text-sm">
                Monitor chemical supplies, consumables, and low-stock alerts
              </p>
            </div>
          </div>

          <button
            onClick={fetchInventory}
            className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-white px-4 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 transition cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh Stock
          </button>
        </header>

        {/* Alerts */}
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

        {lowStockCount > 0 && (
          <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-2xl flex items-center gap-3 text-amber-400">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <div className="text-sm">
              <span className="font-semibold">Attention required:</span> {lowStockCount} items have
              reached or fallen below their minimum stock limit.
            </div>
          </div>
        )}

        {/* Add New Chemical Form */}
        <form
          onSubmit={handleAddItem}
          className="bg-slate-900 border border-slate-800 p-6 rounded-2xl grid grid-cols-1 md:grid-cols-5 gap-4 items-end"
        >
          <div className="md:col-span-2">
            <label className="block text-xs text-slate-400 uppercase mb-1">
              Chemical / Item Name
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Active Foam"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm focus:border-indigo-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs text-slate-400 uppercase mb-1">Initial Stock</label>
            <div className="flex">
              <input
                type="number"
                required
                min="0"
                placeholder="20000"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-l-xl p-2.5 text-sm focus:border-indigo-500 outline-none"
              />
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="bg-slate-800 border border-l-0 border-slate-700 rounded-r-xl px-2.5 text-xs font-medium outline-none"
              >
                <option value="ml">ml</option>
                <option value="g">g</option>
                <option value="pcs">pcs</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs text-slate-400 uppercase mb-1">
              Min Alert Limit ({unit})
            </label>
            <input
              type="number"
              required
              min="0"
              value={minStockLimit}
              onChange={(e) => setMinStockLimit(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm focus:border-indigo-500 outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 text-white font-medium py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" /> {submitting ? 'Adding...' : 'Add Item'}
          </button>
        </form>

        {/* Stock Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-6 border-b border-slate-800 flex justify-between items-center">
            <h3 className="text-base font-semibold">Stock Items List</h3>
            <span className="text-xs text-slate-400 bg-slate-800 px-3 py-1 rounded-full">
              Total items: {items.length}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wider bg-slate-950/50">
                  <th className="p-4 font-semibold">Item Name</th>
                  <th className="p-4 font-semibold">Current Quantity</th>
                  <th className="p-4 font-semibold">Min Limit</th>
                  <th className="p-4 font-semibold">Status</th>
                  <th className="p-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-sm">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-slate-400">
                      Loading warehouse inventory...
                    </td>
                  </tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-slate-400">
                      Warehouse is empty. Add your first chemical above!
                    </td>
                  </tr>
                ) : (
                  items.map((item) => {
                    const isLow = item.quantity <= item.minStockLimit;
                    return (
                      <tr key={item.id} className="hover:bg-slate-800/40 transition">
                        <td className="p-4 font-medium flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-indigo-400">
                            <Package className="w-4 h-4" />
                          </div>
                          {item.name}
                        </td>
                        <td className="p-4 font-bold">
                          {item.quantity}{' '}
                          <span className="text-slate-400 font-normal text-xs">{item.unit}</span>
                        </td>
                        <td className="p-4 text-slate-400">
                          {item.minStockLimit} {item.unit}
                        </td>
                        <td className="p-4">
                          {isLow ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20">
                              <AlertTriangle className="w-3 h-3" /> Low Stock
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              <CheckCircle2 className="w-3 h-3" /> Adequate
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-right space-x-2">
                          <button
                            onClick={() => handleRestock(item)}
                            className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg transition cursor-pointer"
                          >
                            + Restock
                          </button>
                          <button
                            onClick={() => handleDeleteItem(item)}
                            className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition align-middle cursor-pointer"
                            title="Delete item"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}