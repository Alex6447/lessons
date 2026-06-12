import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { SETTING_DEFS } from "../src/lib/settings";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // 1. Platform settings (defaults from SETTING_DEFS)
  for (const def of SETTING_DEFS) {
    await prisma.platformSettings.upsert({
      where: { key: def.key },
      update: {}, // don't overwrite admin-edited values
      create: {
        key: def.key,
        value: def.default,
        group: def.group,
        label: def.label,
        type: def.type,
      },
    });
  }
  console.log(`  settings: ${SETTING_DEFS.length}`);

  // 2. Subscription plans
  const free = await prisma.plan.upsert({
    where: { id: "plan_free" },
    update: {},
    create: {
      id: "plan_free",
      name: "Старт",
      priceKopecks: 0,
      maxStudents: 5,
      maxCourses: 2,
      storageMb: 500,
    },
  });
  await prisma.plan.upsert({
    where: { id: "plan_pro" },
    update: {},
    create: {
      id: "plan_pro",
      name: "Про",
      priceKopecks: 149000, // 1490 ₽/мес
      maxStudents: 100,
      maxCourses: 50,
      storageMb: 20000,
      commissionRateOverride: 0.02, // дешевле комиссия на платном тарифе
    },
  });
  console.log("  plans: 2");

  // 3. Platform admin (no tenant)
  const adminHash = await bcrypt.hash("admin12345", 10);
  await prisma.user.upsert({
    where: { email: "admin@lessons.dev" },
    update: {},
    create: {
      email: "admin@lessons.dev",
      passwordHash: adminHash,
      name: "Платформенный администратор",
      role: "admin",
    },
  });

  // 4. Demo tenant with a tutor
  const tenant = await prisma.tenant.upsert({
    where: { slug: "demo-tutor" },
    update: {},
    create: {
      name: "Анна Петрова — математика",
      slug: "demo-tutor",
      planId: free.id,
      subscription: { create: { status: "active" } },
    },
  });

  const tutorHash = await bcrypt.hash("tutor12345", 10);
  const tutor = await prisma.user.upsert({
    where: { email: "tutor@lessons.dev" },
    update: {},
    create: {
      email: "tutor@lessons.dev",
      passwordHash: tutorHash,
      name: "Анна Петрова",
      role: "tutor",
      tenantId: tenant.id,
      tutorProfile: {
        create: {
          tenantId: tenant.id,
          headline: "Репетитор по математике, 8 лет опыта",
          bio: "Готовлю к ОГЭ/ЕГЭ и подтягиваю школьную программу. Индивидуальный подход.",
          subjects: "Математика,Алгебра,Геометрия",
        },
      },
    },
  });

  // 5. Demo student
  const studentHash = await bcrypt.hash("student12345", 10);
  const student = await prisma.user.upsert({
    where: { email: "student@lessons.dev" },
    update: {},
    create: {
      email: "student@lessons.dev",
      passwordHash: studentHash,
      name: "Иван Смирнов",
      role: "student",
      tenantId: tenant.id,
    },
  });

  // 6. Demo course (published + demo on catalog)
  const existingCourse = await prisma.course.findFirst({
    where: { tenantId: tenant.id, title: "Подготовка к ОГЭ по математике" },
  });
  let courseId = existingCourse?.id;
  if (!existingCourse) {
    const course = await prisma.course.create({
      data: {
        tenantId: tenant.id,
        tutorId: tutor.id,
        title: "Подготовка к ОГЭ по математике",
        goal: "Сдать ОГЭ по математике на 4–5",
        level: "9 класс",
        ageGroup: "14–15 лет",
        subject: "Математика",
        priceKopecks: 990000, // 9900 ₽
        status: "published",
        isDemo: true,
        modules: {
          create: [
            {
              order: 1,
              title: "Числа и вычисления",
              lessons: {
                create: [
                  {
                    order: 1,
                    title: "Действия с дробями",
                    content:
                      "## Дроби\n\nВ этом уроке разбираем сложение, вычитание, умножение и деление обыкновенных дробей.",
                    diagram:
                      "graph TD; A[Дробь] --> B[Сложение]; A --> C[Умножение]; A --> D[Деление]",
                  },
                  {
                    order: 2,
                    title: "Проценты",
                    content: "## Проценты\n\nКак находить процент от числа и число по проценту.",
                  },
                ],
              },
            },
            {
              order: 2,
              title: "Алгебра",
              lessons: {
                create: [
                  {
                    order: 1,
                    title: "Линейные уравнения",
                    content: "## Линейные уравнения\n\nРешение уравнений вида ax + b = 0.",
                  },
                ],
              },
            },
          ],
        },
      },
    });
    courseId = course.id;
  }

  // 7. Enroll the demo student
  if (courseId) {
    await prisma.enrollment.upsert({
      where: { studentId_courseId: { studentId: student.id, courseId } },
      update: {},
      create: {
        tenantId: tenant.id,
        studentId: student.id,
        courseId,
        status: "active",
      },
    });
  }

  // 8. A sample lead
  const leadExists = await prisma.lead.findFirst({
    where: { tenantId: tenant.id, contact: "parent@example.com" },
  });
  if (!leadExists) {
    await prisma.lead.create({
      data: {
        tenantId: tenant.id,
        name: "Мария (мама ученика)",
        contact: "parent@example.com",
        message: "Здравствуйте! Нужна подготовка сына к ОГЭ. Какие условия?",
      },
    });
  }

  console.log("Seed complete.");
  console.log("  Admin:   admin@lessons.dev / admin12345");
  console.log("  Tutor:   tutor@lessons.dev / tutor12345");
  console.log("  Student: student@lessons.dev / student12345");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
