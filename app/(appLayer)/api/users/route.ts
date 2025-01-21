import { NextResponse } from "next/server";
import { mongoDbGateUsers } from "@/entitiesLayer/GateUser/model/services/dbGateUsers";

const {
  getGateUserFromDb
} = mongoDbGateUsers;

export async function GET(req: Request) {
  const users = await getGateUserFromDb()
  
  return NextResponse.json(users)
}