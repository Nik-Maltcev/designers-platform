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

  return NextResponse.json({ success: true, id: pr.id });
}
