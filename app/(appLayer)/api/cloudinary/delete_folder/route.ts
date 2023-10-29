import { NextResponse } from "next/server";
// import { addGateUserToApi, getGateUsersFromApi, setGateUsersToBd} from "@/services/gateUsers";

type BodyType = {
  name: string,
  phoneNumber: string,
  carNumber: string,
  apartmentNumber: string,
}

const cloudinary = require('cloudinary');
cloudinary.v2.config({
cloud_name: 'dcjd6ogdr',
api_key: '744144639353525',
api_secret: 'Iscusmz3f18YTmiQsBBd8Eu9QSk',
secure: true
});

export async function POST(request: Request) {

  const body: BodyType = await request.json()
  console.log('body', body);

  // cloudinary.v2.api.delete_folder('cars/248').then(console.log);

  cloudinary.v2.api
  .delete_resources(['cars/248/ВН4780ВК'], 
    { type: 'upload', resource_type: 'image' })
  .then(console.log);

  // await addGateUserToApi(body)
  // const {idInApi} = (await getGateUsersFromApi(body.phoneNumber))[0]
  // await setGateUsersToBd([{...body, carNumber: body.carNumber.toUpperCase().split(','), isBlackListed: false, idInApi}])

  return NextResponse.json('answer')
}