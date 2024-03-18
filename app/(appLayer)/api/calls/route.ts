import { 
  getCallsByTimeRange, 
  getCallsFromApi, 
  getExtendedCallsByTimeRange, 
  getExtendedCallsFromApi, 
  isTimeToUpdateCalls, 
  setCalls, 
  setExtendedCalls, 
  setTimeOfLastUpdateCalls 
} from '@/entitiesLayer/Calls/model/services/calls';
import getSession from '@/widgetsLayer/Sidebar/actions/getSession';

import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const session = await getSession();
  const isDemo = session?.user?.name === 'spectator'
  const { searchParams } = new URL(req.url)

  const from = searchParams.get('from')?.toString()
  const to = searchParams.get('to')?.toString()
  const phoneNumber = searchParams.get('phoneNumber') || ''

  const isTimeToUpdate = isDemo ? false :  await isTimeToUpdateCalls()

  if (isTimeToUpdate) {
    console.log('calls update started')
    // const calls = await getCallsFromApi(from, to, phoneNumber)
    const calls = await getExtendedCallsFromApi(from, to, phoneNumber)
    console.log('calls', calls)
    console.log('calls from api received')
    // !isDemo && await setCalls(calls)
    !isDemo && await setExtendedCalls(calls)
    console.log('calls setted to bd')
    await setTimeOfLastUpdateCalls()
    console.log('calls update complete')
  }
  console.log('get calls from mongodb')
  // const calls = await getCallsByTimeRange(from, to)
  const calls = await getExtendedCallsByTimeRange(from, to)
  
  const sortCalls = calls && calls.sort((a, b) => {
    return new Date(b.time).getTime() - new Date(a.time).getTime()
  })
  

  return NextResponse.json(sortCalls)
}

