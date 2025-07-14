const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema(
  {
    cartId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Cart',
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
      default: 1,
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

// Compound index để đảm bảo không có duplicate product trong cùng cart
cartItemSchema.index({ cartId: 1, product: 1 }, { unique: true });

// Virtual methods
cartItemSchema.virtual('formattedUnitPrice').get(function () {
  return `$${this.unitPrice.toFixed(2)}`;
});

cartItemSchema.virtual('formattedTotalPrice').get(function () {
  return `$${this.totalPrice.toFixed(2)}`;
});

// Pre-save middleware để tự động tính totalPrice
cartItemSchema.pre('save', function (next) {
  this.totalPrice = this.unitPrice * this.quantity;
  next();
});

// Post-save middleware để update cart totals
cartItemSchema.post('save', async function () {
  const Cart = mongoose.model('Cart');
  const cart = await Cart.findById(this.cartId);
  if (cart) {
    await cart.calculateTotals();
  }
});

// Post-remove middleware để update cart totals
cartItemSchema.post(
  'deleteOne',
  { document: true, query: false },
  async function () {
    const Cart = mongoose.model('Cart');
    const cart = await Cart.findById(this.cartId);
    if (cart) {
      await cart.calculateTotals();
    }
  }
);

module.exports = mongoose.model('CartItem', cartItemSchema);
