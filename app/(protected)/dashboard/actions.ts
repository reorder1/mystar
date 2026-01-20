"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { AttendanceStatus } from "@prisma/client";
import { buildWeightedPick } from "@/lib/utils";

export async function cycleAttendance(
  classId: string,
  studentId: string,
  date: string
) {
  const user = await requireSession();
  const classRecord = await prisma.class.findFirst({
    where: { id: classId, teacherId: user.teacherId ?? "" }
  });
  if (!classRecord) return;
  const currentDate = new Date(date);

  const record = await prisma.attendanceRecord.findUnique({
    where: { classId_studentId_date: { classId, studentId, date: currentDate } }
  });

  const nextStatus = record
    ? getNextStatus(record.status)
    : AttendanceStatus.PRESENT;

  await prisma.attendanceRecord.upsert({
    where: { classId_studentId_date: { classId, studentId, date: currentDate } },
    update: { status: nextStatus },
    create: {
      classId,
      studentId,
      date: currentDate,
      status: nextStatus
    }
  });

  revalidatePath("/dashboard");
}

export async function pickRecitation(
  classId: string,
  date: string,
  mode: "random" | "weighted"
) {
  const user = await requireSession();
  const classData = await prisma.class.findFirst({
    where: { id: classId, teacherId: user.teacherId ?? "" },
    include: {
      students: {
        include: {
          recitations: {
            where: { classId }
          }
        }
      },
      attendance: {
        where: { date: new Date(date) }
      }
    }
  });

  if (!classData) return;

  const attendanceMap = new Map(
    classData.attendance.map((record) => [record.studentId, record.status])
  );

  const eligible = classData.students.filter((student) => {
    if (!classData.excludeAbsent) return true;
    return attendanceMap.get(student.id) !== AttendanceStatus.ABSENT;
  });

  if (!eligible.length) return;

  const pickId =
    mode === "weighted"
      ? buildWeightedPick(
          eligible.map((student) => ({
            id: student.id,
            participationCount: student.recitations.length
          })),
          classData.lambda
        )
      : eligible[Math.floor(Math.random() * eligible.length)]?.id;

  if (!pickId) return;

  await prisma.recitationEvent.create({
    data: {
      classId,
      studentId: pickId,
      date: new Date(date)
    }
  });

  revalidatePath("/dashboard");
}

export async function rewindRecitation(classId: string) {
  const user = await requireSession();
  const lastEvent = await prisma.recitationEvent.findFirst({
    where: { classId, class: { teacherId: user.teacherId ?? "" } },
    orderBy: { createdAt: "desc" }
  });

  if (!lastEvent) return;

  await prisma.recitationEvent.delete({ where: { id: lastEvent.id } });
  revalidatePath("/dashboard");
}

function getNextStatus(status: AttendanceStatus) {
  switch (status) {
    case AttendanceStatus.PRESENT:
      return AttendanceStatus.ABSENT;
    case AttendanceStatus.ABSENT:
      return AttendanceStatus.EXCUSED;
    case AttendanceStatus.EXCUSED:
      return AttendanceStatus.NOTIFIED;
    case AttendanceStatus.NOTIFIED:
    default:
      return AttendanceStatus.PRESENT;
  }
}
