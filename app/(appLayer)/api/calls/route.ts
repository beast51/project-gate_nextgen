import { NextResponse } from "next/server";
import { getContainer, unauthorized } from "@/appLayer/libs/container";

export async function GET(req: Request) {
  const container = await getContainer()
  if (!container) return unauthorized()

  const { searchParams } = new URL(req.url)
  const from = searchParams.get('from')?.toString() || ''
  const to = searchParams.get('to')?.toString() || ''

  const calls = await container.getCalls(from, to)

  return NextResponse.json(calls);
}
