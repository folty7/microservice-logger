module.exports = function errorHandler(err, req, res, next) {
  // Ak na vstupe nie je objekt s chybou, posunieme sa ďalej
  if (!err) {
    return next();
  }

  // Zalogujeme si chybu do konzoly
  sails.log.error('Vygenerovaný Error zo systému:', err);

  // Zjednotená odpoveď pre klienta
  const status = err.status || 500;
  const message = err.message || 'Internal server error';

  return res.status(status).json({
    error: true,
    message: message,
    details: err.data || null
  });
};
