// Personal demo databases, one per account
export type SandboxStorage = {
  // removes the whole sandbox database of the account
  drop: (accountId: string) => Promise<void>
}
