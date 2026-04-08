import { prisma } from "../../../lib/prisma";
import { NextResponse } from "next/server";

export async function POST(request) {
  const body = await request.json();
  const event = body.event;
  const payment = body.object;

  if (!payment?.id) return NextResponse.json({ ok: true });

  if (event === "payment.succeeded") {
    const sub = await prisma.subscription.findFirst({
      where: { yookassaId: payment.id },
    });

    if (sub) {
      const now = new Date();
      const endDate = new Date(now);
      endDate.setFullYear(endDate.getFullYear() + 1);

      await prisma.subscription.update({
        where: { id: sub.id },
        data: {
          status: "active",
          paymentId: payment.id,
          startDate: now,
          endDate,
        },
      });

      await prisma.notification.create({
        data: {
          userId: sub.userId,
          title: "Подписка активирована",
          message: "Тариф Профи активирован на 1 год. Спасибо за оплату!",
          link: "/dashboard",
        },
      });

      await prisma.auditLog.create({
        data: { userId: sub.userId, action: "payment_succeeded", targetId: payment.id, targetType: "subscription" },
      });
    }
  }

  if (event === "payment.canceled") {
    const sub = await prisma.subscription.findFirst({
      where: { yookassaId: payment.id },
    });
    if (sub) {
      await prisma.subscription.update({
        where: { id: sub.id },
        data: { status: "canceled" },
      });
    }
  }

  return NextResponse.json({ ok: true });
}
