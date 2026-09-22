import { NextResponse } from "next/server";
import { ApiErrorResponse, ViolationHistoryResponse } from "@/contracts";
import { getContainer, unauthorized } from "@/appLayer/libs/container";
import { toPenaltyDto } from "../../_lib/mappers";

export async function GET(req: Request) {
  const container = await getContainer()
  if (!container) return unauthorized()

  const subject = new URL(req.url).searchParams.get('subject')?.trim()
  if (!subject) {
    return NextResponse.json<ApiErrorResponse>({ error: 'subject is expected: an apartment or a phone number' }, { status: 400 })
  }

  const history = await container.getSubjectHistory(subject)

  const response: ViolationHistoryResponse = {
    subject: history.subjectKey,
    period: history.period,
    violations: history.violations,
    penalties: history.penalties.map(toPenaltyDto(container.displayNameOf)),
  }

  return NextResponse.json(response)
}
