// For more information about this file see https://dove.feathersjs.com/guides/cli/databases.html
import { MongoClient } from 'mongodb'
import { logger } from './logger.js'

const MAX_ATTEMPTS = 10
const RETRY_DELAY_MS = 2000

const wait = ms => new Promise(resolve => setTimeout(resolve, ms))

// The database may not be ready yet when the container starts. Retry instead of
// caching a rejected promise forever (which would leave the service up but broken),
// and exit if it stays unreachable so the container restart policy can take over.
const connectWithRetry = async connection => {
  const database = new URL(connection).pathname.substring(1)

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const client = await MongoClient.connect(connection)
      logger.info('Connected to MongoDB')
      return client.db(database)
    } catch (error) {
      logger.warn(`MongoDB connection attempt ${attempt}/${MAX_ATTEMPTS} failed: ${error.message}`)
      if (attempt === MAX_ATTEMPTS) {
        logger.error('Could not connect to MongoDB, exiting')
        return process.exit(1)
      }
      await wait(RETRY_DELAY_MS)
    }
  }
}

export const mongodb = app => {
  app.set('mongodbClient', connectWithRetry(app.get('mongodb')))
}
