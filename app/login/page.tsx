import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const DEFAULT_HEADER_URL =
  "https://images.unsplash.com/photo-1510936111840-65e151ad71bb?auto=format&fit=crop&w=1200&q=80";

export default async function LoginPage() {
  const user = await getSessionUser();
  if (user) redirect("/dashboard");
  const headerSetting = await prisma.appSetting.findUnique({
    where: { key: "loginHeaderUrl" }
  });
  const headerUrl = headerSetting?.value || DEFAULT_HEADER_URL;

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-6">
      <div className="w-full max-w-4xl grid md:grid-cols-[1.1fr_1fr] gap-8">
        <div className="glass-panel rounded-3xl overflow-hidden">
          <div className="relative h-52">
            <img
              src={headerUrl}
              alt="Cyber-academic header"
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/10 to-transparent" />
            <div className="absolute bottom-4 left-6">
              <p className="text-sm text-slate-300 uppercase tracking-[0.3em]">mySTAR</p>
              <h1 className="text-3xl font-heading text-white">Student Tracker</h1>
            </div>
          </div>
          <div className="p-6 space-y-3 text-slate-300">
            <p>
              Welcome back! Sign in to manage attendance, run recitations, and
              orchestrate your cyber-academic classroom.
            </p>
            <ul className="text-sm space-y-2">
              <li>• Secure credential login with role-based access.</li>
              <li>• Weighted cold call with instant rewind.</li>
              <li>• Seating chart and CSV reporting baked in.</li>
            </ul>
          </div>
        </div>
        <div className="glass-panel rounded-3xl p-8">
          <h2 className="text-2xl font-heading mb-6">Sign in</h2>
          <form action="/api/auth/login" method="post" className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-300">Username</label>
              <input
                name="username"
                required
                className="mt-2 w-full rounded-xl bg-slate-900/70 border border-slate-700/60 px-4 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300">Password</label>
              <input
                type="password"
                name="password"
                required
                className="mt-2 w-full rounded-xl bg-slate-900/70 border border-slate-700/60 px-4 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-xl bg-indigo-500/90 px-4 py-2 font-semibold text-white transition hover:bg-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-300"
            >
              Enter mySTAR
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
