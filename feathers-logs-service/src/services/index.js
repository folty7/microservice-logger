import { logs } from './logs/logs.js'

export const services = app => {
  app.configure(logs)
}
