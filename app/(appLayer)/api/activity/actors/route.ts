import { NextResponse } from "next/server";
import { ActivityActorsResponse } from "@/contracts";
import { forbidden, getContainer, unauthorized } from "@/appLayer/libs/container";

export async function GET() {
  const container = await getContainer()
  if (!container) return unauthorized()
  if (!container.activity) return forbidden()

  const response: ActivityActorsResponse = await container.activity.listActors()

  return NextResponse.json(response)
}
