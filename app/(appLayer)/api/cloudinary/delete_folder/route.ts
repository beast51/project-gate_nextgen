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
cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
api_key: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
api_secret: process.env.NEXT_PUBLIC_CLOUDINARY_API_SECRET,
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