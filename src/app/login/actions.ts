"use server";

import { redirect } from "next/navigation";
import { clearSession, setSession, verifyPin } from "@/lib/auth/session";

const safeNext = (next: string) => (next.startsWith("/") && !next.startsWith("//") ? next : "/");

export async function loginAction(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const pin = String(formData.get("pin") ?? "").trim();
  const next = safeNext(String(formData.get("next") ?? "/"));

  if (!name || !/^\d{6}$/.test(pin)) redirect(`/login?error=invalid&next=${encodeURIComponent(next)}`);

  let user: Awaited<ReturnType<typeof verifyPin>> = null;
  try {
    user = await verifyPin(name, pin);
  } catch {
    redirect(`/login?error=db&next=${encodeURIComponent(next)}`);
  }
  if (!user) redirect(`/login?error=wrong&next=${encodeURIComponent(next)}`);

  await setSession({ name: user.name, role: user.role, plant: user.plant ?? null, department: user.department ?? null });
  redirect(next);
}

export async function logoutAction() {
  await clearSession();
  redirect("/login");
}
