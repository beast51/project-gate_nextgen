import { editGateUserOnApi, getGateUsersFromApi } from "@/services/gateUsers";
import { NextResponse } from "next/server";


export async function POST(request: Request) {

  console.log('open gates for all users starts')
  console.log('start downloading list of users from api');
  const data = await getGateUsersFromApi();
  console.log('end downloading list of users from api');
  let index = 0;
  for (const user of data) {
    await new Promise(resolve => setTimeout(resolve, 600)); 
    
    await editGateUserOnApi({
      name: user.name,
      phoneNumber: user.phoneNumber,
      carNumber: user.carNumber,
      apartmentNumber: user.apartmentNumber,
      id: user.idInApi,
      isBlackListed: false, 
    });
    console.log(user.phoneNumber, ' - can open gates\n')
    console.log(index + ' out of ' + data.length + ' completed')
    index++;
  }
  console.log('open gates to all ' + data.length + ' users complete')

  return NextResponse.json('users')
}