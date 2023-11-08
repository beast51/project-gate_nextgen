import { NextResponse } from "next/server";
import { getGateUserFromDb, getGateUsersFromApi, isTimeToUpdateGateUser, setTimeOfLastUpdateGateUser } from "@/services/gateUsers";
import { setGateUsersToBd } from "@/services/gateUsers";

//download users from api to bd
export async function GET(req: Request) {

  const isTimeToUpdate = await isTimeToUpdateGateUser()

  if (isTimeToUpdate) {
    console.log('download all users from api to bd starting')
    const users = await getGateUsersFromApi()
    await setGateUsersToBd(users)
    await setTimeOfLastUpdateGateUser()
  }

  // const users = await getGateUserFromDb()

  return NextResponse.json('users')
}