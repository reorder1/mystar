import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { addStudent, importStudents } from "@/app/(protected)/classes/actions";
import { hashToHsl, initials } from "@/lib/utils";

export default async function ClassDetailPage({
  params
}: {
  params: { classId: string };
}) {
  const user = await requireSession();
  const classData = await prisma.class.findFirst({
    where: { id: params.classId, teacherId: user.teacherId ?? "" },
    include: {
      section: true,
      students: true
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
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{classData.section.name}</p>
            <h2 className="text-2xl font-heading">{classData.name}</h2>
          </div>
          <div className="flex gap-3">
            <Link
              href={`/classes/${classData.id}/settings`}
              className="rounded-xl border border-slate-700 px-4 py-2 text-sm hover:border-indigo-400"
            >
              Class Settings
            </Link>
            <Link
              href={`/dashboard?classId=${classData.id}`}
              className="rounded-xl bg-indigo-500 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-400"
            >
              Open Dashboard
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="glass-panel rounded-3xl p-6">
          <h3 className="text-xl font-heading">Student Roster</h3>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {classData.students.map((student) => (
              <div key={student.id} className="glass-panel rounded-2xl p-4">
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-full text-xs font-semibold"
                    style={{ backgroundColor: hashToHsl(student.id) }}
                  >
                    {initials(student.firstName, student.lastName, student.nickname)}
                  </div>
                  <div>
                    <p className="font-semibold text-white">
                      {student.firstName} {student.lastName}
                    </p>
                    <p className="text-xs text-slate-400">{student.studentId}</p>
                  </div>
                </div>
              </div>
            ))}
            {classData.students.length === 0 && (
              <p className="text-sm text-slate-400">No students yet. Add one to begin.</p>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <form
            action={async (formData) => {
              "use server";
              await addStudent(classData.id, formData);
            }}
            className="glass-panel rounded-3xl p-6"
          >
            <h3 className="text-lg font-heading">Add Student</h3>
            <div className="mt-4 space-y-3">
              <input
                name="firstName"
                placeholder="First name"
                required
                className="w-full rounded-xl bg-slate-900/70 border border-slate-700/60 px-4 py-2"
              />
              <input
                name="lastName"
                placeholder="Last name"
                required
                className="w-full rounded-xl bg-slate-900/70 border border-slate-700/60 px-4 py-2"
              />
              <input
                name="studentId"
                placeholder="Student ID"
                required
                className="w-full rounded-xl bg-slate-900/70 border border-slate-700/60 px-4 py-2"
              />
              <input
                name="nickname"
                placeholder="Nickname (optional)"
                className="w-full rounded-xl bg-slate-900/70 border border-slate-700/60 px-4 py-2"
              />
              <input
                name="contactNumber"
                placeholder="Contact number (optional)"
                className="w-full rounded-xl bg-slate-900/70 border border-slate-700/60 px-4 py-2"
              />
              <input
                name="photoUrl"
                placeholder="Photo URL (optional)"
                className="w-full rounded-xl bg-slate-900/70 border border-slate-700/60 px-4 py-2"
              />
            </div>
            <button className="mt-4 w-full rounded-xl bg-indigo-500 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-400">
              Add Student
            </button>
          </form>

          <form
            action={async (formData) => {
              "use server";
              await importStudents(classData.id, formData);
            }}
            className="glass-panel rounded-3xl p-6"
          >
            <h3 className="text-lg font-heading">Import via CSV</h3>
            <p className="mt-2 text-sm text-slate-400">
              Columns: firstName, lastName, studentId, nickname, contactNumber, photoUrl.
            </p>
            <input
              type="file"
              name="csv"
              accept=".csv"
              className="mt-4 block w-full text-sm text-slate-300"
              required
            />
            <button className="mt-4 w-full rounded-xl border border-indigo-400/70 px-4 py-2 text-sm font-semibold text-indigo-200 hover:border-indigo-200">
              Import CSV
            </button>
          </form>
        </div>
      </section>

      <section className="glass-panel rounded-3xl p-6">
        <h3 className="text-xl font-heading">Reporting Center</h3>
        <p className="text-sm text-slate-400">
          Download CSV exports for attendance and recitation.
        </p>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <a
            className="rounded-xl border border-slate-700 px-4 py-3 text-sm hover:border-indigo-400"
            href={`/api/classes/${classData.id}/export?type=daily&scope=current`}
          >
            Daily Snapshot
          </a>
          <a
            className="rounded-xl border border-slate-700 px-4 py-3 text-sm hover:border-indigo-400"
            href={`/api/classes/${classData.id}/export?type=attendance&scope=all`}
          >
            Attendance Matrix
          </a>
          <a
            className="rounded-xl border border-slate-700 px-4 py-3 text-sm hover:border-indigo-400"
            href={`/api/classes/${classData.id}/export?type=recitation&scope=all`}
          >
            Recitation Matrix
          </a>
        </div>
      </section>
    </div>
  );
}
