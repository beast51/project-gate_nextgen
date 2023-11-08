import { deleteGateUserFromApi, deleteGateUserFromDb, getAllInfoForDeleteAllUsers } from "@/services/gateUsers";
import { NextResponse } from "next/server";


export async function POST(request: Request) {

  console.log('starting delete all users')
  const data = await getAllInfoForDeleteAllUsers();
  for (const user of data) {
    await new Promise(resolve => setTimeout(resolve, 600)); 
    await deleteGateUserFromApi(user.idInApi);
    console.log(user.phoneNumber, '- deleted from api')
    await deleteGateUserFromDb(user.phoneNumber);
    console.log(user.phoneNumber, '- deleted from db')
  }
  console.log('delete all users complete')

  return NextResponse.json('users')
}