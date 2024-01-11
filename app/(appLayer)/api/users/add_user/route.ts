import { NextResponse } from "next/server";

import {addGateUserToApi} from '@/entitiesLayer/GateUser/model/services/addGateUserToApi'
import {getGateUsersFromApi} from '@/entitiesLayer/GateUser/model/services/getGateUsersFromApi'
import {setGateUsersToBd} from '@/entitiesLayer/GateUser/model/services/setGateUsersToBd'
import getSession from "@/widgetsLayer/Sidebar/actions/getSession";

type BodyType = {
  name: string,
  phoneNumber: string,
  carNumber: string,
  apartmentNumber: string,
}

export async function POST(request: Request) {
  const session = await getSession();
  const isDemo = session?.user?.name === 'spectator'
  const body: BodyType = await request.json()
  await addGateUserToApi(body)
  const {idInApi} = (await getGateUsersFromApi(body.phoneNumber, "", isDemo))[0]
  console.log('idInApi', idInApi)
  await setGateUsersToBd([{...body, carNumber: body.carNumber.toUpperCase().split(','), isBlackListed: false, idInApi}])

  return NextResponse.json('users')
}