import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AttendanceStatus } from "@prisma/client";

function csvRow(values: string[]) {
  return `${values.map((value) => `"${value.replace(/"/g, '""')}"`).join(",")}`;
}

export async function GET(
  request: Request,
  { params }: { params: { classId: string } }
) {
  const user = await requireSession();
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") ?? "daily";
  const scope = searchParams.get("scope") ?? "current";
  const startDate = searchParams.get("start");
  const endDate = searchParams.get("end");

  const classData = await prisma.class.findFirst({
    where: { id: params.classId, teacherId: user.teacherId ?? "" },
    include: {
      students: true,
      attendance: true,
      recitations: true
    }
  });

  if (!classData) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const now = new Date();
  const rangeStart = startDate ? new Date(startDate) : now;
  const rangeEnd = endDate ? new Date(endDate) : now;

  const withinScope = (date: Date) => {
    if (scope === "all") return true;
    if (scope === "range") return date >= rangeStart && date <= rangeEnd;
    return date.toDateString() === now.toDateString();
  };

  let content = "";

  if (type === "daily") {
    const daily = classData.students.map((student) => {
      const record = classData.attendance.find(
        (item) => item.studentId === student.id && withinScope(item.date)
      );
      return [
        student.studentId,
        student.firstName,
        student.lastName,
        record?.status ?? AttendanceStatus.PRESENT
      ];
    });
    content = [csvRow(["Student ID", "First Name", "Last Name", "Status"]), ...daily.map(csvRow)].join("\n");
  } else if (type === "attendance") {
    const dates = Array.from(
      new Set(classData.attendance.map((record) => record.date.toISOString().slice(0, 10)))
    ).filter((date) => withinScope(new Date(date)));
    const header = csvRow(["Student", ...dates]);
    const rows = classData.students.map((student) => {
      const statusByDate = dates.map((date) => {
        const record = classData.attendance.find(
          (item) =>
            item.studentId === student.id &&
            item.date.toISOString().slice(0, 10) === date
        );
        return record?.status ?? AttendanceStatus.PRESENT;
      });
      return csvRow([`${student.lastName}, ${student.firstName}`, ...statusByDate]);
    });
    content = [header, ...rows].join("\n");
  } else {
    const header = csvRow(["Student", "Total Participation"]);
    const rows = classData.students.map((student) => {
      const count = classData.recitations.filter(
        (item) => item.studentId === student.id && withinScope(item.date)
      ).length;
      return csvRow([`${student.lastName}, ${student.firstName}`, String(count)]);
    });
    content = [header, ...rows].join("\n");
  }

  return new NextResponse(content, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename=report-${type}.csv`
    }
  });
}
