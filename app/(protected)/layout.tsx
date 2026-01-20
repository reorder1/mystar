import { requireSession } from "@/lib/auth";
import Link from "next/link";

export default async function ProtectedLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const user = await requireSession();

  return (
    <div className="min-h-screen bg-slate-950">
      <header className="border-b border-slate-800/80 bg-slate-950/70 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">mySTAR</p>
            <h1 className="font-heading text-xl text-white">Cyber-Academic Ops</h1>
          </div>
          <nav className="flex items-center gap-4 text-sm text-slate-300">
            <Link href="/dashboard" className="hover:text-white">Dashboard</Link>
            <Link href="/classes" className="hover:text-white">Classes</Link>
            {user.role === "ADMIN" && (
              <Link href="/admin/users" className="hover:text-white">Admin</Link>
            )}
            <form action="/api/auth/logout" method="post">
              <button className="rounded-lg border border-slate-700 px-3 py-1 text-xs uppercase tracking-[0.2em] text-slate-300 hover:border-indigo-400 hover:text-white">
                Logout
              </button>
            </form>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-10">{children}</main>
    </div>
  );
}
