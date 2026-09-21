import { NextResponse } from "next/server";
import { SyncGateUsersResponse } from "@/contracts";
import { getContainer, unauthorized } from "@/appLayer/libs/container";

// Downloads people that exist only in the telephony directory into the database (rate limited)
export async function POST() {
  const container = await getContainer()
  if (!container) return unauthorized()

  const result: SyncGateUsersResponse = await container.syncGateUsers()

  return NextResponse.json(result)
}
