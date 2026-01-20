import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createClass, createSection } from "@/app/(protected)/classes/actions";

export default async function ClassesPage() {
  const user = await requireSession();
  const sections = await prisma.section.findMany({
    where: { teacherId: user.teacherId ?? "" },
    include: { classes: true },
    orderBy: { createdAt: "asc" }
  });

  return (
    <div className="space-y-8">
      <section className="glass-panel rounded-3xl p-6">
        <h2 className="text-2xl font-heading">Sections & Classes</h2>
        <p className="text-sm text-slate-400">
          Organize classes within sections. Students belong to a class for
          simpler roster management.
        </p>
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <form action={createSection} className="glass-panel rounded-2xl p-5">
            <h3 className="font-heading text-lg">Create Section</h3>
            <div className="mt-4">
              <label className="block text-sm text-slate-400">Section name</label>
              <input
                name="name"
                required
                className="mt-2 w-full rounded-xl bg-slate-900/70 border border-slate-700/60 px-4 py-2"
                placeholder="BSCS 3-A"
              />
            </div>
            <button className="mt-4 rounded-xl bg-indigo-500 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-400">
              Save Section
            </button>
          </form>

          <form action={createClass} className="glass-panel rounded-2xl p-5">
            <h3 className="font-heading text-lg">Create Class</h3>
            <div className="mt-4">
              <label className="block text-sm text-slate-400">Class name</label>
              <input
                name="name"
                required
                className="mt-2 w-full rounded-xl bg-slate-900/70 border border-slate-700/60 px-4 py-2"
                placeholder="React Patterns (Lec)"
              />
            </div>
            <div className="mt-4">
              <label className="block text-sm text-slate-400">Section</label>
              <select
                name="sectionId"
                required
                className="mt-2 w-full rounded-xl bg-slate-900/70 border border-slate-700/60 px-4 py-2"
              >
                <option value="">Select a section</option>
                {sections.map((section) => (
                  <option key={section.id} value={section.id}>
                    {section.name}
                  </option>
                ))}
              </select>
            </div>
            <button className="mt-4 rounded-xl bg-indigo-500 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-400">
              Save Class
            </button>
          </form>
        </div>
      </section>

      <section className="space-y-4">
        {sections.length === 0 && (
          <div className="glass-panel rounded-3xl p-10 text-center">
            <p className="text-slate-300">Create your first section to begin.</p>
          </div>
        )}
        {sections.map((section) => (
          <div key={section.id} className="glass-panel rounded-3xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-heading">{section.name}</h3>
                <p className="text-sm text-slate-400">
                  {section.classes.length} class{section.classes.length === 1 ? "" : "es"}
                </p>
              </div>
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {section.classes.map((item) => (
                <Link
                  key={item.id}
                  href={`/classes/${item.id}`}
                  className="glass-panel rounded-2xl p-4 hover:border-indigo-400"
                >
                  <h4 className="font-heading text-lg">{item.name}</h4>
                  <p className="text-sm text-slate-400">Rows {item.rows} × {item.columns}</p>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
