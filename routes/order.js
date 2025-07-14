var express = require('express');
const {
  createOrder,
  getOrderById,
  getOrdersByUserId,
  getAllOrders,
  updateOrderStatus,
  cancelOrder,
  getOrderItems,
} = require('../controllers/order.controller');
var router = express.Router();

// GET /api/orders - Lấy tất cả orders (cho admin/manager)
router.get('/', getAllOrders);

// POST /api/orders - Tạo order mới từ cart
router.post('/', createOrder);

// GET /api/orders/user/:userId - Lấy orders của user
router.get('/user/:userId', getOrdersByUserId);

// GET /api/orders/:id - Lấy order theo ID
router.get('/:id', getOrderById);

// GET /api/orders/:id/items - Lấy items của order
router.get('/:id/items', getOrderItems);

// PUT /api/orders/:id/status - Cập nhật status của order
router.put('/:id/status', updateOrderStatus);

// PUT /api/orders/:id/cancel - Hủy order
router.put('/:id/cancel', cancelOrder);

module.exports = router;
