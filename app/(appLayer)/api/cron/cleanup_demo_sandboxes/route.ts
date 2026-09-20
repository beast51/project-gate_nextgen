import { NextResponse } from "next/server";
import { getCleanupDemoSandboxes, unauthorized } from "@/appLayer/libs/container";

// Removes personal demo databases that were not used for two weeks
export async function GET(req: Request) {
  const cleanupDemoSandboxes = getCleanupDemoSandboxes(req)
  if (!cleanupDemoSandboxes) return unauthorized()

  const removed = await cleanupDemoSandboxes()

  return NextResponse.json({ removed: removed.length })
}
