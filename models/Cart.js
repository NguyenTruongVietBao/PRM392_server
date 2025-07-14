const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true, // Mỗi user chỉ có một cart
    },
    totalPrice: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalItems: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Virtual để get cart items
cartSchema.virtual('items', {
  ref: 'CartItem',
  localField: '_id',
  foreignField: 'cartId',
});

// Virtual methods
cartSchema.virtual('isEmpty').get(function () {
  return this.totalItems === 0;
});

cartSchema.virtual('formattedTotal').get(function () {
  return `$${this.totalPrice.toFixed(2)}`;
});

// Method để tính toán lại totals
cartSchema.methods.calculateTotals = async function () {
  const CartItem = mongoose.model('CartItem');
  const items = await CartItem.find({ cartId: this._id }).populate('product');

  this.totalPrice = 0;
  this.totalItems = 0;

  for (const item of items) {
    this.totalPrice += item.totalPrice;
    this.totalItems += item.quantity;
  }

  return this.save();
};

module.exports = mongoose.model('Cart', cartSchema);
