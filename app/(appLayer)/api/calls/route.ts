import { NextResponse } from "next/server";
import { CallsResponse } from "@/contracts";
import { getContainer, unauthorized } from "@/appLayer/libs/container";
import { toCallDto } from "../_lib/mappers";

export async function GET(req: Request) {
  const container = await getContainer()
  if (!container) return unauthorized()

  const { searchParams } = new URL(req.url)
  const from = searchParams.get('from')?.toString() || ''
  const to = searchParams.get('to')?.toString() || ''

  const calls: CallsResponse = (await container.getCalls(from, to)).map(toCallDto)

  return NextResponse.json(calls);
}
