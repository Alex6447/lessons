"use server";

import { z } from "zod";
import { prisma } from "@/lib/db";

const leadSchema = z.object({
  courseId: z.string().min(1),
  name: z.string().min(2, "Укажите имя"),
  contact: z.string().min(3, "Укажите email или телефон"),
  message: z.string().optional(),
});

/**
 * Public lead submission from the catalog. The lead is attached to the
 * course owner's tenant so it shows up in that tutor's "Заявки".
 */
export async function submitLeadAction(
  _prev: { error?: string; ok?: boolean } | undefined,
  formData: FormData
): Promise<{ error?: string; ok?: boolean }> {
  const parsed = leadSchema.safeParse({
    courseId: formData.get("courseId"),
    name: formData.get("name"),
    contact: formData.get("contact"),
    message: formData.get("message") || "",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Проверьте форму." };
  }

  const course = await prisma.course.findFirst({
    where: { id: parsed.data.courseId, status: "published" },
    select: { tenantId: true },
  });
  if (!course) return { error: "Курс не найден." };

  await prisma.lead.create({
    data: {
      tenantId: course.tenantId,
      name: parsed.data.name,
      contact: parsed.data.contact,
      message: parsed.data.message ?? "",
    },
  });

  return { ok: true };
}
