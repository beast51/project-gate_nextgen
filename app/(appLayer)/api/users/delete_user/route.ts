import { NextResponse } from "next/server";
import { getContainer, unauthorized } from "@/appLayer/libs/container";

export async function POST(request: Request) {
  const container = await getContainer()
  if (!container) return unauthorized()

  // `id` is the id of the user in the telephony directory
  const { phoneNumber, id } = await request.json()

  await container.deleteGateUser({ phoneNumber, externalId: id })

  return NextResponse.json('users')
}
