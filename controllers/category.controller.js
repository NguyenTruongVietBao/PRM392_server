const Category = require('../models/Category');
const { successResponse, errorResponse } = require('../utils/responseUtil');

// Lấy tất cả categories
exports.getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find();
    return successResponse(
      res,
      200,
      'Categories fetched successfully',
      categories
    );
  } catch (error) {
    return errorResponse(res, 500, 'Server error', error.message);
  }
};

// Lấy category theo ID
exports.getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await Category.findById(id);

    if (!category) {
      return errorResponse(res, 404, 'Category not found', null);
    }

    return successResponse(res, 200, 'Category fetched successfully', category);
  } catch (error) {
    return errorResponse(res, 500, 'Server error', error.message);
  }
};

// Tạo category mới
exports.createCategory = async (req, res) => {
  try {
    const { name, description, imageUrl } = req.body;

    // Kiểm tra tên category đã tồn tại
    const existingCategory = await Category.findOne({ name });
    if (existingCategory) {
      return errorResponse(res, 400, 'Category name already exists', null);
    }

    const category = new Category({
      name,
      description,
      imageUrl,
    });

    await category.save();
    return successResponse(res, 201, 'Category created successfully', category);
  } catch (error) {
    return errorResponse(res, 500, 'Server error', error.message);
  }
};

// Cập nhật category
exports.updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, imageUrl } = req.body;

    const category = await Category.findById(id);
    if (!category) {
      return errorResponse(res, 404, 'Category not found', null);
    }

    // Kiểm tra tên category đã tồn tại (trừ category hiện tại)
    if (name && name !== category.name) {
      const existingCategory = await Category.findOne({ name });
      if (existingCategory) {
        return errorResponse(res, 400, 'Category name already exists', null);
      }
    }

    // Cập nhật fields
    if (name) category.name = name;
    if (description !== undefined) category.description = description;
    if (imageUrl !== undefined) category.imageUrl = imageUrl;

    await category.save();
    return successResponse(res, 200, 'Category updated successfully', category);
  } catch (error) {
    return errorResponse(res, 500, 'Server error', error.message);
  }
};

// Xóa category
exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await Category.findByIdAndDelete(id);
    if (!category) {
      return errorResponse(res, 404, 'Category not found', null);
    }

    return successResponse(res, 200, 'Category deleted successfully', category);
  } catch (error) {
    return errorResponse(res, 500, 'Server error', error.message);
  }
};
