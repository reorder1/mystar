import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createTeacher, resetPassword, updateLoginHeader } from "@/app/(protected)/admin/users/actions";
import { Role } from "@prisma/client";

export default async function AdminUsersPage() {
  await requireSession(Role.ADMIN);
  const users = await prisma.user.findMany({
    include: { teacher: true },
    orderBy: { createdAt: "asc" }
  });
  const headerSetting = await prisma.appSetting.findUnique({
    where: { key: "loginHeaderUrl" }
  });

  return (
    <div className="space-y-8">
      <section className="glass-panel rounded-3xl p-6">
        <h2 className="text-2xl font-heading">Teacher Management</h2>
        <p className="text-sm text-slate-400">
          Create new teachers and reset credentials securely.
        </p>
        <form action={createTeacher} className="mt-6 grid gap-4 md:grid-cols-3">
          <input
            name="displayName"
            placeholder="Display name"
            required
            className="rounded-xl bg-slate-900/70 border border-slate-700/60 px-4 py-2"
          />
          <input
            name="username"
            placeholder="Username"
            required
            className="rounded-xl bg-slate-900/70 border border-slate-700/60 px-4 py-2"
          />
          <input
            type="password"
            name="password"
            placeholder="Temporary password"
            required
            className="rounded-xl bg-slate-900/70 border border-slate-700/60 px-4 py-2"
          />
          <button className="md:col-span-3 rounded-xl bg-indigo-500 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-400">
            Create Teacher
          </button>
        </form>
      </section>

      <section className="glass-panel rounded-3xl p-6">
        <h3 className="text-xl font-heading">Branding</h3>
        <p className="text-sm text-slate-400">
          Customize the login header image URL for the mySTAR sign-in page.
        </p>
        <form action={updateLoginHeader} className="mt-6 flex flex-col gap-3 md:flex-row">
          <input
            name="headerUrl"
            type="url"
            required
            defaultValue={headerSetting?.value ?? ""}
            placeholder="https://images.unsplash.com/..."
            className="flex-1 rounded-xl bg-slate-900/70 border border-slate-700/60 px-4 py-2"
          />
          <button className="rounded-xl bg-indigo-500 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-400">
            Save Header URL
          </button>
        </form>
      </section>

      <section className="glass-panel rounded-3xl p-6">
        <h3 className="text-xl font-heading">Active Users</h3>
        <div className="mt-6 space-y-4">
          {users.map((user) => (
            <div key={user.id} className="glass-panel rounded-2xl p-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="font-semibold text-white">
                    {user.teacher?.displayName ?? user.username}
                  </p>
                  <p className="text-xs text-slate-400">
                    {user.username} · {user.role}
                  </p>
                </div>
                {user.role !== Role.ADMIN && (
                  <form
                    action={async (formData) => {
                      "use server";
                      await resetPassword(user.id, formData);
                    }}
                    className="flex gap-2"
                  >
                    <input
                      type="password"
                      name="password"
                      placeholder="New password"
                      className="rounded-xl bg-slate-900/70 border border-slate-700/60 px-3 py-1 text-sm"
                      required
                    />
                    <button className="rounded-xl border border-indigo-400/70 px-3 py-1 text-xs font-semibold text-indigo-200 hover:border-indigo-200">
                      Reset
                    </button>
                  </form>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
