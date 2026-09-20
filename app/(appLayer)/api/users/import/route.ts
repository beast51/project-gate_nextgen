import { NextResponse } from "next/server";
import { getContainer, unauthorized } from "@/appLayer/libs/container";
import { fromGateUserDto } from "@/entitiesLayer/GateUser/model/lib/gateUserDto";

// Restores gate users from a backup made by /api/users/export, stored users are not overwritten
export async function POST(request: Request) {
  const container = await getContainer()
  if (!container) return unauthorized()

  const backup = await request.json().catch(() => null)

  if (!Array.isArray(backup)) {
    return NextResponse.json({ error: 'A backup must be a list of gate users' }, { status: 400 })
  }

  try {
    return NextResponse.json(await container.importGateUsers(backup.map(fromGateUserDto)))
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Invalid backup' }, { status: 400 })
  }
}
