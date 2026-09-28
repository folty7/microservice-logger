import { logger } from './logger.js'

// Ensures the account from ADMIN_EMAIL / ADMIN_PASSWORD exists and has the admin role.
// Registration always creates regular users, so this is the only way to get the first admin.
// An existing account keeps its password; only its role is promoted.
const ensureAdmin = async app => {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase()
  const password = process.env.ADMIN_PASSWORD

  if (!email || !password) {
    logger.warn('ADMIN_EMAIL / ADMIN_PASSWORD not set; no admin account will be created')
    return
  }

  const users = app.service('users')
  const [existing] = await users.find({ query: { email, $limit: 1 }, paginate: false })
  const admin = existing || (await users.create({ email, password }))

  if (admin.role !== 'admin') {
    // _patch skips hooks: the public patch schema intentionally does not allow changing roles
    await users._patch(admin._id, { role: 'admin' })
  }

  logger.info(`Admin account ready: ${email}`)
}

// Application setup hook. Runs in the background so a slow database does not delay startup.
export const seedAdmin = async (context, next) => {
  await next()

  ensureAdmin(context.app).catch(error => logger.error(`Could not ensure admin account: ${error.message}`))
}
