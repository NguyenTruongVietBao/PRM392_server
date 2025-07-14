const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    name: {
      type: String,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    address: {
      type: String,
      trim: true,
    },
    avatar: {
      type: String,
      default: null,
    },
    role: {
      type: String,
      enum: ['ADMIN', 'MANAGER', 'CUSTOMER'],
      default: 'CUSTOMER',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.virtual('isAdmin').get(function () {
  return this.role === 'ADMIN';
});

userSchema.virtual('isManager').get(function () {
  return this.role === 'MANAGER';
});

userSchema.virtual('isCustomer').get(function () {
  return this.role === 'CUSTOMER';
});

module.exports = mongoose.model('User', userSchema);
