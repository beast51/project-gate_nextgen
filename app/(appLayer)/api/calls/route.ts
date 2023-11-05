import { 
  getCallsByTimeRange, 
  getCallsFromApi, 
  isTimeToUpdateCalls, 
  setCalls, 
  setTimeOfLastUpdateCalls 
} from '@/entitiesLayer/Calls/model/calls';

import { NextResponse } from "next/server";



export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)

  const from = searchParams.get('from')?.toString()
  const to = searchParams.get('to')?.toString()
  const phoneNumber = searchParams.get('phoneNumber') || ''


  // const violations = await findViolations(from, to)  

  const isTimeToUpdate = await isTimeToUpdateCalls()

  if (isTimeToUpdate) {
    console.log('calls update started')
    const calls = await getCallsFromApi(from, to, phoneNumber)
    console.log('calls', calls)
    console.log('calls from api received')
    await setCalls(calls)
    console.log('calls setted to bd')
    await setTimeOfLastUpdateCalls()
    console.log('calls update complete')
  }
  console.log('get calls from mongodb')
  const calls = await getCallsByTimeRange(from, to)
  
  const sortCalls = calls && calls.sort((a, b) => {
    return new Date(b.time).getTime() - new Date(a.time).getTime()
  })
  

  return NextResponse.json(sortCalls)
}