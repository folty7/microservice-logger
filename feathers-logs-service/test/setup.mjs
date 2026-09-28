// Starts a real in-memory MongoDB before the test files (and therefore the app) are imported.
import { MongoMemoryServer } from 'mongodb-memory-server'

const mongo = await MongoMemoryServer.create()

process.env.MONGODB = mongo.getUri('logging-backend-test')

export const mochaGlobalTeardown = async () => {
  await mongo.stop()
}
