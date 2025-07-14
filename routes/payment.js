var express = require('express');
const {
  createPayment,
  getPaymentById,
  getPaymentByOrderId,
  updatePaymentStatus,
  processPayment,
  refundPayment,
} = require('../controllers/payment.controller');
var router = express.Router();

// POST /api/payments - Tạo payment cho order
router.post('/', createPayment);

// GET /api/payments/:id - Lấy payment theo ID
router.get('/:id', getPaymentById);

// GET /api/payments/order/:orderId - Lấy payment theo order ID
router.get('/order/:orderId', getPaymentByOrderId);

// PUT /api/payments/:id/status - Cập nhật payment status
router.put('/:id/status', updatePaymentStatus);

// POST /api/payments/:id/process - Xử lý thanh toán
router.post('/:id/process', processPayment);

// POST /api/payments/:id/refund - Hoàn tiền
router.post('/:id/refund', refundPayment);

module.exports = router;
