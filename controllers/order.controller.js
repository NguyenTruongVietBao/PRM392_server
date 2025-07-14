const Order = require('../models/Order');
const OrderItem = require('../models/OrderItem');
const Cart = require('../models/Cart');
const CartItem = require('../models/CartItem');
const Product = require('../models/Product');
const User = require('../models/User');
const { successResponse, errorResponse } = require('../utils/responseUtil');

// Tạo order mới từ cart
exports.createOrder = async (req, res) => {
  try {
    const { userId, shippingAddress, orderNote, paymentMethod } = req.body;

    // Kiểm tra user tồn tại
    const user = await User.findById(userId);
    if (!user) {
      return errorResponse(res, 404, 'User not found', null);
    }

    // Lấy cart và cart items
    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return errorResponse(res, 400, 'Cart is empty', null);
    }

    const cartItems = await CartItem.find({ cartId: cart._id }).populate(
      'product'
    );
    if (!cartItems.length) {
      return errorResponse(res, 400, 'No items in cart', null);
    }

    // Kiểm tra stock và tính total
    let totalAmount = 0;
    const orderItemsData = [];

    for (const cartItem of cartItems) {
      const product = cartItem.product;

      // Kiểm tra product còn active và đủ stock
      if (product.status !== 'ACTIVE') {
        return errorResponse(
          res,
          400,
          `Product ${product.name} is no longer available`,
          null
        );
      }

      if (product.stockQuantity < cartItem.quantity) {
        return errorResponse(
          res,
          400,
          `Insufficient stock for ${product.name}`,
          null
        );
      }

      const itemTotal = cartItem.unitPrice * cartItem.quantity;
      totalAmount += itemTotal;

      orderItemsData.push({
        product: product._id,
        quantity: cartItem.quantity,
        unitPrice: cartItem.unitPrice,
        totalPrice: itemTotal,
      });
    }

    // Tạo order number unique
    const orderNumber =
      'ORD' +
      Date.now() +
      Math.random().toString(36).substr(2, 5).toUpperCase();

    // Tạo order
    const order = new Order({
      userId,
      orderNumber,
      totalAmount,
      shippingAddress,
      orderNote,
      status: 'PENDING',
    });

    await order.save();

    // Tạo order items
    const orderItems = [];
    for (const itemData of orderItemsData) {
      const orderItem = new OrderItem({
        orderId: order._id,
        ...itemData,
      });
      await orderItem.save();
      orderItems.push(orderItem);

      // Giảm stock quantity
      await Product.findByIdAndUpdate(itemData.product, {
        $inc: { stockQuantity: -itemData.quantity },
      });
    }

    // Xóa cart items sau khi tạo order thành công
    await CartItem.deleteMany({ cartId: cart._id });
    cart.totalPrice = 0;
    cart.totalItems = 0;
    await cart.save();

    // Không populate userId trong create response để tránh parsing error
    // await order.populate('userId', 'name email phone');

    return successResponse(res, 201, 'Order created successfully', order);
  } catch (error) {
    return errorResponse(res, 500, 'Server error', error.message);
  }
};

// Lấy tất cả orders (cho admin/manager)
exports.getAllOrders = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const filter = {};
    if (status) filter.status = status;

    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const skip = (page - 1) * limit;

    const orders = await Order.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(Number(limit));

    const total = await Order.countDocuments(filter);

    // Thêm thông tin số sản phẩm cho mỗi order
    const ordersWithItemCount = await Promise.all(
      orders.map(async (order) => {
        const itemCount = await OrderItem.countDocuments({
          orderId: order._id,
        });
        const buyer = await User.findById(order.userId);
        return {
          ...order.toObject(),
          itemCount,
          buyer: buyer.email,
        };
      })
    );

    const result = {
      orders: ordersWithItemCount,
      pagination: {
        current: Number(page),
        total: Math.ceil(total / limit),
        count: orders.length,
        totalItems: total,
      },
    };

    return successResponse(res, 200, 'Orders fetched successfully', result);
  } catch (error) {
    return errorResponse(res, 500, 'Server error', error.message);
  }
};

