'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, Box, Layers, Package, LogOut 
} from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();

  const navItems = [
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { name: 'Boxes & Garages', href: '/admin/boxes', icon: Box },
    { name: 'Inventory & Stock', href: '/admin/inventory', icon: Package },
    { name: 'Wash Programs', href: '/admin/services', icon: Layers },
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 p-6 flex flex-col justify-between hidden md:flex">
      <div className="space-y-6">
        <div className="flex items-center gap-2 text-indigo-400 font-bold text-lg">
          <Layers className="w-6 h-6" /> WashSaaS Admin
        </div>
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link 
                key={item.href} 
                href={item.href} 
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition ${
                  isActive 
                    ? 'bg-indigo-600/10 text-indigo-400' 
                    : 'text-slate-400 hover:bg-slate-800'
                }`}
              >
                <Icon className="w-4 h-4" /> {item.name}
              </Link>
            );
          })}
        </nav>
      </div>
      <button 
        onClick={() => { localStorage.clear(); window.location.href = '/login'; }}
        className="flex items-center gap-2 text-slate-400 hover:text-red-400 px-4 py-2 text-sm transition"
      >
        <LogOut className="w-4 h-4" /> Logout
      </button>
    </aside>
  );
}