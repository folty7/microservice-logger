const { proxyTo } = require('../../utils/forward-request.js');

module.exports = function find(req, res) {
  return proxyTo('logs', req, res);
};
