var express = require('express');
const {
  getCartByUserId,
  addItemToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
  getCartItems,
} = require('../controllers/cart.controller');
var router = express.Router();

// GET /api/cart/:userId - Lấy cart của user
router.get('/:userId', getCartByUserId);

// GET /api/cart/:userId/items - Lấy tất cả items trong cart
router.get('/:userId/items', getCartItems);

// POST /api/cart/:userId/items - Thêm item vào cart
router.post('/:userId/items', addItemToCart);

// PUT /api/cart/:userId/items/:itemId - Cập nhật quantity của item
router.put('/:userId/items/:itemId', updateCartItem);

// DELETE /api/cart/:userId/items/:itemId - Xóa item khỏi cart
router.delete('/:userId/items/:itemId', removeCartItem);

// DELETE /api/cart/:userId - Xóa tất cả items trong cart
router.delete('/:userId', clearCart);

module.exports = router;
