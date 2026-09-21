// Executed by the mongo image only on first start, when the data volume is empty.
// Creates the account the Feathers services use: readWrite on the app database only,
// so the services never hold root credentials.
const dbName = process.env.MONGO_APP_DATABASE

db.getSiblingDB(dbName).createUser({
  user: process.env.MONGO_APP_USERNAME,
  pwd: process.env.MONGO_APP_PASSWORD,
  roles: [{ role: 'readWrite', db: dbName }]
})
