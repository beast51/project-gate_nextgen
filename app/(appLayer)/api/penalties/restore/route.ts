import { NextResponse } from "next/server";
import { ApiErrorResponse, RestorePenaltiesRequest, RestorePenaltiesResponse } from "@/contracts";
import { forbidden, getContainer, unauthorized } from "@/appLayer/libs/container";

// Used by scripts/restore-penalties.mjs. Without `apply` nothing is written.
export async function POST(req: Request) {
  const container = await getContainer()
  if (!container) return unauthorized()
  if (!container.restorePenalties) return forbidden()

  const { since, apply }: Partial<RestorePenaltiesRequest> = await req.json().catch(() => ({}))

  if (typeof since !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(since)) {
    return NextResponse.json<ApiErrorResponse>({ error: 'since is expected as YYYY-MM-DD' }, { status: 400 })
  }

  const result = await container.restorePenalties(`${since} 00:00:00`, { apply: apply === true })

  const response: RestorePenaltiesResponse = {
    blocks: result.blocks,
    found: result.found,
    written: result.written,
    // no phone numbers: the answer is printed to a terminal
    missing: result.missing.map(penalty => ({
      apartmentNumber: penalty.apartmentNumber,
      phones: penalty.phoneNumbers.length,
      from: penalty.from,
      until: penalty.until,
      inForce: penalty.lifted === null,
      overstays: penalty.reason?.overstays ?? 0,
      openVisits: penalty.reason?.openVisits ?? 0,
      overstayMinutes: penalty.reason?.overstayMinutes ?? 0,
      minutesOverLimit: penalty.reason?.minutesOverLimit ?? 0,
    })),
  }

  return NextResponse.json(response)
}
