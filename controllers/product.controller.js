const Product = require('../models/Product');
const Category = require('../models/Category');
const CartItem = require('../models/CartItem');
const { successResponse, errorResponse } = require('../utils/responseUtil');

// Lấy tất cả products với pagination và filters
exports.getAllProducts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      category,
      minPrice,
      maxPrice,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    // Build filter object
    const filter = {};
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    // Sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const skip = (page - 1) * limit;

    const products = await Product.find(filter)
      .populate('category', 'name description')
      .sort(sort)
      .skip(skip)
      .limit(Number(limit));

    const total = await Product.countDocuments(filter);

    const result = {
      products,
      pagination: {
        current: Number(page),
        total: Math.ceil(total / limit),
        count: products.length,
        totalItems: total,
      },
    };

    return successResponse(res, 200, 'Products fetched successfully', result);
  } catch (error) {
    return errorResponse(res, 500, 'Server error', error.message);
  }
};

// Search products theo tên hoặc mô tả
exports.searchProducts = async (req, res) => {
  try {
    const { q, page = 1, limit = 10 } = req.query;

    if (!q) {
      return errorResponse(res, 400, 'Search query is required', null);
    }

    const filter = {
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
      ],
      status: 'ACTIVE',
    };

    const skip = (page - 1) * limit;

    const products = await Product.find(filter)
      .populate('category', 'name description')
      .skip(skip)
      .limit(Number(limit));

    const total = await Product.countDocuments(filter);

    const result = {
      products,
      pagination: {
        current: Number(page),
        total: Math.ceil(total / limit),
        count: products.length,
        totalItems: total,
      },
      searchQuery: q,
    };

    return successResponse(res, 200, 'Search completed successfully', result);
  } catch (error) {
    return errorResponse(res, 500, 'Server error', error.message);
  }
};

// Lấy products theo category
exports.getProductsByCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    // Kiểm tra category tồn tại
    const category = await Category.findById(categoryId);
    if (!category) {
      return errorResponse(res, 404, 'Category not found', null);
    }

    const skip = (page - 1) * limit;

    const products = await Product.find({
      category: categoryId,
      status: 'ACTIVE',
    })
      .populate('category', 'name description')
      .skip(skip)
      .limit(Number(limit));

    const total = await Product.countDocuments({
      category: categoryId,
      status: 'ACTIVE',
    });

    const result = {
      products,
      category,
      pagination: {
        current: Number(page),
        total: Math.ceil(total / limit),
        count: products.length,
        totalItems: total,
      },
    };

    return successResponse(
      res,
      200,
      'Products by category fetched successfully',
      result
    );
  } catch (error) {
    return errorResponse(res, 500, 'Server error', error.message);
  }
};

// Lấy product theo ID
exports.getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id).populate(
      'category',
      'name description'
    );

    if (!product) {
      return errorResponse(res, 404, 'Product not found', null);
    }

    return successResponse(res, 200, 'Product fetched successfully', product);
  } catch (error) {
    return errorResponse(res, 500, 'Server error', error.message);
  }
};

// Tạo product mới
exports.createProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      imageUrl,
      category,
      stockQuantity,
      color,
      size,
      status,
    } = req.body;

    // Kiểm tra category tồn tại
    const categoryExists = await Category.findById(category);
    if (!categoryExists) {
      return errorResponse(res, 400, 'Category not found', null);
    }

    const product = new Product({
      name,
      description,
      price,
      imageUrl,
      category,
      stockQuantity,
      color,
      size,
      status,
    });

    await product.save();
    await product.populate('category', 'name description');

    return successResponse(res, 201, 'Product created successfully', product);
  } catch (error) {
    return errorResponse(res, 500, 'Server error', error.message);
  }
};

// Cập nhật product
exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const product = await Product.findById(id);
    if (!product) {
      return errorResponse(res, 404, 'Product not found', null);
    }

    // Kiểm tra category nếu được cập nhật
    if (updateData.category) {
      const categoryExists = await Category.findById(updateData.category);
      if (!categoryExists) {
        return errorResponse(res, 400, 'Category not found', null);
      }
    }

    const updatedProduct = await Product.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    }).populate('category', 'name description');

    return successResponse(
      res,
      200,
      'Product updated successfully',
      updatedProduct
    );
  } catch (error) {
    return errorResponse(res, 500, 'Server error', error.message);
  }
};

// Xóa product
exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id);
    if (!product) {
      return errorResponse(res, 404, 'Product not found', null);
    }

    // Cleanup: Xóa tất cả cart items chứa product này
    const deletedCartItems = await CartItem.deleteMany({ product: id });

    // Xóa product
    await Product.findByIdAndDelete(id);

    const result = {
      ...product.toObject(),
      cleanupInfo: {
        removedFromCarts: deletedCartItems.deletedCount,
      },
    };

    return successResponse(res, 200, 'Product deleted successfully', result);
  } catch (error) {
    return errorResponse(res, 500, 'Server error', error.message);
  }
};
