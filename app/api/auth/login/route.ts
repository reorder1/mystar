import { NextResponse } from "next/server";
import { createSession, verifyCredentials } from "@/lib/auth";

export async function POST(request: Request) {
  const formData = await request.formData();
  const username = String(formData.get("username") ?? "");
  const password = String(formData.get("password") ?? "");

  const user = await verifyCredentials(username, password);
  if (!user) {
    return NextResponse.redirect(new URL("/login?error=1", request.url));
  }

  await createSession(user.id);
  return NextResponse.redirect(new URL("/dashboard", request.url));
}
