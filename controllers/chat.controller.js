const Chat = require('../models/Chat');
const { errorResponse, successResponse } = require('../utils/responseUtil');
const OpenAI = require('openai');

const openai = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey:
    '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',
  defaultHeaders: {
    'HTTP-Referer': 'https://localhost:8080',
    'X-Title': 'Ecommerce Chat',
  },
});

// Gửi tin nhắn chat đơn giản
exports.sendMessage = async (req, res) => {
  try {
    const { message, userId } = req.body;

    if (!message || !userId) {
      return errorResponse(res, 400, 'Message và userId là bắt buộc', null);
    }

    // Lấy lịch sử chat gần nhất của user để cung cấp context
    const chatHistory = await Chat.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(5) // Lấy 5 tin nhắn gần nhất
      .select('message response');

    // Tạo messages array từ lịch sử (đảo ngược để đúng thứ tự)
    const messages = [
      {
        role: 'system',
        content:
          'Bạn là một trợ lý AI thông minh cho ứng dụng ecommerce. Hãy trả lời một cách hữu ích và thân thiện bằng tiếng Việt.',
      },
    ];

    // Thêm lịch sử chat (đảo ngược để đúng thứ tự thời gian)
    chatHistory.reverse().forEach((chat) => {
      messages.push(
        { role: 'user', content: chat.message },
        { role: 'assistant', content: chat.response }
      );
    });

    // Thêm tin nhắn hiện tại
    messages.push({ role: 'user', content: message });

    // Gọi OpenAI API
    const completion = await openai.chat.completions.create({
      model: 'openai/gpt-4o',
      messages,
      max_tokens: 1000,
      temperature: 0.7,
    });

    const response = completion.choices[0].message.content;

    // Lưu chat vào database
    const chat = await Chat.create({
      user: userId,
      message,
      response,
    });

    return successResponse(res, 200, 'Chat thành công', {
      message,
      response,
      chatId: chat._id,
    });
  } catch (error) {
    console.error('Lỗi chat:', error);
    return errorResponse(res, 500, 'Lỗi server khi xử lý chat', error.message);
  }
};

// Lấy lịch sử chat theo userId
exports.getChatHistory = async (req, res) => {
  try {
    const { userId } = req.params;

    const chats = await Chat.find({ user: userId })
      .sort({ createdAt: 1 }) // Sắp xếp tăng dần để hiển thị đúng thứ tự thời gian
      .populate('user', 'name email');

    // Chuyển đổi format để FE dễ hiển thị
    const chatHistory = [];

    chats.forEach((chat) => {
      // Tin nhắn của user
      chatHistory.push({
        id: `${chat._id}_user`,
        role: 'user',
        content: chat.message,
        timestamp: chat.createdAt,
      });

      // Phản hồi của AI
      chatHistory.push({
        id: `${chat._id}_assistant`,
        role: 'assistant',
        content: chat.response,
        timestamp: chat.createdAt,
      });
    });

    return successResponse(res, 200, 'Lịch sử chat đã được lấy thành công', {
      chatHistory,
      totalMessages: chatHistory.length,
      totalConversations: chats.length,
    });
  } catch (error) {
    console.error('Lỗi lấy lịch sử chat:', error);
    return errorResponse(
      res,
      500,
      'Lỗi server khi lấy lịch sử chat',
      error.message
    );
  }
};
