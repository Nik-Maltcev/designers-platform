import { auth } from "../../lib/auth";
import { prisma } from "../../lib/prisma";
import { NextResponse } from "next/server";

export async function POST(request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Не авторизован" }, { status: 401 });

  const body = await request.json();
  const { targetId, targetType, reason, description, companyId } = body;

  if (!targetId || !targetType || !reason) {
    return NextResponse.json({ error: "targetId, targetType и reason обязательны" }, { status: 400 });
  }

  const allowedTypes = ["company", "user", "proposal"];
  if (!allowedTypes.includes(targetType)) {
    return NextResponse.json({ error: "Недопустимый targetType" }, { status: 400 });
  }

  if (reason.length > 500) return NextResponse.json({ error: "Причина слишком длинная" }, { status: 400 });
  if (description && description.length > 2000) return NextResponse.json({ error: "Описание слишком длинное" }, { status: 400 });

  const complaint = await prisma.complaint.create({
    data: {
      userId: session.user.id,
      targetId,
      targetType,
      reason,
      description: description || null,
      companyId: companyId || null,
    },
  });

  await prisma.auditLog.create({
    data: { userId: session.user.id, action: "complaint_filed", targetId: complaint.id, targetType: "complaint" },
  });

  return NextResponse.json({ success: true, id: complaint.id });
}
