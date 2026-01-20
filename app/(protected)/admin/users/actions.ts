"use server";

import bcrypt from "bcrypt";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { Role } from "@prisma/client";

export async function createTeacher(formData: FormData) {
  const user = await requireSession(Role.ADMIN);
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "").trim();
  const displayName = String(formData.get("displayName") ?? "").trim();

  if (!username || !password || !displayName) return;

  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.user.create({
    data: {
      username,
      passwordHash,
      role: Role.TEACHER,
      teacher: {
        create: {
          displayName
        }
      }
    }
  });

  revalidatePath("/admin/users");
}

export async function resetPassword(userId: string, formData: FormData) {
  await requireSession(Role.ADMIN);
  const password = String(formData.get("password") ?? "").trim();
  if (!password) return;

  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash }
  });

  revalidatePath("/admin/users");
}

export async function updateLoginHeader(formData: FormData) {
  await requireSession(Role.ADMIN);
  const headerUrl = String(formData.get("headerUrl") ?? "").trim();
  if (!headerUrl) return;

  await prisma.appSetting.upsert({
    where: { key: "loginHeaderUrl" },
    update: { value: headerUrl },
    create: {
      key: "loginHeaderUrl",
      value: headerUrl
    }
  });

  revalidatePath("/login");
  revalidatePath("/admin/users");
}
