// utils/response.js

/**
 * Gửi response thành công
 * @param {Object} res - Đối tượng response từ Express
 * @param {String} message - Thông báo thành công
 * @param {Object} data - Dữ liệu trả về (mặc định là object rỗng)
 * @param {Number} statusCode - Mã HTTP (mặc định là 200)
 */
exports.successResponse = (res, statusCode, message, data) => {
  return res.status(statusCode).json({
    success: true,
    statusCode,
    message,
    data,
  });
};

/**
 * Gửi response thất bại
 * @param {Object} res - Đối tượng response từ Express
 * @param {String} message - Thông báo lỗi
 * @param {Number} statusCode - Mã lỗi HTTP (mặc định là 400)
 * @param {Object|null} data - Dữ liệu chi tiết lỗi (nếu có)
 */
exports.errorResponse = (res, statusCode, message, data) => {
  return res.status(statusCode).json({
    success: false,
    statusCode,
    message,
    data,
  });
};
