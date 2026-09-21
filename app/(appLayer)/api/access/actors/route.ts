import { NextResponse } from "next/server";
import { AccessActorsResponse } from "@/contracts";
import { forbidden, getContainer, unauthorized } from "@/appLayer/libs/container";

export async function GET() {
  const container = await getContainer()
  if (!container) return unauthorized()
  if (!container.access) return forbidden()

  const response: AccessActorsResponse = await container.access.listActors()

  return NextResponse.json(response)
}
