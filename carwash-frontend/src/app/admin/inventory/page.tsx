'use client';
import { useState, useEffect } from 'react';
import { api } from '@/src/lib/api';
import { useRouter } from 'next/navigation';
import { 
  Package, AlertTriangle, RefreshCw, CheckCircle2 
} from 'lucide-react';

export default function InventoryPage() {
  const [items, setItems] = useState<any[]>([]);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [loading, setLoading] = useState(true);
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
      const res = await api.get('/inventory');
      const lowStockRes = await api.get('/low-stock');

      setItems(res.data);
      setLowStockCount(lowStockRes.data.count || 0);
    } catch (err) {
      console.error('Failed to load inventory', err);
      // Заглушка
      setItems([
        { id: '1', name: 'Active Foam', quantity: 45, minStockLimit: 20, unit: 'L' },
        { id: '2', name: 'Liquid Wax', quantity: 8, minStockLimit: 15, unit: 'L' },
        { id: '3', name: 'Microfiber Towels', quantity: 120, minStockLimit: 50, unit: 'pcs' },
        { id: '4', name: 'Glass Cleaner', quantity: 5, minStockLimit: 10, unit: 'L' },
      ]);
      setLowStockCount(2);
    } finally {
      setLoading(false);
    }
  };
  

  return (
    <div className="space-y-8">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Warehouse & Inventory</h1>
          <p className="text-slate-400 text-sm">Monitor chemical supplies, consumables, and low-stock alerts</p>
        </div>
        <button 
          onClick={fetchInventory}
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 transition shadow-lg shadow-indigo-600/20"
        >
          <RefreshCw className="w-4 h-4" /> Refresh Stock
        </button>
      </header>

      {lowStockCount > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-2xl flex items-center gap-3 text-amber-400">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <div className="text-sm">
            <span className="font-semibold">Attention required:</span> {lowStockCount} items have reached or fallen below their minimum stock limit.
          </div>
        </div>
      )}

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
              {items.map((item) => {
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
                      {item.quantity} <span className="text-slate-400 font-normal text-xs">{item.unit || 'pcs'}</span>
                    </td>
                    <td className="p-4 text-slate-400">
                      {item.minStockLimit} {item.unit || 'pcs'}
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
                    <td className="p-4 text-right">
                      <button className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg transition">
                        Restock
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 