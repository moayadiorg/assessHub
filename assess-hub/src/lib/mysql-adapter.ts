import { query, queryOne, execute } from './sql-helpers'
import { newId } from './id'
import type { Adapter, AdapterAccount, AdapterUser, AdapterSession, VerificationToken } from 'next-auth/adapters'

export function MysqlAdapter(): Adapter {
  return {
    async createUser(user: Omit<AdapterUser, 'id'>) {
      const id = newId()
      await execute(
        `INSERT INTO User (id, name, email, emailVerified, image, role, isActive, createdAt)
         VALUES (?, ?, ?, ?, ?, 'reader', 1, NOW(3))`,
        [id, user.name ?? null, user.email, user.emailVerified ?? null, user.image ?? null]
      )
      const row = await queryOne<AdapterUser>(
        'SELECT id, name, email, emailVerified, image FROM User WHERE id = ?',
        [id]
      )
      return row!
    },

    async getUser(id: string) {
      return queryOne<AdapterUser>(
        'SELECT id, name, email, emailVerified, image FROM User WHERE id = ?',
        [id]
      )
    },

    async getUserByEmail(email: string) {
      return queryOne<AdapterUser>(
        'SELECT id, name, email, emailVerified, image FROM User WHERE email = ?',
        [email]
      )
    },

    async getUserByAccount({ providerAccountId, provider }: Pick<AdapterAccount, 'provider' | 'providerAccountId'>) {
      const row = await queryOne<AdapterUser>(
        `SELECT u.id, u.name, u.email, u.emailVerified, u.image
         FROM User u
         JOIN Account a ON a.userId = u.id
         WHERE a.provider = ? AND a.providerAccountId = ?`,
        [provider, providerAccountId]
      )
      return row
    },

    async updateUser(user: Partial<AdapterUser> & Pick<AdapterUser, 'id'>) {
      const fields: string[] = []
      const params: unknown[] = []

      if (user.name !== undefined) { fields.push('name = ?'); params.push(user.name) }
      if (user.email !== undefined) { fields.push('email = ?'); params.push(user.email) }
      if (user.emailVerified !== undefined) { fields.push('emailVerified = ?'); params.push(user.emailVerified) }
      if (user.image !== undefined) { fields.push('image = ?'); params.push(user.image) }

      if (fields.length > 0) {
        params.push(user.id)
        await execute(`UPDATE User SET ${fields.join(', ')} WHERE id = ?`, params)
      }

      const row = await queryOne<AdapterUser>(
        'SELECT id, name, email, emailVerified, image FROM User WHERE id = ?',
        [user.id]
      )
      return row!
    },

    async deleteUser(userId: string) {
      await execute('DELETE FROM Account WHERE userId = ?', [userId])
      await execute('DELETE FROM Session WHERE userId = ?', [userId])
      await execute('DELETE FROM User WHERE id = ?', [userId])
    },

    async linkAccount(account: AdapterAccount) {
      const id = newId()
      await execute(
        `INSERT INTO Account (id, userId, type, provider, providerAccountId,
         refresh_token, access_token, expires_at, token_type, scope, id_token, session_state)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          account.userId,
          account.type,
          account.provider,
          account.providerAccountId,
          account.refresh_token ?? null,
          account.access_token ?? null,
          account.expires_at ?? null,
          account.token_type ?? null,
          account.scope ?? null,
          account.id_token ?? null,
          account.session_state ?? null,
        ]
      )
      return account as AdapterAccount
    },

    async unlinkAccount({ providerAccountId, provider }: Pick<AdapterAccount, 'provider' | 'providerAccountId'>) {
      await execute(
        'DELETE FROM Account WHERE provider = ? AND providerAccountId = ?',
        [provider, providerAccountId]
      )
    },

    async createSession(session: { sessionToken: string; userId: string; expires: Date }) {
      const id = newId()
      await execute(
        'INSERT INTO Session (id, sessionToken, userId, expires) VALUES (?, ?, ?, ?)',
        [id, session.sessionToken, session.userId, session.expires]
      )
      return { ...session, id } as AdapterSession
    },

    async getSessionAndUser(sessionToken: string) {
      const row = await queryOne<{
        sId: string; sessionToken: string; sUserId: string; expires: Date
        uId: string; name: string | null; email: string; emailVerified: Date | null; image: string | null
      }>(
        `SELECT s.id as sId, s.sessionToken, s.userId as sUserId, s.expires,
                u.id as uId, u.name, u.email, u.emailVerified, u.image
         FROM Session s
         JOIN User u ON u.id = s.userId
         WHERE s.sessionToken = ?`,
        [sessionToken]
      )
      if (!row) return null

      return {
        session: {
          id: row.sId,
          sessionToken: row.sessionToken,
          userId: row.sUserId,
          expires: row.expires,
        } as AdapterSession,
        user: {
          id: row.uId,
          name: row.name,
          email: row.email,
          emailVerified: row.emailVerified,
          image: row.image,
        } as AdapterUser,
      }
    },

    async updateSession(session: Partial<AdapterSession> & Pick<AdapterSession, 'sessionToken'>) {
      const fields: string[] = []
      const params: unknown[] = []

      if (session.expires !== undefined) { fields.push('expires = ?'); params.push(session.expires) }
      if (session.userId !== undefined) { fields.push('userId = ?'); params.push(session.userId) }

      if (fields.length > 0) {
        params.push(session.sessionToken)
        await execute(`UPDATE Session SET ${fields.join(', ')} WHERE sessionToken = ?`, params)
      }

      const row = await queryOne<AdapterSession>(
        'SELECT id, sessionToken, userId, expires FROM Session WHERE sessionToken = ?',
        [session.sessionToken]
      )
      return row
    },

    async deleteSession(sessionToken: string) {
      await execute('DELETE FROM Session WHERE sessionToken = ?', [sessionToken])
    },

    async createVerificationToken(token: VerificationToken) {
      await execute(
        'INSERT INTO VerificationToken (identifier, token, expires) VALUES (?, ?, ?)',
        [token.identifier, token.token, token.expires]
      )
      return token
    },

    async useVerificationToken({ identifier, token }: { identifier: string; token: string }) {
      const row = await queryOne<VerificationToken>(
        'SELECT identifier, token, expires FROM VerificationToken WHERE identifier = ? AND token = ?',
        [identifier, token]
      )
      if (!row) return null

      await execute(
        'DELETE FROM VerificationToken WHERE identifier = ? AND token = ?',
        [identifier, token]
      )
      return row
    },
  }
}
