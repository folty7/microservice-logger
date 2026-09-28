// Liveness only: says the gateway process is up, without touching the services behind it.
module.exports = async function health(req, res) {
  return res.json({ status: 'ok' });
};
