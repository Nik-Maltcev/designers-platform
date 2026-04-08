import { auth } from "../../../lib/auth";
import { prisma } from "../../../lib/prisma";
import { NextResponse } from "next/server";
import { YooCheckout } from "@a2seven/yoo-checkout";
import { randomUUID } from "crypto";

const checkout = new YooCheckout({
  shopId: process.env.YOOKASSA_SHOP_ID,
  secretKey: process.env.YOOKASSA_SECRET_KEY,
});

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Не авторизован" }, { status: 401 });

  const amount = 29990;

  try {
    const payment = await checkout.createPayment(
      {
        amount: { value: String(amount) + ".00", currency: "RUB" },
        capture: true,
        confirmation: {
          type: "redirect",
          return_url: `${process.env.NEXTAUTH_URL}/payment/success`,
        },
        description: `Подписка Профи — ПроектЛист (${session.user.email})`,
        metadata: { userId: session.user.id },
        receipt: {
          customer: { email: session.user.email },
          items: [
            {
              description: "Подписка Профи на 1 год",
              quantity: "1",
              amount: { value: String(amount) + ".00", currency: "RUB" },
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
        plan: "pro",
        status: "pending",
        amount,
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
