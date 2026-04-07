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
    description: user.description || "",
    inn: user.inn || "",
    website: user.website || "",
    categories: user.categories || [],
    objectTypes: user.objectTypes || [],
    segment: user.segment || "",
    hasProduction: user.hasProduction || false,
    hasInstallation: user.hasInstallation || false,
    minBudget: user.minBudget || "",
    estimateTime: user.estimateTime || "",
    materials: user.materials || [],
    services: user.services || [],
  });
}

export async function POST(request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
  }

  const body = await request.json();
  const { name, phone, role, companyName, city, description, inn, website, categories, objectTypes, segment, hasProduction, hasInstallation, minBudget, estimateTime, materials, services } = body;

  if (!name || !role) {
    return NextResponse.json({ error: "Имя и роль обязательны" }, { status: 400 });
  }

  // Validation
  if (typeof name !== "string" || name.length > 200) return NextResponse.json({ error: "Имя слишком длинное" }, { status: 400 });
  if (description && description.length > 2000) return NextResponse.json({ error: "Описание слишком длинное" }, { status: 400 });
  if (inn && !/^\d{10,12}$/.test(inn)) return NextResponse.json({ error: "ИНН должен содержать 10-12 цифр" }, { status: 400 });
  if (phone && phone.length > 20) return NextResponse.json({ error: "Телефон слишком длинный" }, { status: 400 });
  if (Array.isArray(categories) && categories.length > 20) return NextResponse.json({ error: "Слишком много категорий" }, { status: 400 });
  if (Array.isArray(materials) && materials.length > 30) return NextResponse.json({ error: "Слишком много материалов" }, { status: 400 });

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
      description: description || null,
      inn: inn || null,
      website: website || null,
      categories: categories || [],
      objectTypes: objectTypes || [],
      segment: segment || null,
      hasProduction: hasProduction || false,
      hasInstallation: hasInstallation || false,
      minBudget: minBudget || null,
      estimateTime: estimateTime || null,
      materials: materials || [],
      services: services || [],
      profileFilled: true,
      lastActive: new Date(),
    },
  });

  return NextResponse.json({ success: true, user: { id: user.id, name: user.name, role: user.role } });
}
