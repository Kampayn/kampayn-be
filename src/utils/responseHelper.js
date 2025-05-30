'use strict';

const successResponse = (
  h,
  data = null,
  message = 'Operation successful',
  statusCode = 200
) => {
  const responseBody = {
    status: 'success',
    message,
  };
  if (data !== null) {
    responseBody.data = data;
  }
  return h.response(responseBody).code(statusCode);
};

// Untuk error, kita akan menggunakan Boom langsung di controller
// Contoh: return Boom.badRequest('Invalid input');
// Hapi akan otomatis memformatnya dengan benar.

module.exports = {
  successResponse,
};
