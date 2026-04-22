import { auth } from "../../../lib/auth";
import { prisma } from "../../../lib/prisma";
import { NextResponse } from "next/server";
import { YooCheckout } from "@a2seven/yoo-checkout";
import { randomUUID } from "crypto";

const checkout = new YooCheckout({
  shopId: process.env.YOOKASSA_SHOP_ID,
  secretKey: process.env.YOOKASSA_SECRET_KEY,
});

export async function POST(request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Не авторизован" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const plan = body.plan || "pro";

  const plans = {
    test: { amount: 5, description: "Тестовый тариф", name: "Тестовый тариф" },
    pro: { amount: 29990, description: "Подписка Профи на 1 год", name: "Подписка Профи" },
  };

  const selected = plans[plan] || plans.pro;

  try {
    const payment = await checkout.createPayment(
      {
        amount: { value: String(selected.amount) + ".00", currency: "RUB" },
        capture: true,
        confirmation: {
          type: "redirect",
          return_url: `${process.env.NEXTAUTH_URL}/payment/success`,
        },
        description: `${selected.name} — ПроектЛист (${session.user.email})`,
        metadata: { userId: session.user.id, plan },
        receipt: {
          customer: { email: session.user.email },
          items: [
            {
              description: selected.description,
              quantity: "1",
              amount: { value: String(selected.amount) + ".00", currency: "RUB" },
              vat_code: 1,
            },
          ],
        },
      },
      randomUUID()
    );

    await prisma.subscription.create({
      data: {
        userId: session.user.id,
        plan,
        status: "pending",
        amount: selected.amount,
        yookassaId: payment.id,
      },
    });

    await prisma.auditLog.create({
      data: { userId: session.user.id, action: "payment_initiated", targetId: payment.id, targetType: "subscription" },
    });

    return NextResponse.json({ confirmationUrl: payment.confirmation.confirmation_url });
  } catch (err) {
    console.error("YooKassa error:", err);
    return NextResponse.json({ error: "Ошибка создания платежа" }, { status: 500 });
  }
}
