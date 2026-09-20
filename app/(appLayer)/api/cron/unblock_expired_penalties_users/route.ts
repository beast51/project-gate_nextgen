import { NextResponse } from "next/server";
import { getContainer, getCronContainer } from "@/appLayer/libs/container";
import getIntl from "@/appLayer/providers/ServerIntlProvider/lib/intl";

export async function GET(req: Request) {
  const { $t } = await getIntl();
  // Vercel cron has no user session: it is recognized by CRON_SECRET, a signed in user may also run the job
  const container = getCronContainer(req) ?? await getContainer()
  const unblocked = container ? await container.unblockExpiredPenalties() : []

  return NextResponse.json({ message: unblocked.length > 0 ? `${unblocked.join(', ')} ${$t({ id: 'unblocked' })}` : $t({ id: 'no users to unblock' }) })
}
