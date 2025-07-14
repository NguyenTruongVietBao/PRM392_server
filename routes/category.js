var express = require('express');
const {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
} = require('../controllers/category.controller');
var router = express.Router();

// GET /api/categories - Lấy tất cả categories
router.get('/', getAllCategories);

// POST /api/categories - Tạo category mới
router.post('/', createCategory);

// GET /api/categories/:id - Lấy category theo ID
router.get('/:id', getCategoryById);

// PUT /api/categories/:id - Cập nhật category
router.put('/:id', updateCategory);

// DELETE /api/categories/:id - Xóa category
router.delete('/:id', deleteCategory);

module.exports = router;
