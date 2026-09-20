import bcrypt from 'bcrypt'
import { AuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { databaseList, getPrismaClient } from '@/appLayer/libs/prismadb'

const prisma = getPrismaClient(databaseList.DATABASE_URL);

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
      async authorize(credentials) {
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