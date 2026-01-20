import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cn, hashToHsl, initials } from "@/lib/utils";
import { cycleAttendance, pickRecitation, rewindRecitation } from "@/app/(protected)/dashboard/actions";
import { AttendanceStatus } from "@prisma/client";

const statusStyles: Record<AttendanceStatus, string> = {
  PRESENT: "border-emerald-400/60",
  ABSENT: "border-red-500/60 opacity-50 grayscale",
  EXCUSED: "border-yellow-400/60",
  NOTIFIED: "border-orange-400/60"
};

const statusLabels: Record<AttendanceStatus, string> = {
  PRESENT: "Present",
  ABSENT: "Absent",
  EXCUSED: "Excused",
  NOTIFIED: "Notified"
};

export default async function DashboardPage({
  searchParams
}: {
  searchParams: { classId?: string; date?: string };
}) {
  const user = await requireSession();
  const classes = await prisma.class.findMany({
    where: { teacherId: user.teacherId ?? "" },
    include: {
      section: true
    },
    orderBy: { createdAt: "asc" }
  });

  if (!classes.length) {
    return (
      <div className="glass-panel rounded-3xl p-10 text-center">
        <h2 className="text-2xl font-heading">No classes yet</h2>
        <p className="mt-2 text-slate-300">
          Start by creating a section and class to unlock attendance and
          recitation tools.
        </p>
        <Link
          href="/classes"
          className="mt-6 inline-flex rounded-xl bg-indigo-500 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-400"
        >
          Go to Classes
        </Link>
      </div>
    );
  }

  const selectedClass =
    classes.find((item) => item.id === searchParams.classId) ?? classes[0];
  const date = searchParams.date ?? new Date().toISOString().slice(0, 10);

  const classData = await prisma.class.findFirst({
    where: { id: selectedClass.id },
    include: {
      seats: {
        include: { student: true }
      },
      students: true,
      attendance: {
        where: { date: new Date(date) }
      },
      recitations: {
        orderBy: { createdAt: "desc" },
        take: 1
      }
    }
  });

  if (!classData) return null;

  const attendanceMap = new Map(
    classData.attendance.map((record) => [record.studentId, record.status])
  );

  const statusCounts = classData.students.reduce(
    (acc, student) => {
      const status = attendanceMap.get(student.id) ?? AttendanceStatus.PRESENT;
      acc[status] += 1;
      return acc;
    },
    {
      [AttendanceStatus.PRESENT]: 0,
      [AttendanceStatus.ABSENT]: 0,
      [AttendanceStatus.EXCUSED]: 0,
      [AttendanceStatus.NOTIFIED]: 0
    }
  );

  const seatMap = new Map(
    classData.seats.map((seat) => [
      `${seat.row}-${seat.column}`,
      seat.student
    ])
  );

  const latestPick = classData.recitations[0]?.studentId;

  return (
    <div className="space-y-8">
      <section className="glass-panel rounded-3xl p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-heading">Dashboard</h2>
            <p className="text-sm text-slate-400">
              {selectedClass.section.name} · {selectedClass.name}
            </p>
          </div>
          <form className="flex flex-wrap items-center gap-3" action="/dashboard">
            <select
              name="classId"
              defaultValue={selectedClass.id}
              className="rounded-xl bg-slate-900/70 border border-slate-700/60 px-3 py-2 text-sm"
            >
              {classes.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.section.name} — {item.name}
                </option>
              ))}
            </select>
            <input
              type="date"
              name="date"
              defaultValue={date}
              className="rounded-xl bg-slate-900/70 border border-slate-700/60 px-3 py-2 text-sm"
            />
            <button
              type="submit"
              className="rounded-xl bg-indigo-500 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-400"
            >
              Update
            </button>
          </form>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-4">
          {Object.entries(statusCounts).map(([status, count]) => (
            <div key={status} className="glass-panel rounded-2xl p-4 text-center">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                {statusLabels[status as AttendanceStatus]}
              </p>
              <p className="mt-2 text-2xl font-heading text-white">{count}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-8 lg:grid-cols-[2.2fr_1fr]">
        <div className="glass-panel rounded-3xl p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-heading">Seating Chart</h3>
            <Link
              href={`/classes/${classData.id}/settings`}
              className="text-sm text-indigo-300 hover:text-indigo-200"
            >
              Edit layout
            </Link>
          </div>
          <div
            className="mt-6 grid gap-3"
            style={{
              gridTemplateColumns: `repeat(${classData.columns}, minmax(0, 1fr))`
            }}
          >
            {Array.from({ length: classData.rows }).map((_, rowIndex) =>
              Array.from({ length: classData.columns }).map((__, colIndex) => {
                const student = seatMap.get(`${rowIndex}-${colIndex}`);
                if (!student) {
                  return (
                    <div
                      key={`${rowIndex}-${colIndex}`}
                      className="rounded-2xl border border-dashed border-slate-700/60 bg-slate-900/20 p-4 text-center text-xs text-slate-500"
                    >
                      Empty
                    </div>
                  );
                }
                const status =
                  attendanceMap.get(student.id) ?? AttendanceStatus.PRESENT;
                const highlight = student.id === latestPick;

                return (
                  <form
                    key={student.id}
                    action={async () => {
                      "use server";
                      await cycleAttendance(classData.id, student.id, date);
                    }}
                    className={cn(
                      "rounded-2xl border bg-slate-900/60 p-4 text-left transition hover:border-indigo-400",
                      statusStyles[status],
                      highlight && "ring-2 ring-amber-300 shadow-glow scale-[1.02]"
                    )}
                  >
                    <button type="submit" className="flex w-full gap-3 text-left">
                      <div
                        className="flex h-10 w-10 items-center justify-center rounded-full text-xs font-semibold"
                        style={{ backgroundColor: hashToHsl(student.id) }}
                      >
                        {initials(
                          student.firstName,
                          student.lastName,
                          student.nickname
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-100">
                          {student.firstName} {student.lastName}
                        </p>
                        <p className="text-xs text-slate-400">
                          {statusLabels[status]}
                        </p>
                      </div>
                    </button>
                  </form>
                );
              })
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="glass-panel rounded-3xl p-6">
            <h3 className="text-lg font-heading">Cold Call</h3>
            <p className="mt-2 text-sm text-slate-400">
              Weighted randomizer with optional absent filtering.
            </p>
            <div className="mt-4 space-y-3">
              <form
                action={async () => {
                  "use server";
                  await pickRecitation(classData.id, date, "random");
                }}
              >
                <button
                  className="w-full rounded-xl bg-indigo-500/90 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-400"
                  type="submit"
                >
                  Randomize! (True Random)
                </button>
              </form>
              <form
                action={async () => {
                  "use server";
                  await pickRecitation(classData.id, date, "weighted");
                }}
              >
                <button
                  className="w-full rounded-xl border border-indigo-400/70 px-4 py-2 text-sm font-semibold text-indigo-200 hover:border-indigo-200"
                  type="submit"
                >
                  Weighted Pick
                </button>
              </form>
              <form
                action={async () => {
                  "use server";
                  await rewindRecitation(classData.id);
                }}
              >
                <button
                  className="w-full rounded-xl border border-slate-600 px-4 py-2 text-sm text-slate-300 hover:border-slate-400"
                  type="submit"
                >
                  Rewind Last Pick
                </button>
              </form>
            </div>
          </div>

          <div className="glass-panel rounded-3xl p-6">
            <h3 className="text-lg font-heading">Reports</h3>
            <p className="mt-2 text-sm text-slate-400">
              Export attendance and recitation data as CSV.
            </p>
            <Link
              href={`/classes/${classData.id}`}
              className="mt-4 inline-flex rounded-xl bg-slate-900/70 px-4 py-2 text-sm text-slate-200 hover:border-indigo-400"
            >
              Open Reporting Center
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
