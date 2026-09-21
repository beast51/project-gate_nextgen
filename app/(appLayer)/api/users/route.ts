import { NextResponse } from "next/server";
import { GateUsersResponse } from "@/contracts";
import { getContainer, unauthorized } from "@/appLayer/libs/container";
import { toGateUserDto } from "../_lib/mappers";

// GET /api/users?phoneNumber=380...&blackListed=true, see contracts/gateUsers.ts
export async function GET(req: Request) {
  const container = await getContainer()
  if (!container) return unauthorized()

  const { searchParams } = new URL(req.url)
  const phoneNumber = searchParams.get('phoneNumber') || undefined

  const users = searchParams.get('blackListed') === 'true'
    ? await container.listBlackListedGateUsers()
    : await container.listGateUsers(phoneNumber ? { phoneNumber } : {})

  const response: GateUsersResponse = users.map(toGateUserDto)

  return NextResponse.json(response)
}
