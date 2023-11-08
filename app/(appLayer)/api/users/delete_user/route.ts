import { deleteGateUserFromApi, deleteGateUserFromDb } from "@/services/gateUsers";
import { NextResponse } from "next/server";


export async function POST(request: Request) {

  const body = await request.json()
  const {phoneNumber, id} = body
  console.log('++++++id!!!!!!!!!!!!!', id)
  console.log('+++++++body!!!!!!!!!!!!!', body)

  await deleteGateUserFromApi(id)
  await deleteGateUserFromDb(phoneNumber)

  return NextResponse.json('users')
}