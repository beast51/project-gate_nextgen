import { NextResponse } from "next/server";
import { ApiErrorResponse, ViolationStatsResponse } from "@/contracts";
import { getContainer, unauthorized } from "@/appLayer/libs/container";

const isDay = (value: string | null): value is string =>
  value !== null && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value));

export async function GET(req: Request) {
  const container = await getContainer()
  if (!container) return unauthorized()

  const day = new URL(req.url).searchParams.get('day')
  if (!isDay(day)) {
    return NextResponse.json<ApiErrorResponse>({ error: 'day=YYYY-MM-DD is expected' }, { status: 400 })
  }

  const stats: ViolationStatsResponse = await container.getViolationStats(day)

  return NextResponse.json(stats)
}
