import { auth } from "../../lib/auth";
import { prisma } from "../../lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Не авторизован" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const requestId = searchParams.get("requestId");

  if (requestId) {
    // Get proposals for a specific request (only if user owns the request)
    const pr = await prisma.projectRequest.findFirst({ where: { id: requestId, userId: session.user.id } });
    if (!pr) return NextResponse.json({ error: "Запрос не найден" }, { status: 404 });

    const proposals = await prisma.proposal.findMany({
      where: { requestId },
      include: { company: { select: { name: true, city: true, segment: true, verified: true } } },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(proposals);
  }

  // Get proposals sent by user's company
  const proposals = await prisma.proposal.findMany({
    where: { userId: session.user.id },
    include: { request: { select: { category: true, objectType: true, location: true, status: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(proposals);
}

export async function POST(request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Не авторизован" }, { status: 401 });

  const body = await request.json();
  const { requestId, companyId, priceMin, priceMax, timeline, comment, hassamples, conditions } = body;

  if (!requestId || !companyId) return NextResponse.json({ error: "requestId и companyId обязательны" }, { status: 400 });

  const proposal = await prisma.proposal.create({
    data: {
      requestId,
      companyId,
      userId: session.user.id,
      priceMin: priceMin ? parseInt(priceMin) : null,
      priceMax: priceMax ? parseInt(priceMax) : null,
      timeline: timeline || null,
      comment: comment || null,
      hassamples: hassamples || false,
      conditions: conditions || null,
    },
  });

  // Notify request owner
  const pr = await prisma.projectRequest.findUnique({ where: { id: requestId } });
  if (pr) {
    await prisma.notification.create({
      data: {
        userId: pr.userId,
        title: "Новое предложение",
        message: `Получено предложение по запросу "${pr.category}"`,
        link: `/my-requests`,
      },
    });
  }

  await prisma.auditLog.create({
    data: { userId: session.user.id, action: "proposal_sent", targetId: proposal.id, targetType: "proposal" },
  });

  return NextResponse.json({ success: true, id: proposal.id });
}
