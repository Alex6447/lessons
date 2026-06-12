"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { requireTutor } from "@/lib/guard";

// All mutations re-check the tutor session and scope writes to their tenant.
// A course/module/lesson is only mutated after verifying it belongs to the
// tutor's tenant (proposal §3.1 — tenant isolation must never be skipped).

async function assertCourseInTenant(courseId: string, tenantId: string) {
  const course = await prisma.course.findFirst({
    where: { id: courseId, tenantId },
    select: { id: true },
  });
  if (!course) redirect("/tutor/courses");
  return course;
}

const courseSchema = z.object({
  title: z.string().min(2),
  subject: z.string().optional(),
  goal: z.string().optional(),
  level: z.string().optional(),
  ageGroup: z.string().optional(),
  priceRub: z.coerce.number().min(0).default(0),
});

export async function createCourseAction(formData: FormData) {
  const tutor = await requireTutor();
  const parsed = courseSchema.safeParse({
    title: formData.get("title"),
    subject: formData.get("subject"),
    goal: formData.get("goal"),
    level: formData.get("level"),
    ageGroup: formData.get("ageGroup"),
    priceRub: formData.get("priceRub"),
  });
  if (!parsed.success) return;

  const course = await prisma.course.create({
    data: {
      tenantId: tutor.tenantId,
      tutorId: tutor.uid,
      title: parsed.data.title,
      subject: parsed.data.subject ?? "",
      goal: parsed.data.goal ?? "",
      level: parsed.data.level ?? "",
      ageGroup: parsed.data.ageGroup ?? "",
      priceKopecks: Math.round((parsed.data.priceRub ?? 0) * 100),
    },
  });
  redirect(`/tutor/courses/${course.id}`);
}

export async function updateCourseAction(formData: FormData) {
  const tutor = await requireTutor();
  const courseId = String(formData.get("courseId"));
  await assertCourseInTenant(courseId, tutor.tenantId);
  const parsed = courseSchema.partial().safeParse({
    title: formData.get("title"),
    subject: formData.get("subject"),
    goal: formData.get("goal"),
    level: formData.get("level"),
    ageGroup: formData.get("ageGroup"),
    priceRub: formData.get("priceRub"),
  });
  if (!parsed.success) return;
  await prisma.course.update({
    where: { id: courseId },
    data: {
      title: parsed.data.title,
      subject: parsed.data.subject,
      goal: parsed.data.goal,
      level: parsed.data.level,
      ageGroup: parsed.data.ageGroup,
      ...(parsed.data.priceRub != null
        ? { priceKopecks: Math.round(parsed.data.priceRub * 100) }
        : {}),
    },
  });
  revalidatePath(`/tutor/courses/${courseId}`);
}

export async function togglePublishAction(formData: FormData) {
  const tutor = await requireTutor();
  const courseId = String(formData.get("courseId"));
  await assertCourseInTenant(courseId, tutor.tenantId);
  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) return;
  const publishing = course.status !== "published";
  await prisma.course.update({
    where: { id: courseId },
    data: {
      status: publishing ? "published" : "draft",
      // when published, also expose on public catalog as demo
      isDemo: publishing ? true : course.isDemo,
    },
  });
  revalidatePath(`/tutor/courses/${courseId}`);
}

export async function addModuleAction(formData: FormData) {
  const tutor = await requireTutor();
  const courseId = String(formData.get("courseId"));
  await assertCourseInTenant(courseId, tutor.tenantId);
  const title = String(formData.get("title") || "Новый модуль");
  const count = await prisma.module.count({ where: { courseId } });
  await prisma.module.create({
    data: { courseId, title, order: count + 1 },
  });
  revalidatePath(`/tutor/courses/${courseId}`);
}

export async function addLessonAction(formData: FormData) {
  const tutor = await requireTutor();
  const courseId = String(formData.get("courseId"));
  const moduleId = String(formData.get("moduleId"));
  await assertCourseInTenant(courseId, tutor.tenantId);
  const mod = await prisma.module.findFirst({
    where: { id: moduleId, courseId },
    select: { id: true },
  });
  if (!mod) return;
  const title = String(formData.get("title") || "Новый урок");
  const count = await prisma.lesson.count({ where: { moduleId } });
  await prisma.lesson.create({
    data: { moduleId, title, order: count + 1 },
  });
  revalidatePath(`/tutor/courses/${courseId}`);
}

export async function updateLessonAction(formData: FormData) {
  const tutor = await requireTutor();
  const courseId = String(formData.get("courseId"));
  const lessonId = String(formData.get("lessonId"));
  await assertCourseInTenant(courseId, tutor.tenantId);
  // verify lesson belongs to a module in this course
  const lesson = await prisma.lesson.findFirst({
    where: { id: lessonId, module: { courseId } },
    select: { id: true },
  });
  if (!lesson) return;
  await prisma.lesson.update({
    where: { id: lessonId },
    data: {
      title: String(formData.get("title") || ""),
      content: String(formData.get("content") || ""),
      diagram: String(formData.get("diagram") || ""),
    },
  });
  revalidatePath(`/tutor/courses/${courseId}`);
}

export async function deleteLessonAction(formData: FormData) {
  const tutor = await requireTutor();
  const courseId = String(formData.get("courseId"));
  const lessonId = String(formData.get("lessonId"));
  await assertCourseInTenant(courseId, tutor.tenantId);
  await prisma.lesson.deleteMany({
    where: { id: lessonId, module: { courseId } },
  });
  revalidatePath(`/tutor/courses/${courseId}`);
}

// ---- Students ----

const studentSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  courseId: z.string().optional(),
});

export async function addStudentAction(
  _prev: { error?: string; tempPassword?: string } | undefined,
  formData: FormData
): Promise<{ error?: string; tempPassword?: string }> {
  const tutor = await requireTutor();
  const parsed = studentSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    courseId: formData.get("courseId") || undefined,
  });
  if (!parsed.success) return { error: "Проверьте имя и email." };

  const email = parsed.data.email.toLowerCase();
  let student = await prisma.user.findUnique({ where: { email } });
  let tempPassword: string | undefined;

  if (!student) {
    tempPassword = Math.random().toString(36).slice(-8);
    student = await prisma.user.create({
      data: {
        email,
        name: parsed.data.name,
        role: "student",
        tenantId: tutor.tenantId,
        passwordHash: await hashPassword(tempPassword),
      },
    });
  } else if (student.tenantId !== tutor.tenantId || student.role !== "student") {
    return { error: "Этот email уже используется в системе." };
  }

  if (parsed.data.courseId) {
    const course = await prisma.course.findFirst({
      where: { id: parsed.data.courseId, tenantId: tutor.tenantId },
      select: { id: true },
    });
    if (course) {
      await prisma.enrollment.upsert({
        where: { studentId_courseId: { studentId: student.id, courseId: course.id } },
        update: {},
        create: { tenantId: tutor.tenantId, studentId: student.id, courseId: course.id },
      });
    }
  }

  revalidatePath("/tutor/students");
  return { tempPassword };
}

// ---- Leads ----

export async function updateLeadStatusAction(formData: FormData) {
  const tutor = await requireTutor();
  const leadId = String(formData.get("leadId"));
  const status = String(formData.get("status"));
  await prisma.lead.updateMany({
    where: { id: leadId, tenantId: tutor.tenantId },
    data: { status },
  });
  revalidatePath("/tutor/leads");
}
