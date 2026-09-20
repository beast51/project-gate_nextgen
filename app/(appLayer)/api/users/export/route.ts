import moment from "moment";
import { NextResponse } from "next/server";
import { getContainer, unauthorized } from "@/appLayer/libs/container";
import { toGateUserDto } from "@/entitiesLayer/GateUser/model/lib/gateUserDto";

// Backup of all gate users as a JSON file, the same format that /api/users/import accepts
export async function GET() {
  const container = await getContainer()
  if (!container) return unauthorized()

  const users = await container.listGateUsers()
  const fileName = `users-${moment().format('YYYY-MM-DD_HH-mm-ss')}.json`

  return new NextResponse(JSON.stringify(users.map(toGateUserDto), null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="${fileName}"`,
    },
  })
}
