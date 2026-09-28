// This service has no users entity (`authentication.entity: null`), so authorization relies
// on the verified JWT payload issued by the users service: `sub` (user id) and `role`.
export const getAuthPayload = context => context.params.authentication?.payload

export const isAdmin = payload => payload?.role === 'admin'
