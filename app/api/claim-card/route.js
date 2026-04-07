import { auth } from "../../lib/auth";
import { prisma } from "../../lib/prisma";
import { NextResponse } from "next/server";

export async function POST(request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Не авторизован" }, { status: 401 });

  const body = await request.json();
  const { companyName, inn, website, phone, contactName, position, email } = body;

  if (!companyName) return NextResponse.json({ error: "Название компании обязательно" }, { status: 400 });

  const claim = await prisma.claimCard.create({
    data: {
      userId: session.user.id,
      companyName,
      inn: inn || null,
      website: website || null,
      phone: phone || null,
      contactName: contactName || null,
      position: position || null,
      email: email || null,
    },
  });

  await prisma.notification.create({
    data: {
      userId: session.user.id,
      title: "Заявка на карточку принята",
      message: `Ваша заявка на карточку "${companyName}" принята. Мы проверим данные и свяжемся с вами.`,
      link: "/dashboard",
    },
  });

  await prisma.auditLog.create({
    data: { userId: session.user.id, action: "claim_card_submitted", targetId: claim.id, targetType: "claim_card" },
  });

  return NextResponse.json({ success: true, id: claim.id });
}
