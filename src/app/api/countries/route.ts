import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireEditor } from "@/lib/session";
import { KB_SECTIONS } from "@/types/country";

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function POST(request: Request) {
  const user = await requireEditor();
  if (!user) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const name = String(body.name ?? "").trim();
  const code = String(body.code ?? "").trim().toUpperCase();
  const region = String(body.region ?? "").trim();
  const slug = String(body.slug ?? slugify(name)).trim().toLowerCase();
  const eligible = Boolean(body.eligible);
  const currency = body.currency ? String(body.currency).trim().toUpperCase() : null;

  if (!name || !code || !region || !slug) {
    return NextResponse.json(
      { error: "Name, code, region, and slug are required." },
      { status: 400 },
    );
  }

  if (!/^[A-Z]{3}$/.test(code)) {
    return NextResponse.json(
      { error: "Country code must be a 3-letter ISO code (e.g. USA)." },
      { status: 400 },
    );
  }

  const existing = await prisma.country.findFirst({
    where: { OR: [{ slug }, { code }] },
  });
  if (existing) {
    return NextResponse.json(
      { error: "A country with this slug or code already exists." },
      { status: 409 },
    );
  }

  const country = await prisma.country.create({
    data: {
      slug,
      name,
      code,
      region,
      eligible,
      currency,
      contentSource: "AI_GENERATED",
      updatedById: user.id,
      kbSections: {
        create: KB_SECTIONS.map(({ key }) => ({
          sectionKey: key,
          status: "draft",
          content: "",
          contentSource: "AI_GENERATED",
        })),
      },
    },
  });

  return NextResponse.json({ slug: country.slug }, { status: 201 });
}
