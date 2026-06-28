import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireEditor } from "@/lib/session";
import { labelToDbSource } from "@/lib/country-mapper";
import { KB_SECTIONS } from "@/types/country";
import type { ContentSource } from "@prisma/client";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const user = await requireEditor();
  if (!user) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { slug } = await params;
  const body = await request.json();

  const country = await prisma.country.findUnique({ where: { slug } });
  if (!country) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const countryUpdate: Record<string, unknown> = {
    updatedById: user.id,
  };

  const scalarFields = [
    "name",
    "code",
    "region",
    "eligible",
    "alpacaRiskLevel",
    "currency",
    "ineligibilityReason",
    "ineligibilityCategory",
  ] as const;

  for (const field of scalarFields) {
    if (field in body) countryUpdate[field] = body[field];
  }

  if ("managedInvesting" in body) countryUpdate.managedInvesting = body.managedInvesting;
  if ("fees" in body) countryUpdate.fees = body.fees;

  if (body.contentSource) {
    countryUpdate.contentSource = labelToDbSource(
      body.contentSource,
    ) as ContentSource;
  }

  await prisma.country.update({
    where: { id: country.id },
    data: countryUpdate,
  });

  if (body.knowledgeBase && typeof body.knowledgeBase === "object") {
    for (const { key } of KB_SECTIONS) {
      const section = body.knowledgeBase[key];
      if (!section) continue;

      await prisma.kBSection.upsert({
        where: {
          countryId_sectionKey: { countryId: country.id, sectionKey: key },
        },
        create: {
          countryId: country.id,
          sectionKey: key,
          status: section.status ?? "draft",
          content: section.content ?? "",
          contentSource: section.contentSource
            ? labelToDbSource(section.contentSource)
            : "HUMAN_VERIFIED",
          updatedById: user.id,
        },
        update: {
          status: section.status,
          content: section.content,
          contentSource: section.contentSource
            ? labelToDbSource(section.contentSource)
            : "HUMAN_VERIFIED",
          updatedById: user.id,
        },
      });
    }
  }

  return NextResponse.json({ ok: true });
}
