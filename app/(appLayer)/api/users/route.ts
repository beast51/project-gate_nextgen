import { NextResponse } from "next/server";

import { getGateUserFromDb } from "@/entitiesLayer/GateUser/model/services/getGateUserFromDb";

export async function GET(req: Request) {

  // const isTimeToUpdate = await isTimeToUpdateGateUser()

  // if (isTimeToUpdate) {
  //   const users = await getGateUsersFromApi()
  //   await setGateUsersToBd(users)
  //   await setTimeOfLastUpdateGateUser()
  // }

  const users = await getGateUserFromDb()

  return NextResponse.json(users)
}