import bcrypt from 'bcrypt'
import { AuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { databaseList, getPrismaClient } from '@/appLayer/libs/prismadb'

const prisma = getPrismaClient(databaseList.DATABASE_URL);

// The journal of sign ins. It must never stand in the way of signing in, so every failure stays here.
// The container is imported lazily: it needs the session, and the session needs these options.
const recordSignIn = async (accountId: string, headers: Record<string, unknown> | undefined) => {
  try {
    const [{ getContainerOfAccount }, { clientInfo }] = await Promise.all([
      import('./container'),
      import('../api/_lib/clientInfo'),
    ]);

    const header = (name: string) => {
      const value = headers?.[name];
      return typeof value === 'string' ? value : null;
    };

    const container = await getContainerOfAccount(accountId);
    await container?.recordSignIn(clientInfo({ get: header }));
  } catch (error) {
    console.error('Failed to record a sign in', error);
  }
};

export const authOptions: AuthOptions = {
  // Sign in is possible only with a phone number and a password.
  // Social providers are intentionally absent: anyone with a Google account must not get an account here.
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        phoneNumber: {label: 'phone number', type: 'text'},
        password: {label: 'password', type: "password" },
      },
      async authorize(credentials, request) {
        if (!credentials?.phoneNumber || !credentials.password) {
          throw new Error('Invalid credentials')
        }

        const user = await prisma.user.findUnique({
          where: {
            phoneNumber: credentials.phoneNumber
          }
        })

        if (!user || !user?.hashedPassword) {
          throw new Error('Invalid credentials')
        }

        const isCorrectPassword = await bcrypt.compare(
          credentials.password,
          user.hashedPassword
        )

        if (!isCorrectPassword) {
          throw new Error('Invalid credentials')
        }

        await recordSignIn(user.id, request?.headers)

        return user
      }

    })
  ],
  debug: process.env.NODE_ENV === 'development',
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    // token.sub is the account id; access rights are not stored in the token, see libs/container.ts
    session: ({ session, token }) => ({
      ...session,
      user: { ...session.user, id: token.sub },
    }),
  },
  secret: process.env.NEXTAUTH_SECRET,
}