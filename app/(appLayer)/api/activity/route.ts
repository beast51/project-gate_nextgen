import { NextResponse } from "next/server";
import { ActivityResponse } from "@/contracts";
import { forbidden, getContainer, unauthorized } from "@/appLayer/libs/container";
import { toActivityEventDto } from "../_lib/mappers";

// GET /api/activity?limit=10&actor=<account id>&from=<ISO>&to=<ISO>, see contracts/activity.ts
export async function GET(req: Request) {
  const container = await getContainer()
  if (!container) return unauthorized()
  if (!container.activity) return forbidden()

  const { searchParams } = new URL(req.url)

  const events = await container.activity.list({
    limit: Number(searchParams.get('limit')) || undefined,
    actorId: searchParams.get('actor') || undefined,
    from: searchParams.get('from'),
    to: searchParams.get('to'),
  })

  const response: ActivityResponse = events.map(toActivityEventDto)

  return NextResponse.json(response)
}
