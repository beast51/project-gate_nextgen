import { NextResponse } from "next/server";
import { GateUserType, addGateUserToApi, getGateUsersFromApi, importUsersFromFileToDb, importUsersFromFileToDbTest, setGateUsersToBd} from "@/services/gateUsers";

type BodyType = {
  name: string,
  phoneNumber: string,
  carNumber: string,
  apartmentNumber: string,
}

export async function POST(request: Request) {

  console.log('startind restore users from bd to api');
  const users = await importUsersFromFileToDbTest();
  let count = 0;
  for (let user of users) {
    await new Promise(resolve => setTimeout(resolve, 600));
    let body: BodyType = {
      name: user.name,
      phoneNumber: user.phoneNumber,
      carNumber: user.carNumber.join(','),
      apartmentNumber: user.apartmentNumber,
    }
    await addGateUserToApi(body);
    console.log('added to api user: ', user);
    const {idInApi} = (await getGateUsersFromApi(body.phoneNumber))[0];
    await setGateUsersToBd([{...user, idInApi}])
    console.log('added to bd user: ', {...user, idInApi});
    count++;
    console.log(`${count} users of out ${users.length} done`)
    
  }

  return NextResponse.json('users')
}