import { NextResponse } from "next/server";
import { getContainer, unauthorized } from "@/appLayer/libs/container";
import { EditGateUserRequest } from "@/contracts";
import { fromGateUserDto } from "../../_lib/mappers";

export async function POST(request: Request) {
  const container = await getContainer()
  if (!container) return unauthorized()

  const body: EditGateUserRequest = await request.json()

  await container.editGateUser(fromGateUserDto(body))

  return NextResponse.json('users')
}
