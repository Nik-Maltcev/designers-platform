import { auth } from "../../lib/auth";
import { prisma } from "../../lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) return NextResponse.json({ error: "Пользователь не найден" }, { status: 404 });

  return NextResponse.json({
    name: user.name || "",
    phone: user.phone || "",
    role: user.role || "",
    companyName: user.companyName || "",
    city: user.city || "",
  });
}

export async function POST(request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
  }

  const body = await request.json();
  const { name, phone, role, companyName, city } = body;

  if (!name || !role) {
    return NextResponse.json({ error: "Имя и роль обязательны" }, { status: 400 });
  }

  const allowedRoles = ["designer", "contractor", "supplier", "architect", "completer"];
  if (!allowedRoles.includes(role)) {
    return NextResponse.json({ error: "Недопустимая роль" }, { status: 400 });
  }

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: {
      name,
      phone: phone || null,
      role,
      companyName: companyName || null,
      city: city || null,
      profileFilled: true,
    },
  });

  return NextResponse.json({ success: true, user: { id: user.id, name: user.name, role: user.role } });
}
