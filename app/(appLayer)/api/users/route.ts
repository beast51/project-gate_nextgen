import { NextResponse } from "next/server";
import { BlackListedGateUsersResponse, GateUsersResponse } from "@/contracts";
import { getContainer, unauthorized } from "@/appLayer/libs/container";
import { toBlackListedGateUserDto, toGateUserDto } from "../_lib/mappers";

// GET /api/users?phoneNumber=380...&apartmentNumber=174&blackListed=true, see contracts/gateUsers.ts
export async function GET(req: Request) {
  const container = await getContainer()
  if (!container) return unauthorized()

  const { searchParams } = new URL(req.url)
  const phoneNumber = searchParams.get('phoneNumber') || undefined
  const apartmentNumber = searchParams.get('apartmentNumber') || undefined

  if (searchParams.get('blackListed') === 'true') {
    const response: BlackListedGateUsersResponse =
      (await container.listBlackListedGateUsers()).map(toBlackListedGateUserDto(container.displayNameOf))
    return NextResponse.json(response)
  }

  const users = await container.listGateUsers({ phoneNumber, apartmentNumber })
  const response: GateUsersResponse = users.map(toGateUserDto)

  return NextResponse.json(response)
}
