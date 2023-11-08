import { NextResponse } from "next/server";
import { importUsersFromFileToDb } from "@/services/gateUsers";
import { setGateUsersToBd } from "@/services/gateUsers";

//download users from api to bd
export async function GET(req: Request) {

  console.log('export from db to file starting')
  const users = await importUsersFromFileToDb();
  console.log('!!!!!!!!', users)
  // const isTimeToUpdate = await isTimeToUpdateGateUser()

  // if (isTimeToUpdate) {
    
  //   const users = await getGateUsersFromApi()
  //   await setGateUsersToBd(users)
  //   await setTimeOfLastUpdateGateUser()
  // }

  // const users = await getGateUserFromDb()

  return NextResponse.json('users')
}