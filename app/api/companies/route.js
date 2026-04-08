import { prisma } from "../../lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") || "";
  const city = searchParams.get("city") || "";
  const segment = searchParams.get("segment") || "";
  const q = searchParams.get("q") || "";
  const page = Math.max(1, parseInt(searchParams.get("page")) || 1);
  const limit = 20;
  const skip = (page - 1) * limit;

  const where = {
    active: true,
    ...(type && { type }),
    ...(city && { city }),
    ...(segment && { segment }),
    ...(q && {
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
      ],
    }),
  };

  const [companies, total] = await Promise.all([
    prisma.company.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      select: {
        id: true, name: true, slug: true, city: true, segment: true,
        type: true, categories: true, verified: true, logoUrl: true,
        hasProduction: true, hasInstallation: true, minBudget: true,
      },
    }),
    prisma.company.count({ where }),
  ]);

  return NextResponse.json({ companies, total, page, totalPages: Math.ceil(total / limit) });
}
