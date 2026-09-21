import { NextResponse } from "next/server";
import { UnblockExpiredPenaltiesResponse } from "@/contracts";
import { getContainer } from "@/appLayer/libs/container";
import getIntl from "@/appLayer/providers/ServerIntlProvider/lib/intl";

export async function POST(req: Request) {
  const { $t } = await getIntl();
  const container = await getContainer()
  const unblocked = container ? await container.unblockExpiredPenalties() : []

  const response: UnblockExpiredPenaltiesResponse = { message: unblocked.length > 0 ? `${unblocked.join(', ')} ${$t({ id: 'unblocked' })}` : $t({ id: 'no users to unblock' }) }

  return NextResponse.json(response)
}
