"use client";

import { useState, useTransition } from "react";
import { cn, hashToHsl, initials } from "@/lib/utils";

type Student = {
  id: string;
  firstName: string;
  lastName: string;
  nickname: string | null;
};

type SeatAssignment = {
  row: number;
  column: number;
  student: Student;
};

type Props = {
  rows: number;
  columns: number;
  students: Student[];
  seats: SeatAssignment[];
  onAssign: (studentId: string, row: number, column: number) => Promise<void>;
};

export function SeatEditor({ rows, columns, students, seats, onAssign }: Props) {
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const seatMap = new Map(seats.map((seat) => [`${seat.row}-${seat.column}`, seat.student]));
  const assigned = new Set(seats.map((seat) => seat.student.id));
  const overflow = students.filter((student) => !assigned.has(student.id));

  const handleCellClick = (row: number, column: number) => {
    if (!selectedStudentId) return;
    startTransition(async () => {
      await onAssign(selectedStudentId, row, column);
      setSelectedStudentId(null);
    });
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
        {Array.from({ length: rows }).map((_, rowIndex) =>
          Array.from({ length: columns }).map((__, colIndex) => {
            const student = seatMap.get(`${rowIndex}-${colIndex}`);
            const isSelected = student && student.id === selectedStudentId;
            return (
              <button
                key={`${rowIndex}-${colIndex}`}
                type="button"
                disabled={isPending}
                onClick={() => {
                  if (student) {
                    setSelectedStudentId(student.id);
                    return;
                  }
                  handleCellClick(rowIndex, colIndex);
                }}
                className={cn(
                  "rounded-2xl border border-slate-700/60 bg-slate-900/40 p-3 text-left transition",
                  "hover:border-indigo-400",
                  !student && "border-dashed text-slate-500",
                  isSelected && "ring-2 ring-amber-300 shadow-glow"
                )}
              >
                {student ? (
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold"
                      style={{ backgroundColor: hashToHsl(student.id) }}
                    >
                      {initials(student.firstName, student.lastName, student.nickname)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-100">
                        {student.firstName} {student.lastName}
                      </p>
                      <p className="text-xs text-slate-400">Click to select</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs">Empty seat</p>
                )}
              </button>
            );
          })
        )}
      </div>

      <div className="glass-panel rounded-2xl p-4">
        <h4 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">Overflow</h4>
        {overflow.length === 0 ? (
          <p className="mt-2 text-sm text-slate-400">All students are placed.</p>
        ) : (
          <div className="mt-3 flex flex-wrap gap-2">
            {overflow.map((student) => (
              <button
                key={student.id}
                type="button"
                onClick={() => setSelectedStudentId(student.id)}
                className={cn(
                  "rounded-full border border-slate-700 px-3 py-1 text-xs",
                  selectedStudentId === student.id && "border-amber-300 text-amber-200"
                )}
              >
                {student.firstName} {student.lastName}
              </button>
            ))}
          </div>
        )}
        <p className="mt-3 text-xs text-slate-500">
          Click a student to select, then click a seat to place or swap.
        </p>
      </div>
    </div>
  );
}
