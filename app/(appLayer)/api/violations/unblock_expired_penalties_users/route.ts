
import { unblockExpiredPenaltiesUsers } from "@/app/pagesLayer/ViolationsManagementPage/model/violationManagement";

import { NextResponse } from "next/server";



export async function GET(req: Request) {
  const unblocked = await unblockExpiredPenaltiesUsers(); 

  return NextResponse.json({ message: `${unblocked.join(', ')} unblocked` })
}