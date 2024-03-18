import { findViolations } from "@/entitiesLayer/Violation/model/services/violations";

import { NextResponse } from "next/server";



export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)

  const from = searchParams.get('from')?.toString()
  const to = searchParams.get('to')?.toString()
  const phoneNumber = searchParams.get('phoneNumber') || ''

  const violations = await findViolations(from, to)  
  // const violations = await findExtendedViolations(from, to)  

  return NextResponse.json(violations)
}