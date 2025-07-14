const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    imageUrl: {
      type: String,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
    },
    stockQuantity: {
      type: Number,
      default: 0,
      min: 0,
    },
    color: {
      type: String,
      trim: true,
    },
    size: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE'],
      default: 'INACTIVE',
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    reviewCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);
// Cập nhật avatar mặc định
productSchema.pre('save', function (next) {
  if (!this.imageUrl && this.name) {
    this.imageUrl = `https://api.dicebear.com/9.x/shapes/svg?seed=${encodeURIComponent(
      this.name
    )}&backgroundType=gradientLinear&backgroundColor=b6e3f4,d1d4f9`;
  }
  next();
});
// Virtual methods
productSchema.virtual('isInStock').get(function () {
  return this.stockQuantity > 0;
});

productSchema.virtual('formattedPrice').get(function () {
  return `$${this.price.toFixed(2)}`;
});

productSchema.virtual('formattedRating').get(function () {
  return `${this.rating.toFixed(1)} (${this.reviewCount})`;
});

module.exports = mongoose.model('Product', productSchema);
