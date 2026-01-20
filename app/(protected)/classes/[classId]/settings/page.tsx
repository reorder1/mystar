import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateClassSettings, assignSeat } from "@/app/(protected)/classes/actions";
import { SeatEditor } from "@/components/SeatEditor";

export default async function ClassSettingsPage({
  params
}: {
  params: { classId: string };
}) {
  const user = await requireSession();
  const classData = await prisma.class.findFirst({
    where: { id: params.classId, teacherId: user.teacherId ?? "" },
    include: {
      students: true,
      seats: {
        include: {
          student: true
        }
      }
    }
  });

  if (!classData) {
    return (
      <div className="glass-panel rounded-3xl p-8">
        <p>Class not found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section className="glass-panel rounded-3xl p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-heading">Class Settings</h2>
            <p className="text-sm text-slate-400">{classData.name}</p>
          </div>
          <Link href={`/classes/${classData.id}`} className="text-sm text-indigo-300 hover:text-indigo-200">
            Back to class
          </Link>
        </div>
        <form
          action={async (formData) => {
            "use server";
            await updateClassSettings(classData.id, formData);
          }}
          className="mt-6 grid gap-4 md:grid-cols-2"
        >
          <div>
            <label className="block text-sm text-slate-400">Rows</label>
            <input
              type="number"
              name="rows"
              min={1}
              defaultValue={classData.rows}
              className="mt-2 w-full rounded-xl bg-slate-900/70 border border-slate-700/60 px-4 py-2"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-400">Columns</label>
            <input
              type="number"
              name="columns"
              min={1}
              defaultValue={classData.columns}
              className="mt-2 w-full rounded-xl bg-slate-900/70 border border-slate-700/60 px-4 py-2"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-400">Lambda (weighting)</label>
            <input
              type="number"
              step="0.05"
              name="lambda"
              defaultValue={classData.lambda}
              className="mt-2 w-full rounded-xl bg-slate-900/70 border border-slate-700/60 px-4 py-2"
            />
          </div>
          <label className="flex items-center gap-3 text-sm text-slate-300">
            <input
              type="checkbox"
              name="excludeAbsent"
              defaultChecked={classData.excludeAbsent}
              className="h-4 w-4 rounded border-slate-600 bg-slate-900"
            />
            Exclude absent students from randomizer
          </label>
          <button className="md:col-span-2 rounded-xl bg-indigo-500 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-400">
            Save Settings
          </button>
        </form>
      </section>

      <section className="glass-panel rounded-3xl p-6">
        <h3 className="text-xl font-heading">Seating Chart Editor</h3>
        <p className="text-sm text-slate-400">
          Click a student card to select, then click a seat to place or swap.
        </p>
        <div className="mt-6">
          <SeatEditor
            rows={classData.rows}
            columns={classData.columns}
            students={classData.students}
            seats={classData.seats}
            onAssign={async (studentId, row, column) => {
              "use server";
              await assignSeat(classData.id, studentId, row, column);
            }}
          />
        </div>
      </section>
    </div>
  );
}
