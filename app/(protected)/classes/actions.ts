"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { parseStudentsCsv } from "@/lib/csv";

export async function createSection(formData: FormData) {
  const user = await requireSession();
  if (!user.teacherId) return;
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;

  await prisma.section.create({
    data: {
      name,
      teacherId: user.teacherId
    }
  });
  revalidatePath("/classes");
}

export async function createClass(formData: FormData) {
  const user = await requireSession();
  if (!user.teacherId) return;
  const name = String(formData.get("name") ?? "").trim();
  const sectionId = String(formData.get("sectionId") ?? "");
  if (!name || !sectionId) return;

  await prisma.class.create({
    data: {
      name,
      sectionId,
      teacherId: user.teacherId
    }
  });

  revalidatePath("/classes");
}

export async function addStudent(classId: string, formData: FormData) {
  const user = await requireSession();
  const classRecord = await prisma.class.findFirst({
    where: { id: classId, teacherId: user.teacherId ?? "" }
  });
  if (!classRecord) return;
  const firstName = String(formData.get("firstName") ?? "").trim();
  const lastName = String(formData.get("lastName") ?? "").trim();
  const studentId = String(formData.get("studentId") ?? "").trim();

  if (!firstName || !lastName || !studentId) return;

  await prisma.student.create({
    data: {
      classId,
      teacherId: user.teacherId ?? "",
      firstName,
      lastName,
      studentId,
      nickname: String(formData.get("nickname") ?? "").trim() || null,
      contactNumber: String(formData.get("contactNumber") ?? "").trim() || null,
      photoUrl: String(formData.get("photoUrl") ?? "").trim() || null
    }
  });

  revalidatePath(`/classes/${classId}`);
}

export async function importStudents(classId: string, formData: FormData) {
  const user = await requireSession();
  const classRecord = await prisma.class.findFirst({
    where: { id: classId, teacherId: user.teacherId ?? "" }
  });
  if (!classRecord) return;
  const csvFile = formData.get("csv") as File | null;
  if (!csvFile) return;

  const contents = await csvFile.text();
  const rows = parseStudentsCsv(contents);
  const validRows = rows.filter((row) => row.firstName && row.lastName && row.studentId);

  if (!validRows.length) return;

  await prisma.student.createMany({
    data: validRows.map((row) => ({
      classId,
      teacherId: user.teacherId ?? "",
      firstName: row.firstName,
      lastName: row.lastName,
      nickname: row.nickname ?? null,
      studentId: row.studentId,
      contactNumber: row.contactNumber ?? null,
      photoUrl: row.photoUrl ?? null
    })),
    skipDuplicates: true
  });

  revalidatePath(`/classes/${classId}`);
}

export async function updateClassSettings(classId: string, formData: FormData) {
  const user = await requireSession();
  const rows = Number(formData.get("rows"));
  const columns = Number(formData.get("columns"));
  const lambda = Number(formData.get("lambda"));
  const excludeAbsent = formData.get("excludeAbsent") === "on";

  await prisma.class.update({
    where: { id: classId, teacherId: user.teacherId ?? "" },
    data: {
      rows: Number.isFinite(rows) ? rows : 4,
      columns: Number.isFinite(columns) ? columns : 6,
      lambda: Number.isFinite(lambda) ? lambda : 0.35,
      excludeAbsent
    }
  });

  revalidatePath(`/classes/${classId}/settings`);
  revalidatePath("/dashboard");
}

export async function assignSeat(
  classId: string,
  studentId: string,
  row: number,
  column: number
) {
  const user = await requireSession();
  const classRecord = await prisma.class.findFirst({
    where: { id: classId, teacherId: user.teacherId ?? "" }
  });
  if (!classRecord) return;

  const existingSeat = await prisma.seatAssignment.findFirst({
    where: { classId, row, column }
  });

  if (existingSeat) {
    await prisma.seatAssignment.delete({ where: { id: existingSeat.id } });
  }

  await prisma.seatAssignment.upsert({
    where: { classId_studentId: { classId, studentId } },
    update: { row, column },
    create: {
      classId,
      studentId,
      row,
      column
    }
  });

  revalidatePath(`/classes/${classId}/settings`);
  revalidatePath("/dashboard");
}
