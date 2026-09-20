import { NextResponse } from "next/server";
import { getContainer, unauthorized } from "@/appLayer/libs/container";
import { NewGateUser } from "@/core/entities/gateUser";

export async function POST(request: Request) {
  const container = await getContainer()
  if (!container) return unauthorized()

  const body: NewGateUser = await request.json()

  await container.addGateUser(body)

  return NextResponse.json('users')
}
