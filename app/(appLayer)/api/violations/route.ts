import { NextResponse } from "next/server";
import { ViolationsResponse } from "@/contracts";
import { getContainer, unauthorized } from "@/appLayer/libs/container";
import { toViolationsResponse } from "../_lib/mappers";

export async function GET(req: Request) {
  const container = await getContainer()
  if (!container) return unauthorized()

  const { searchParams } = new URL(req.url)
  const from = searchParams.get('from')!.toString()
  const to = searchParams.get('to')!.toString()

  const violations: ViolationsResponse = toViolationsResponse(await container.getViolations(from, to))

  return NextResponse.json(violations)
}
