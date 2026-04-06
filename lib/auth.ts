import { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db'

export const authOptions: NextAuthOptions = {
  // No adapter — JWT sessions don't need one.
  // User creation/lookup is handled in the signIn + jwt callbacks below.

  providers: [
    // ── Primary: Google SSO ──────────────────────────────────────────
    GoogleProvider({
      clientId:     process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),

    // ── Fallback: Email + Password ───────────────────────────────────
    CredentialsProvider({
      name: 'Email & Password',
      credentials: {
        email:    { label: 'Email',    type: 'email'    },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        })

        if (!user || !user.password || !user.active) return null

        const valid = await bcrypt.compare(credentials.password, user.password)
        if (!valid) return null

        return { id: user.id, email: user.email, name: user.name, role: user.role }
      },
    }),
  ],

  session: { strategy: 'jwt' },

  callbacks: {
    // Create or update the user record on first Google sign-in
    async signIn({ user, account }) {
      if (account?.provider === 'google' && user.email) {
        try {
          await prisma.user.upsert({
            where:  { email: user.email },
            create: { email: user.email, name: user.name ?? user.email, role: 'member', active: true },
            update: { name: user.name ?? undefined },
          })
        } catch (e) {
          // Log but never block sign-in — jwt callback handles role lookup
          console.error('[NextAuth] signIn DB upsert error:', e)
        }
      }
      return true
    },

    async jwt({ token, user }) {
      if (user) {
        const dbUser = await prisma.user.findUnique({
          where:  { email: token.email! },
          select: { id: true, role: true, department: true, active: true },
        })
        token.userId     = dbUser?.id           ?? user.id
        token.role       = dbUser?.role         ?? 'member'
        token.department = dbUser?.department   ?? null
      }
      return token
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id         = token.userId     as string
        session.user.role       = token.role       as string
        session.user.department = token.department as string | null
      }
      return session
    },
  },

  pages: {
    signIn: '/login',
    error:  '/login',
  },

  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
}
