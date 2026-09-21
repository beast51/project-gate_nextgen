import { NextResponse } from "next/server";
import { ApiErrorResponse, BackfillCallsRequest, BackfillCallsResponse } from "@/contracts";
import { forbidden, getContainer, unauthorized } from "@/appLayer/libs/container";

// Loads ONE missing day of the history per request. The pace is set by the caller
// (scripts/backfill-calls.mjs pauses between the requests), so the telephony never sees a burst.
export async function POST(req: Request) {
  const container = await getContainer()
  if (!container) return unauthorized()
  if (!container.backfillCalls) return forbidden()

  const { from, to }: Partial<BackfillCallsRequest> = await req.json().catch(() => ({}))
  const isDay = (value: unknown) => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)

  if (!isDay(from) || !isDay(to)) {
    return NextResponse.json<ApiErrorResponse>({ error: 'from and to are expected as YYYY-MM-DD' }, { status: 400 })
  }

  try {
    const step: BackfillCallsResponse = await container.backfillCalls.fillNextDay(String(from), String(to))
    return NextResponse.json(step)
  } catch (error) {
    console.error(error)
    return NextResponse.json<ApiErrorResponse>({ error: 'The day was not loaded' }, { status: 502 })
  }
}
