"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/guard";
import { SETTING_DEFS } from "@/lib/settings";

/**
 * Save edited platform settings. Writes an audit row per changed value
 * (proposal §4.2 — money-affecting params must be auditable).
 */
export async function updateSettingsAction(formData: FormData) {
  const admin = await requireAdmin();

  for (const def of SETTING_DEFS) {
    if (!formData.has(def.key)) continue;
    let newValue: string;
    if (def.type === "boolean") {
      newValue = formData.get(def.key) === "on" ? "true" : "false";
    } else {
      newValue = String(formData.get(def.key) ?? "");
    }

    const existing = await prisma.platformSettings.findUnique({ where: { key: def.key } });
    const oldValue = existing?.value ?? def.default;
    if (oldValue === newValue) continue;

    await prisma.platformSettings.upsert({
      where: { key: def.key },
      update: { value: newValue },
      create: {
        key: def.key,
        value: newValue,
        group: def.group,
        label: def.label,
        type: def.type,
      },
    });
    await prisma.settingsAudit.create({
      data: { key: def.key, oldValue, newValue, changedBy: admin.email },
    });
  }

  revalidatePath("/admin/settings");
}

export async function upsertPlanAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") || "");
  const data = {
    name: String(formData.get("name") || "Тариф"),
    priceKopecks: Math.round(Number(formData.get("priceRub") || 0) * 100),
    maxStudents: Number(formData.get("maxStudents") || 0),
    maxCourses: Number(formData.get("maxCourses") || 0),
    storageMb: Number(formData.get("storageMb") || 0),
    commissionRateOverride: formData.get("commissionPct")
      ? Number(formData.get("commissionPct")) / 100
      : null,
    active: formData.get("active") === "on",
  };
  if (id) {
    await prisma.plan.update({ where: { id }, data });
  } else {
    await prisma.plan.create({ data });
  }
  revalidatePath("/admin/plans");
}
