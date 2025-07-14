const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    response: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

chatSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('Chat', chatSchema);
