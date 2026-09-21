import { NextResponse } from "next/server";
import { AccessResponse } from "@/contracts";
import { forbidden, getContainer, unauthorized } from "@/appLayer/libs/container";
import { toAccessEventDto } from "../_lib/mappers";

// GET /api/access?limit=30&actor=<account id>, see contracts/access.ts
export async function GET(req: Request) {
  const container = await getContainer()
  if (!container) return unauthorized()
  if (!container.access) return forbidden()

  const { searchParams } = new URL(req.url)

  const events = await container.access.list({
    limit: Number(searchParams.get('limit')) || undefined,
    actorId: searchParams.get('actor') || undefined,
  })

  const response: AccessResponse = events.map(toAccessEventDto)

  return NextResponse.json(response)
}
