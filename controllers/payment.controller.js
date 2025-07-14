const Payment = require('../models/Payment');
const Order = require('../models/Order');
const { successResponse, errorResponse } = require('../utils/responseUtil');

// Tạo payment cho order
exports.createPayment = async (req, res) => {
  try {
    const { orderId, paymentMethod, amount, currency } = req.body;

    // Kiểm tra order tồn tại
    const order = await Order.findById(orderId);
    if (!order) {
      return errorResponse(res, 404, 'Order not found', null);
    }

    // Kiểm tra order chưa có payment
    const existingPayment = await Payment.findOne({ orderId });
    if (existingPayment) {
      return errorResponse(
        res,
        400,
        'Payment already exists for this order',
        null
      );
    }

    // Kiểm tra amount khớp với order total
    if (amount && amount !== order.totalAmount) {
      return errorResponse(
        res,
        400,
        'Payment amount does not match order total',
        null
      );
    }

    const payment = new Payment({
      orderId,
      paymentMethod,
      amount: amount || order.totalAmount,
      currency: currency || 'USD',
      status: 'PENDING',
    });

    await payment.save();

    // Cập nhật order với payment reference
    order.payment = payment._id;
    await order.save();

    await payment.populate('orderId', 'orderNumber totalAmount userId');

    return successResponse(res, 201, 'Payment created successfully', payment);
  } catch (error) {
    return errorResponse(res, 500, 'Server error', error.message);
  }
};

// Lấy payment theo ID
exports.getPaymentById = async (req, res) => {
  try {
    const { id } = req.params;

    const payment = await Payment.findById(id).populate(
      'orderId',
      'orderNumber totalAmount userId status'
    );

    if (!payment) {
      return errorResponse(res, 404, 'Payment not found', null);
    }

    return successResponse(res, 200, 'Payment fetched successfully', payment);
  } catch (error) {
    return errorResponse(res, 500, 'Server error', error.message);
  }
};

// Lấy payment theo order ID
exports.getPaymentByOrderId = async (req, res) => {
  try {
    const { orderId } = req.params;

    const payment = await Payment.findOne({ orderId }).populate(
      'orderId',
      'orderNumber totalAmount userId status'
    );

    if (!payment) {
      return errorResponse(res, 404, 'Payment not found for this order', null);
    }

    return successResponse(res, 200, 'Payment fetched successfully', payment);
  } catch (error) {
    return errorResponse(res, 500, 'Server error', error.message);
  }
};

// Cập nhật payment status
exports.updatePaymentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, transactionId, gatewayResponse } = req.body;

    const validStatuses = [
      'PENDING',
      'PROCESSING',
      'COMPLETED',
      'FAILED',
      'CANCELLED',
      'REFUNDED',
    ];
    if (!validStatuses.includes(status)) {
      return errorResponse(res, 400, 'Invalid payment status', null);
    }

    const payment = await Payment.findById(id);
    if (!payment) {
      return errorResponse(res, 404, 'Payment not found', null);
    }

    payment.status = status;
    if (transactionId) payment.transactionId = transactionId;
    if (gatewayResponse) payment.gatewayResponse = gatewayResponse;

    await payment.save();

    // Cập nhật order status nếu payment completed
    if (status === 'COMPLETED') {
      const order = await Order.findById(payment.orderId);
      if (order && order.status === 'PENDING') {
        order.status = 'CONFIRMED';
        await order.save();
      }
    }

    await payment.populate('orderId', 'orderNumber totalAmount userId status');

    return successResponse(
      res,
      200,
      'Payment status updated successfully',
      payment
    );
  } catch (error) {
    return errorResponse(res, 500, 'Server error', error.message);
  }
};

// Xử lý thanh toán (simulate payment processing)
exports.processPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { cardNumber, expiryDate, cvv, cardHolderName } = req.body;

    const payment = await Payment.findById(id);
    if (!payment) {
      return errorResponse(res, 404, 'Payment not found', null);
    }

    if (payment.status !== 'PENDING') {
      return errorResponse(res, 400, 'Payment is not in pending status', null);
    }

    // Simulate payment processing logic
    payment.status = 'PROCESSING';
    await payment.save();

    // Simulate payment gateway response (normally this would be real API call)
    const isSuccessful = Math.random() > 0.1; // 90% success rate

    if (isSuccessful) {
      payment.status = 'COMPLETED';
      payment.transactionId = 'TXN' + Date.now();
      payment.gatewayResponse = 'Payment processed successfully';
      payment.paymentDate = new Date();

      // Update order status
      const order = await Order.findById(payment.orderId);
      if (order) {
        order.status = 'CONFIRMED';
        await order.save();
      }
    } else {
      payment.status = 'FAILED';
      payment.gatewayResponse = 'Payment processing failed';
    }

    await payment.save();
    await payment.populate('orderId', 'orderNumber totalAmount userId status');

    const message = isSuccessful
      ? 'Payment processed successfully'
      : 'Payment processing failed';

    return successResponse(res, 200, message, payment);
  } catch (error) {
    return errorResponse(res, 500, 'Server error', error.message);
  }
};

// Hoàn tiền
exports.refundPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { refundAmount, reason } = req.body;

    const payment = await Payment.findById(id);
    if (!payment) {
      return errorResponse(res, 404, 'Payment not found', null);
    }

    if (payment.status !== 'COMPLETED') {
      return errorResponse(
        res,
        400,
        'Can only refund completed payments',
        null
      );
    }

    const refundAmountValue = refundAmount || payment.amount;

    if (refundAmountValue > payment.amount) {
      return errorResponse(
        res,
        400,
        'Refund amount cannot exceed payment amount',
        null
      );
    }

    // Simulate refund processing
    payment.status = 'REFUNDED';
    payment.gatewayResponse = `Refunded ${refundAmountValue}. Reason: ${
      reason || 'No reason provided'
    }`;

    await payment.save();

    // Update order status if fully refunded
    if (refundAmountValue === payment.amount) {
      const order = await Order.findById(payment.orderId);
      if (order) {
        order.status = 'CANCELLED';
        await order.save();
      }
    }

    await payment.populate('orderId', 'orderNumber totalAmount userId status');

    return successResponse(res, 200, 'Refund processed successfully', payment);
  } catch (error) {
    return errorResponse(res, 500, 'Server error', error.message);
  }
};
