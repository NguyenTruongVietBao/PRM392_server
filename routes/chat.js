const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chat.controller');

// POST /api/chat/send - Gửi tin nhắn chat đơn giản
router.post('/send', chatController.sendMessage);

// GET /api/chat/history/:userId - Lấy lịch sử chat theo userId
router.get('/history/:userId', chatController.getChatHistory);

module.exports = router;
