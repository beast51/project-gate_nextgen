import { NextResponse } from "next/server";
import { getContainer, unauthorized } from "@/appLayer/libs/container";
import { fromGateUserDto } from "@/entitiesLayer/GateUser/model/lib/gateUserDto";
import { GateUserType } from "@/entitiesLayer/GateUser/model/types/GateUser.type";

export async function POST(request: Request) {
  const container = await getContainer()
  if (!container) return unauthorized()

  const body: GateUserType = await request.json()

  await container.editGateUser(fromGateUserDto(body))

  return NextResponse.json('users')
}
