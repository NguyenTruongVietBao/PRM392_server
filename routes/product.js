var express = require('express');
const {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductsByCategory,
  searchProducts,
} = require('../controllers/product.controller');
var router = express.Router();

// GET /api/products - Lấy tất cả products với filter và search
router.get('/', getAllProducts);

// GET /api/products/search - Tìm kiếm products
router.get('/search', searchProducts);

// GET /api/products/category/:categoryId - Lấy products theo category
router.get('/category/:categoryId', getProductsByCategory);

// POST /api/products - Tạo product mới
router.post('/', createProduct);

// GET /api/products/:id - Lấy product theo ID
router.get('/:id', getProductById);

// PUT /api/products/:id - Cập nhật product
router.put('/:id', updateProduct);

// DELETE /api/products/:id - Xóa product
router.delete('/:id', deleteProduct);

module.exports = router;
