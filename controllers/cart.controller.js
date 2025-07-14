const Cart = require('../models/Cart');
const CartItem = require('../models/CartItem');
const Product = require('../models/Product');
const User = require('../models/User');
const { successResponse, errorResponse } = require('../utils/responseUtil');

// Lấy hoặc tạo cart cho user
const getOrCreateCart = async (userId) => {
  let cart = await Cart.findOne({ userId });
  if (!cart) {
    cart = new Cart({ userId });
    await cart.save();
  }
  return cart;
};

// Lấy cart của user
exports.getCartByUserId = async (req, res) => {
  try {
    const { userId } = req.params;

    // Kiểm tra user tồn tại
    const user = await User.findById(userId);
    if (!user) {
      return errorResponse(res, 404, 'User not found', null);
    }

    const cart = await getOrCreateCart(userId);

    return successResponse(res, 200, 'Cart fetched successfully', cart);
  } catch (error) {
    return errorResponse(res, 500, error.message, null, null);
  }
};

// Lấy tất cả items trong cart
exports.getCartItems = async (req, res) => {
  try {
    const { userId } = req.params;

    const cart = await getOrCreateCart(userId);

    const cartItems = await CartItem.find({ cartId: cart._id }).populate({
      path: 'product',
      populate: {
        path: 'category',
        select: 'name',
      },
    });

    // Filter out items với product null (đã bị xóa) và cleanup
    const validItems = [];
    const invalidItemIds = [];

    for (const item of cartItems) {
      if (item.product) {
        validItems.push(item);
      } else {
        invalidItemIds.push(item._id);
      }
    }

    // Cleanup: Xóa cart items có product null
    if (invalidItemIds.length > 0) {
      await CartItem.deleteMany({ _id: { $in: invalidItemIds } });
    }

    const result = {
      cart,
      items: validItems,
      cleanupInfo: {
        removedInvalidItems: invalidItemIds.length,
        message:
          invalidItemIds.length > 0
            ? 'Some products were removed from your cart because they are no longer available.'
            : null,
      },
    };

    return successResponse(res, 200, 'Cart items fetched successfully', result);
  } catch (error) {
    return errorResponse(res, 500, error.message, null, null);
  }
};

// Thêm item vào cart
exports.addItemToCart = async (req, res) => {
  try {
    const { userId } = req.params;
    const { productId, quantity = 1 } = req.body;

    // Kiểm tra product tồn tại và available
    const product = await Product.findById(productId);
    if (!product) {
      return errorResponse(res, 404, 'Product not found', null);
    }

    if (product.status !== 'ACTIVE') {
      return errorResponse(res, 400, 'Product is not available', null);
    }

    if (product.stockQuantity < quantity) {
      return errorResponse(res, 400, 'Insufficient stock', null);
    }

    const cart = await getOrCreateCart(userId);

    // Kiểm tra xem product đã có trong cart chưa
    let cartItem = await CartItem.findOne({
      cartId: cart._id,
      product: productId,
    });

    if (cartItem) {
      // Cập nhật quantity nếu đã tồn tại
      const newQuantity = cartItem.quantity + quantity;

      if (product.stockQuantity < newQuantity) {
        return errorResponse(
          res,
          400,
          'Insufficient stock for total quantity',
          null
        );
      }

      cartItem.quantity = newQuantity;
      cartItem.unitPrice = product.price;
      cartItem.totalPrice = cartItem.unitPrice * cartItem.quantity;
      await cartItem.save();
    } else {
      // Tạo cart item mới
      cartItem = new CartItem({
        cartId: cart._id,
        product: productId,
        quantity,
        unitPrice: product.price,
        totalPrice: product.price * quantity,
      });
      await cartItem.save();
    }

    // Populate product info
    await cartItem.populate({
      path: 'product',
      populate: {
        path: 'category',
        select: 'name',
      },
    });

    return successResponse(
      res,
      201,
      'Item added to cart successfully',
      cartItem
    );
  } catch (error) {
    return errorResponse(res, 500, error.message, null);
  }
};

// Cập nhật quantity của cart item
exports.updateCartItem = async (req, res) => {
  try {
    const { userId, itemId } = req.params;
    const { quantity } = req.body;

    if (quantity <= 0) {
      return errorResponse(res, 400, 'Quantity must be greater than 0', null);
    }

    const cart = await getOrCreateCart(userId);

    const cartItem = await CartItem.findOne({
      _id: itemId,
      cartId: cart._id,
    }).populate('product');

    if (!cartItem) {
      return errorResponse(res, 404, 'Cart item not found', null);
    }

    // Kiểm tra stock
    if (cartItem.product.stockQuantity < quantity) {
      return errorResponse(res, 400, 'Insufficient stock', null);
    }

    cartItem.quantity = quantity;
    cartItem.unitPrice = cartItem.product.price;
    cartItem.totalPrice = cartItem.unitPrice * cartItem.quantity;
    await cartItem.save();

    await cartItem.populate({
      path: 'product',
      populate: {
        path: 'category',
        select: 'name',
      },
    });

    return successResponse(
      res,
      200,
      'Cart item updated successfully',
      cartItem
    );
  } catch (error) {
    return errorResponse(res, 500, error.message, null, null);
  }
};

// Xóa item khỏi cart
exports.removeCartItem = async (req, res) => {
  try {
    const { userId, itemId } = req.params;

    const cart = await getOrCreateCart(userId);

    const cartItem = await CartItem.findOneAndDelete({
      _id: itemId,
      cartId: cart._id,
    });

    if (!cartItem) {
      return errorResponse(res, 404, 'Cart item not found', null);
    }

    return successResponse(
      res,
      200,
      'Cart item removed successfully',
      cartItem
    );
  } catch (error) {
    return errorResponse(res, 500, error.message, null, null);
  }
};

// Xóa tất cả items trong cart
exports.clearCart = async (req, res) => {
  try {
    const { userId } = req.params;

    const cart = await getOrCreateCart(userId);

    await CartItem.deleteMany({ cartId: cart._id });

    // Reset cart totals
    cart.totalPrice = 0;
    cart.totalItems = 0;
    await cart.save();

    return successResponse(res, 200, 'Cart cleared successfully', cart);
  } catch (error) {
    return errorResponse(res, 500, error.message, null, null);
  }
};
