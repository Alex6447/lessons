"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/db";
import {
  authenticate,
  createSession,
  destroySession,
  hashPassword,
} from "@/lib/auth";
import { homeFor } from "@/lib/guard";

function slugify(input: string): string {
  const base = input
    .toLowerCase()
    .replace(/[^a-z0-9а-я]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32);
  return base || "tutor";
}

async function uniqueSlug(seed: string): Promise<string> {
  let slug = slugify(seed);
  let n = 0;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const candidate = n === 0 ? slug : `${slug}-${n}`;
    const exists = await prisma.tenant.findUnique({ where: { slug: candidate } });
    if (!exists) return candidate;
    n++;
  }
}

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function loginAction(
  _prev: { error?: string } | undefined,
  formData: FormData
): Promise<{ error?: string }> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: "Проверьте email и пароль." };

  const user = await authenticate(parsed.data.email, parsed.data.password);
  if (!user) return { error: "Неверный email или пароль." };

  await createSession(user);
  redirect(homeFor(user));
}

const registerSchema = z.object({
  name: z.string().min(2, "Укажите имя"),
  email: z.string().email("Некорректный email"),
  password: z.string().min(8, "Пароль минимум 8 символов"),
  workspace: z.string().min(2, "Укажите название кабинета"),
});

export async function registerTutorAction(
  _prev: { error?: string } | undefined,
  formData: FormData
): Promise<{ error?: string }> {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    workspace: formData.get("workspace"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Проверьте данные." };
  }
  const { name, email, password, workspace } = parsed.data;
  const lowerEmail = email.toLowerCase();

  const existing = await prisma.user.findUnique({ where: { email: lowerEmail } });
  if (existing) return { error: "Пользователь с таким email уже существует." };

  const slug = await uniqueSlug(workspace || lowerEmail.split("@")[0]);
  const passwordHash = await hashPassword(password);

  // Register a tutor = create their Tenant (workspace) + user + profile + subscription.
  const freePlan = await prisma.plan.findFirst({ where: { priceKopecks: 0, active: true } });
  const tenant = await prisma.tenant.create({
    data: {
      name: workspace,
      slug,
      planId: freePlan?.id,
      subscription: { create: { status: "trialing" } },
    },
  });

  const tutor = await prisma.user.create({
    data: {
      email: lowerEmail,
      passwordHash,
      name,
      role: "tutor",
      tenantId: tenant.id,
      tutorProfile: {
        create: { tenantId: tenant.id },
      },
    },
  });

  await createSession({
    uid: tutor.id,
    email: tutor.email,
    name: tutor.name,
    role: "tutor",
    tenantId: tenant.id,
  });
  redirect("/tutor");
}

export async function logoutAction() {
  await destroySession();
  redirect("/");
}
