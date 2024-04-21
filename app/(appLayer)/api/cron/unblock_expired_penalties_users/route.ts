
import { unblockExpiredPenaltiesUsers } from "@/app/pagesLayer/ViolationsManagementPage/model/violationManagement";
import getIntl from "@/appLayer/providers/ServerIntlProvider/lib/intl";

import { NextResponse } from "next/server";



export async function GET(req: Request) {
const { $t } = await getIntl();
  console.log('request: !!!', req)
  const unblocked = await unblockExpiredPenaltiesUsers(); 

  return NextResponse.json({ message: unblocked.length > 0 ? `${unblocked.join(', ')} ${$t({ id: 'unblocked' })}` : $t({ id: 'no users to unblock' }) })
}