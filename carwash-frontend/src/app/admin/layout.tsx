import Sidebar from "@/src/components/Sidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-950 text-white flex">
  
      <Sidebar />
      
  
      <main className="flex-1 p-6 md:p-10 space-y-8 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}