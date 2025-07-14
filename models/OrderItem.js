const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    unitPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    totalPrice: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Virtual methods
orderItemSchema.virtual('formattedUnitPrice').get(function () {
  return `$${this.unitPrice.toFixed(2)}`;
});

orderItemSchema.virtual('formattedTotalPrice').get(function () {
  return `$${this.totalPrice.toFixed(2)}`;
});

// Pre-save middleware để tự động tính totalPrice
orderItemSchema.pre('save', function (next) {
  this.totalPrice = this.unitPrice * this.quantity;
  next();
});

module.exports = mongoose.model('OrderItem', orderItemSchema);
