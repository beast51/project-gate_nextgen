import { NextResponse } from "next/server";
import { getContainer, unauthorized } from "@/appLayer/libs/container";
import { toGateUserDto } from "@/entitiesLayer/GateUser/model/lib/gateUserDto";

export async function GET(req: Request) {
  const container = await getContainer()
  if (!container) return unauthorized()

  const users = await container.listGateUsers()

  return NextResponse.json(users.map(toGateUserDto))
}
