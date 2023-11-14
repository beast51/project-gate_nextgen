
import { editGateUserInDb, editGateUserOnApi } from "@/app/pagesLayer/GateUserPage/model/gateUsers";
import { GateUserType } from "@/entitiesLayer/GateUser/model/types/GateUser.type";
import { NextResponse } from "next/server";


export async function POST(request: Request) {

  const body: GateUserType = await request.json()

  console.log('+++++++body!!!!!!!!!!!!!', body)


  console.log('try to edit' + body.phoneNumber)
  await editGateUserOnApi({
    name: body.name,
    phoneNumber: body.phoneNumber,
    carNumber: body.carNumber,
    apartmentNumber: body.apartmentNumber,
    id: body.idInApi,
    isBlackListed: body.isBlackListed, 
  });

  await editGateUserInDb({
    name: body.name,
    phoneNumber: body.phoneNumber,
    carNumber: body.carNumber,
    apartmentNumber: body.apartmentNumber,
    idInApi: body.idInApi,
    isBlackListed: body.isBlackListed, 
    blackListedFrom: body.blackListedFrom,
    blackListedTo: body.blackListedTo,
    image: body.image,
  })

  // await deleteGateUserFromApi(id)
  // await deleteGateUserFromDb(phoneNumber)

  return NextResponse.json('users')
}