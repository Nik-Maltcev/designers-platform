import { auth } from "../../lib/auth";
import { prisma } from "../../lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Не авторизован" }, { status: 401 });

  const requests = await prisma.projectRequest.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(requests);
}

export async function POST(request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Не авторизован" }, { status: 401 });

  const body = await request.json();
  const { role, category, location, objectType, level, urgency, description, contactName, contactPhone, contactEmail, hidePhone } = body;

  if (!category) return NextResponse.json({ error: "Категория обязательна" }, { status: 400 });

  const pr = await prisma.projectRequest.create({
    data: {
      userId: session.user.id,
      role: role || "",
      category,
      location: location || null,
      objectType: objectType || null,
      level: level || null,
      urgency: urgency || null,
      description: description || null,
      contactName: contactName || null,
      contactPhone: contactPhone || null,
      contactEmail: contactEmail || null,
      hidePhone: hidePhone || false,
    },
  });

  await prisma.notification.create({
    data: {
      userId: session.user.id,
      title: "Проект отправлен",
      message: `Ваш запрос на подбор по категории "${category}" принят. Мы подберём подрядчиков в течение 48 часов.`,
      link: "/my-requests",
    },
  });

  await prisma.auditLog.create({
    data: { userId: session.user.id, action: "project_request_created", targetId: pr.id, targetType: "project_request" },
  });

  // Email notification
  const nodemailer = await import("nodemailer");
  const transporter = nodemailer.default.createTransport({
    host: process.env.EMAIL_SERVER_HOST,
    port: Number(process.env.EMAIL_SERVER_PORT),
    auth: { user: process.env.EMAIL_SERVER_USER, pass: process.env.EMAIL_SERVER_PASSWORD },
  });
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: "skokov.ia@mail.ru",
      subject: `🆕 Новый проект: ${category} — ${contactName || "Аноним"}`,
      text: [
        `Имя: ${contactName || "—"}`,
        `Email: ${contactEmail || "—"}`,
        `Телефон: ${contactPhone || "—"}`,
        `Роль: ${role || "—"}`,
        `Категория: ${category}`,
        `Локация: ${location || "—"}`,
        `Тип объекта: ${objectType || "—"}`,
        `Уровень: ${level || "—"}`,
        `Срочность: ${urgency || "—"}`,
        `Описание: ${description || "—"}`,
        `Скрыть телефон: ${hidePhone ? "Да" : "Нет"}`,
      ].join("\n"),
    });
  } catch (err) { console.error("Email error:", err.message); }

  // Telegram notification
  const TG_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  const TG_CHAT = process.env.TELEGRAM_CHAT_ID;
  if (TG_TOKEN && TG_CHAT) {
    const chatIds = TG_CHAT.split(",").map(id => id.trim());
    const text = `🆕 Новый проект на подбор!\n\n` +
      `👤 ${contactName || "—"}\n` +
      `📧 ${contactEmail || "—"}\n` +
      `📱 ${contactPhone || "—"}\n` +
      `🏷 Роль: ${role || "—"}\n` +
      `📦 Категория: ${category}\n` +
      `📍 Локация: ${location || "—"}\n` +
      `🏠 Тип: ${objectType || "—"}\n` +
      `💎 Уровень: ${level || "—"}\n` +
      `⏰ Срочность: ${urgency || "—"}\n` +
      `📝 Описание: ${description || "—"}\n` +
      `🔒 Скрыть телефон: ${hidePhone ? "Да" : "Нет"}`;
    try {
      for (const chatId of chatIds) {
        await fetch(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
        });
      }
    } catch {}
  }

  return NextResponse.json({ success: true, id: pr.id });
}
