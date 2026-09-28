const axios = require('axios');

const CHECK_TIMEOUT_MS = 3000;

const checkService = async (name) => {
  const url = sails.config.services[name].url;

  try {
    await axios.get(`${url}/ready`, { timeout: CHECK_TIMEOUT_MS });
    return { name, status: 'ready' };
  } catch (error) {
    return { name, status: 'unavailable', reason: error.message };
  }
};

// Readiness: the gateway can only serve traffic if the services behind it can.
module.exports = async function ready(req, res) {
  const services = await Promise.all([checkService('users'), checkService('logs')]);
  const ready = services.every((service) => service.status === 'ready');

  return res.status(ready ? 200 : 503).json({
    status: ready ? 'ready' : 'unavailable',
    services,
  });
};
