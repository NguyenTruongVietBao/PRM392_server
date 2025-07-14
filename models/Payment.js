const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
      unique: true, // Mỗi order chỉ có một payment
    },
    paymentMethod: {
      type: String,
      required: true,
      enum: [
        'CREDIT_CARD',
        'DEBIT_CARD',
        'PAYPAL',
        'BANK_TRANSFER',
        'CASH_ON_DELIVERY',
      ],
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: 'USD',
      enum: ['USD', 'VND', 'EUR'],
    },
    status: {
      type: String,
      enum: [
        'PENDING',
        'PROCESSING',
        'COMPLETED',
        'FAILED',
        'CANCELLED',
        'REFUNDED',
      ],
      default: 'PENDING',
    },
    transactionId: {
      type: String,
      unique: true,
      sparse: true, // Cho phép null values
    },
    gatewayResponse: {
      type: String,
    },
    paymentDate: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Virtual methods
paymentSchema.virtual('formattedAmount').get(function () {
  const symbol = this.currency === 'VND' ? '₫' : '$';
  return `${symbol}${this.amount.toFixed(2)}`;
});

paymentSchema.virtual('isSuccessful').get(function () {
  return this.status === 'COMPLETED';
});

// Pre-save middleware để set paymentDate khi status = COMPLETED
paymentSchema.pre('save', function (next) {
  if (this.status === 'COMPLETED' && !this.paymentDate) {
    this.paymentDate = new Date();
  }
  next();
});

module.exports = mongoose.model('Payment', paymentSchema);
