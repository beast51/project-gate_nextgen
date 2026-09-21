import { NextResponse } from "next/server";
import { getContainer, unauthorized } from "@/appLayer/libs/container";
import { clientInfo } from "../../_lib/clientInfo";

// The browser reports only the page. Who, when, from which address and device is what the server knows itself.
export async function POST(request: Request) {
  const container = await getContainer()
  if (!container) return unauthorized()

  const body = await request.json().catch(() => null)

  await container.recordPageView(body?.path, clientInfo(request.headers))

  return NextResponse.json({ ok: true })
}
