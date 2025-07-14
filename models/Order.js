const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    orderNumber: {
      type: String,
      required: true,
      unique: true,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ['PENDING', 'PROCESSING', 'SHIPPED', 'CANCELLED'],
      default: 'PENDING',
    },
    shippingAddress: {
      type: String,
      required: true,
      trim: true,
    },
    orderNote: {
      type: String,
      trim: true,
    },
    orderDate: {
      type: Date,
      default: Date.now,
    },
    payment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment',
    },
  },
  {
    timestamps: true,
  }
);

// Virtual để get order items
orderSchema.virtual('items', {
  ref: 'OrderItem',
  localField: '_id',
  foreignField: 'orderId',
});

// Virtual methods
orderSchema.virtual('formattedTotal').get(function () {
  return `$${this.totalAmount.toFixed(2)}`;
});

// Pre-save middleware để generate order number
orderSchema.pre('save', function (next) {
  if (!this.orderNumber) {
    this.orderNumber = 'ORD' + Date.now();
  }
  next();
});

// Method để tính total items
orderSchema.methods.getTotalItems = async function () {
  const OrderItem = mongoose.model('OrderItem');
  const items = await OrderItem.find({ orderId: this._id });

  let total = 0;
  for (const item of items) {
    total += item.quantity;
  }

  return total;
};

module.exports = mongoose.model('Order', orderSchema);
