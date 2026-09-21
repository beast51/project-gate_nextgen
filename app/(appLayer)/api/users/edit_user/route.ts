import { NextResponse } from "next/server";
import { getContainer, unauthorized } from "@/appLayer/libs/container";
import { EditGateUserRequest } from "@/contracts";
import { fromGateUserDto } from "../../_lib/mappers";

const textOrNull = (value: unknown) => (typeof value === 'string' ? value : null)

export async function POST(request: Request) {
  const container = await getContainer()
  if (!container) return unauthorized()

  const { penaltyNote, ...user }: EditGateUserRequest = await request.json()

  // the ground and the length of the comment are checked by the core
  await container.editGateUser(fromGateUserDto(user), {
    ground: textOrNull(penaltyNote?.ground),
    comment: textOrNull(penaltyNote?.comment),
  })

  return NextResponse.json('users')
}
