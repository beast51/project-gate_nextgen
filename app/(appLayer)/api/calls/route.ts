import  { shotaDatabaseCalls } from '@/entitiesLayer/Calls/model/services/dbCalls';
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const from = searchParams.get('from')?.toString() || ''
  const to = searchParams.get('to')?.toString() || ''

  const {
    isTimeToUpdateCalls,
    updateCallsData,
    getCallsFromDatabaseByTimeRange
  } = shotaDatabaseCalls;

  const isTimeToUpdate = await isTimeToUpdateCalls();

  if (isTimeToUpdate) {
    await updateCallsData(from, to)
  }
  console.log('get calls from mongodb');
  const calls = await getCallsFromDatabaseByTimeRange(from, to);

  const sortCalls = calls && calls.sort((a, b) => {
    return new Date(b.time).getTime() - new Date(a.time).getTime();
  });

  return NextResponse.json(sortCalls);
}

