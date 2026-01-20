import { parse } from "csv-parse/sync";

export type CsvStudentRow = {
  firstName: string;
  lastName: string;
  nickname?: string;
  studentId: string;
  contactNumber?: string;
  photoUrl?: string;
};

export function parseStudentsCsv(contents: string): CsvStudentRow[] {
  const records = parse(contents, {
    columns: true,
    skip_empty_lines: true,
    trim: true
  });

  return records.map((record: Record<string, string>) => ({
    firstName: record.firstName || record.first_name || "",
    lastName: record.lastName || record.last_name || "",
    nickname: record.nickname || undefined,
    studentId: record.studentId || record.student_id || "",
    contactNumber: record.contactNumber || record.contact_number || undefined,
    photoUrl: record.photoUrl || record.photo_url || undefined
  }));
}