// Lấy orders của user
exports.getOrdersByUserId = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10, status } = req.query;

    const filter = { userId };
    if (status) filter.status = status;

    const skip = (page - 1) * limit;

    const orders = await Order.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Order.countDocuments(filter);

    // Thêm thông tin số sản phẩm cho mỗi order
    const ordersWithItemCount = await Promise.all(
      orders.map(async (order) => {
        const itemCount = await OrderItem.countDocuments({
          orderId: order._id,
        });
        const buyer = await User.findById(order.userId);
        return {
          ...order.toObject(),
          itemCount,
          buyer: buyer.email,
        };
      })
    );

    const result = {
      orders: ordersWithItemCount,
      pagination: {
        current: Number(page),
        total: Math.ceil(total / limit),
        count: orders.length,
        totalItems: total,
      },
    };

    return successResponse(
      res,
      200,
      'User orders fetched successfully',
      result
    );
  } catch (error) {
    return errorResponse(res, 500, 'Server error', error.message);
  }
};

// Lấy order theo ID
exports.getOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await Order.findById(id)
      // .populate('userId', 'name email phone') // Commented to avoid parsing issues in Android
      .populate('payment');

    if (!order) {
      return errorResponse(res, 404, 'Order not found', null);
    }

    return successResponse(res, 200, 'Order fetched successfully', order);
  } catch (error) {
    return errorResponse(res, 500, 'Server error', error.message);
  }
};

// Lấy items của order
exports.getOrderItems = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await Order.findById(id);
    if (!order) {
      return errorResponse(res, 404, 'Order not found', null);
    }

    const orderItems = await OrderItem.find({ orderId: id }).populate({
      path: 'product',
      populate: {
        path: 'category',
        select: 'name',
      },
    });

    const result = {
      order,
      items: orderItems,
    };

    return successResponse(
      res,
      200,
      'Order items fetched successfully',
      result
    );
  } catch (error) {
    return errorResponse(res, 500, 'Server error', error.message);
  }
};

// Cập nhật status của order
exports.updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['PENDING', 'PROCESSING', 'SHIPPED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      return errorResponse(res, 400, 'Invalid order status', null);
    }

    const order = await Order.findById(id);
    if (!order) {
      return errorResponse(res, 404, 'Order not found', null);
    }

    // Không cho phép thay đổi status nếu order đã bị hủy hoặc đã giao hàng
    if (order.status === 'CANCELLED' || order.status === 'SHIPPED') {
      return errorResponse(
        res,
        400,
        'Cannot update status of shipped or cancelled order',
        null
      );
    }

    order.status = status;
    await order.save();

    // await order.populate('userId', 'name email phone'); // Commented to avoid parsing issues in Android

    return successResponse(
      res,
      200,
      'Order status updated successfully',
      order
    );
  } catch (error) {
    return errorResponse(res, 500, 'Server error', error.message);
  }
};

// Hủy order
exports.cancelOrder = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await Order.findById(id);
    if (!order) {
      return errorResponse(res, 404, 'Order not found', null);
    }

    // Chỉ cho phép hủy order nếu chưa shipped
    if (order.status === 'SHIPPED') {
      return errorResponse(
        res,
        400,
        'Cannot cancel order that has been shipped',
        null
      );
    }

    if (order.status === 'CANCELLED') {
      return errorResponse(res, 400, 'Order is already cancelled', null);
    }

    // Hoàn lại stock
    const orderItems = await OrderItem.find({ orderId: id });
    for (const item of orderItems) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stockQuantity: item.quantity },
      });
    }

    order.status = 'CANCELLED';
    await order.save();

    // await order.populate('userId', 'name email phone'); // Commented to avoid parsing issues in Android

    return successResponse(res, 200, 'Order cancelled successfully', order);
  } catch (error) {
    return errorResponse(res, 500, 'Server error', error.message);
  }
};
