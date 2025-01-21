
import { unitalkApiGateUsers } from "@/entitiesLayer/GateUser/model/services/apiGateUsers";
import { mongoDbGateUsers } from "@/entitiesLayer/GateUser/model/services/dbGateUsers";
import { NextResponse } from "next/server";


const {
  deleteGateUserFromApi
} = unitalkApiGateUsers;

const {
  deleteGateUserFromDb
} = mongoDbGateUsers;

export async function POST(request: Request) {
  const body = await request.json()
  const {phoneNumber, id} = body
  
  await deleteGateUserFromDb(phoneNumber)
  await deleteGateUserFromApi(id)
  

  return NextResponse.json('users')
}