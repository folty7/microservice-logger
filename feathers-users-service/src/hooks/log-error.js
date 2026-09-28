import { logger } from '../logger.js'

export const logError = async (context, next) => {
  try {
    await next()
  } catch (error) {
    // Correlates this error with the gateway log line for the same request
    const requestId = context.params.headers?.['x-request-id']
    logger.error(`${requestId ? `[${requestId}] ` : ''}${error.stack}`)
    // Log validation errors
    if (error.data) {
      logger.error('Data: %O', error.data)
    }

    throw error
  }
}
