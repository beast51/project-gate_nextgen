// A person who signs in to the application (an operator of a gate or a visitor of the demo)
export type Account = {
  id: string
  name: string
  // key of the gate (customer) the account works with; an account without a tenant
  // never sees customer data, it works in a personal demo sandbox
  tenant: string | null
  sandboxLastUsedAt: Date | null
}
