"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireStudent } from "@/lib/guard";

/**
 * Mark a lesson done / not-done for the current student, then recompute the
 * enrollment progress %. All lookups are scoped to the student + their tenant.
 */
export async function setLessonProgressAction(formData: FormData) {
  const student = await requireStudent();
  const courseId = String(formData.get("courseId"));
  const lessonId = String(formData.get("lessonId"));
  const done = String(formData.get("done")) === "true";

  // Verify the student is enrolled in this course (within their tenant).
  const enrollment = await prisma.enrollment.findFirst({
    where: { studentId: student.uid, courseId, tenantId: student.tenantId },
  });
  if (!enrollment) return;

  // Verify the lesson belongs to this course.
  const lesson = await prisma.lesson.findFirst({
    where: { id: lessonId, module: { courseId } },
    select: { id: true },
  });
  if (!lesson) return;

  await prisma.progress.upsert({
    where: { enrollmentId_lessonId: { enrollmentId: enrollment.id, lessonId } },
    update: { status: done ? "done" : "not_started" },
    create: {
      enrollmentId: enrollment.id,
      lessonId,
      status: done ? "done" : "not_started",
    },
  });

  // Recompute progress percentage.
  const totalLessons = await prisma.lesson.count({
    where: { module: { courseId } },
  });
  const doneLessons = await prisma.progress.count({
    where: { enrollmentId: enrollment.id, status: "done" },
  });
  const pct = totalLessons === 0 ? 0 : Math.round((doneLessons / totalLessons) * 100);

  await prisma.enrollment.update({
    where: { id: enrollment.id },
    data: {
      progressPct: pct,
      status: pct === 100 ? "completed" : "active",
    },
  });

  revalidatePath(`/student/courses/${courseId}`);
  revalidatePath(`/student/courses/${courseId}/lessons/${lessonId}`);
}
