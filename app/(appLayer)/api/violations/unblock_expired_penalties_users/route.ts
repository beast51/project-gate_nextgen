import { unblockExpiredPenaltiesUsers } from "@/app/pagesLayer/ViolationsManagementPage/model/violationManagement";

import { NextResponse } from "next/server";
export const runtime = 'edge';


export async function GET(req: Request) {
  await unblockExpiredPenaltiesUsers(); 

  return NextResponse.json({ message: 'Users have been unlocked successfully' })
}