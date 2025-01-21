import { NextResponse } from "next/server";
import getSession from "@/widgetsLayer/Sidebar/actions/getSession";
import { unitalkApiGateUsers } from "@/entitiesLayer/GateUser/model/services/apiGateUsers";
import { formatCarNumber } from "@/entitiesLayer/GateUser/model/providers/unitalkGateUsersProvider";
import { mongoDbGateUsers } from "@/entitiesLayer/GateUser/model/services/dbGateUsers";

export type BodyType = {
  name: string,
  phoneNumber: string,
  carNumber: string,
  apartmentNumber: string,
}

const {
  getGateUsersFromApi,
  addGateUserToApi,
} = unitalkApiGateUsers;

const {
  addGateUsersToDatabase
  
} = mongoDbGateUsers

export async function POST(request: Request) {
  const session = await getSession();
  const isDemo = session?.user?.name === 'spectator'
  const body: BodyType = await request.json()
  await addGateUserToApi(body)
  const {idInApi} = (await getGateUsersFromApi(body.phoneNumber, "", isDemo))[0]
  console.log('idInApi', idInApi)
  await addGateUsersToDatabase([{
    ...body,
    name: body.name, 
    carNumber: formatCarNumber(body.carNumber).split(','),
    isBlackListed: false,
    idInApi,
    image: null,
    additionalImages: [],
    blackListedFrom: "",
    blackListedTo: ""
  }])

  return NextResponse.json('users')
}