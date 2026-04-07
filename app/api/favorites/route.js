import { auth } from "../../lib/auth";
import { prisma } from "../../lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Не авторизован" }, { status: 401 });

  const favorites = await prisma.favorite.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(favorites);
}

export async function POST(request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Не авторизован" }, { status: 401 });

  const { targetId, targetType } = await request.json();
  if (!targetId || !targetType) return NextResponse.json({ error: "targetId и targetType обязательны" }, { status: 400 });

  const existing = await prisma.favorite.findUnique({
    where: { userId_targetId_targetType: { userId: session.user.id, targetId, targetType } },
  });

  if (existing) {
    await prisma.favorite.delete({ where: { id: existing.id } });
    return NextResponse.json({ favorited: false });
  }

  await prisma.favorite.create({
    data: { userId: session.user.id, targetId, targetType },
  });

  await prisma.auditLog.create({
    data: { userId: session.user.id, action: "favorite_add", targetId, targetType },
  });

  return NextResponse.json({ favorited: true });
}
