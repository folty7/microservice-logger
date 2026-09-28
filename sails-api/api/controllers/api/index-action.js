// The gateway is a JSON API, not a website: point callers at the health endpoint.
module.exports = async function indexAction(req, res) {
  return res.json({
    name: 'logging-backend gateway',
    endpoints: ['GET /health', 'GET /ready', 'POST /auth', 'POST /users', 'GET /logs', 'POST /logs'],
  });
};
