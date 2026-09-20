import { NextResponse } from "next/server";
import { getContainer } from "@/appLayer/libs/container";
import getIntl from "@/appLayer/providers/ServerIntlProvider/lib/intl";

export async function POST(req: Request) {
  const { $t } = await getIntl();
  const container = await getContainer()
  const unblocked = container ? await container.unblockExpiredPenalties() : []

  return NextResponse.json({ message: unblocked.length > 0 ? `${unblocked.join(', ')} ${$t({ id: 'unblocked' })}` : $t({ id: 'no users to unblock' }) })
}
