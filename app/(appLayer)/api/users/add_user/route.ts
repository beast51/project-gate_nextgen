import { NextResponse } from "next/server";

import {addGateUserToApi} from '@/entitiesLayer/GateUser/model/services/addGateUserToApi'
import {getGateUsersFromApi} from '@/entitiesLayer/GateUser/model/services/getGateUsersFromApi'
import {setGateUsersToBd} from '@/entitiesLayer/GateUser/model/services/setGateUsersToBd'

type BodyType = {
  name: string,
  phoneNumber: string,
  carNumber: string,
  apartmentNumber: string,
}

export async function POST(request: Request) {

  const body: BodyType = await request.json()
  console.log('body', body);
  await addGateUserToApi(body)
  const {idInApi} = (await getGateUsersFromApi(body.phoneNumber))[0]
  await setGateUsersToBd([{...body, carNumber: body.carNumber.toUpperCase().split(','), isBlackListed: false, idInApi}])

  return NextResponse.json('users')
}