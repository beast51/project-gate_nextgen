import { NextResponse } from "next/server";
import { UnblockExpiredPenaltiesResponse } from "@/contracts";
import { getContainer, getCronContainers } from "@/appLayer/libs/container";
import getIntl from "@/appLayer/providers/ServerIntlProvider/lib/intl";

export async function GET(req: Request) {
  const { $t } = await getIntl();
  // Vercel cron has no user session: it is recognized by CRON_SECRET, a signed in user may also run the job
  const userContainer = await getContainer()
  const containers = (await getCronContainers(req)) ?? (userContainer ? [userContainer] : [])

  const unblocked: string[] = []
  for (const container of containers) {
    unblocked.push(...await container.unblockExpiredPenalties())
  }

  const response: UnblockExpiredPenaltiesResponse = { message: unblocked.length > 0 ? `${unblocked.join(', ')} ${$t({ id: 'unblocked' })}` : $t({ id: 'no users to unblock' }) }

  return NextResponse.json(response)
}
