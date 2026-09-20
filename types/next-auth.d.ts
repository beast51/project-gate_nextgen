import { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user?: DefaultSession['user'] & {
      // id of the account, the tenant is always resolved from the stored account, never from the token
      id?: string
    }
  }
}
