import { unitalkApiGateUsers } from "@/entitiesLayer/GateUser/model/services/apiGateUsers";
import { mongoDbGateUsers } from "@/entitiesLayer/GateUser/model/services/dbGateUsers";
import { GateUserType } from "@/entitiesLayer/GateUser/model/types/GateUser.type";
import { NextResponse } from "next/server";

const {
  editGateUserOnApi
} = unitalkApiGateUsers;

const {
  editGateUserInDb
} = mongoDbGateUsers;

export async function POST(request: Request) {

  const body: GateUserType = await request.json()

  console.log('+++++++body!!!!!!!!!!!!!', body)


  console.log('try to edit' + body.phoneNumber)
  await editGateUserOnApi({
    name: body.name,
    phoneNumber: body.phoneNumber,
    carNumber: Array.isArray(body.carNumber) ? body.carNumber.join(',') : '',
    apartmentNumber: body.apartmentNumber || '',
    id: body.idInApi,
    isBlackListed: body.isBlackListed, 
  });

  const dbUpdateData: GateUserType = {
    // id: body.id,
    name: body.name,
    phoneNumber: body.phoneNumber,
    carNumber: body.carNumber,
    apartmentNumber: body.apartmentNumber,
    idInApi: body.idInApi,
    isBlackListed: body.isBlackListed,
    blackListedFrom: body.blackListedFrom,
    blackListedTo: body.blackListedTo,
  }

  if (body.image !== undefined && body.image !== null) {
    dbUpdateData.image = body.image
  }
  if (body.additionalImages?.length !== 0) {
    dbUpdateData.additionalImages = body.additionalImages
  }

  console.log('updatedData', dbUpdateData)

  await editGateUserInDb(dbUpdateData)

  // await deleteGateUserFromApi(id)
  // await deleteGateUserFromDb(phoneNumber)

  return NextResponse.json('users')
}