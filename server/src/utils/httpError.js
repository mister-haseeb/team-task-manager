// Creates an Error carrying an HTTP status, picked up by the central error handler.
module.exports = function httpError(status, message) {
  return Object.assign(new Error(message), { status });
};
