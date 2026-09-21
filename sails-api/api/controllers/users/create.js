const { proxyTo } = require('../../utils/forward-request.js');

module.exports = function create(req, res) {
  return proxyTo('users', req, res);
};
