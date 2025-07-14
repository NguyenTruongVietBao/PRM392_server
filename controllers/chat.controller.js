const Chat = require("../models/Chat");
const { errorResponse, successResponse } = require("../utils/responseUtil");
const OpenAI = require("openai");

const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey:
    "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",
  defaultHeaders: {
    "HTTP-Referer": "https://localhost:8080",
    "X-Title": "Ecommerce Chat",
  },
});

// Gửi tin nhắn chat đơn giản
exports.sendMessage = async (req, res) => {
  try {
    console.log("=== CHAT REQUEST START ===");
    console.log("Request body:", JSON.stringify(req.body, null, 2));
    console.log("Timestamp:", new Date().toISOString());

    const { message, userId } = req.body;

    if (!message || !userId) {
      console.log("❌ Validation failed - Missing required fields");
      console.log("Message exists:", !!message);
      console.log("UserId exists:", !!userId);
      return errorResponse(res, 400, "Message và userId là bắt buộc", null);
    }

    console.log("✅ Validation passed");
    console.log("User ID:", userId);
    console.log("Message length:", message.length);
    console.log(
      "Message preview:",
      message.substring(0, 100) + (message.length > 100 ? "..." : "")
    );

    // Lấy lịch sử chat
    console.log("📚 Fetching chat history...");
    const chatHistory = await Chat.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .select("message response");

    console.log("Chat history found:", chatHistory.length, "messages");
    chatHistory.forEach((chat, index) => {
      console.log(`History ${index + 1}:`);
      console.log(`  User: ${chat.message.substring(0, 50)}...`);
      console.log(`  AI: ${chat.response.substring(0, 50)}...`);
    });

    // Tạo messages array
    const messages = [
      {
        role: "system",
        content:
          "Bạn là một trợ lý AI thông minh cho ứng dụng ecommerce. Hãy trả lời một cách hữu ích và thân thiện bằng tiếng Việt.",
      },
    ];

    chatHistory.reverse().forEach((chat) => {
      messages.push(
        { role: "user", content: chat.message },
        { role: "assistant", content: chat.response }
      );
    });

    messages.push({ role: "user", content: message });

    console.log("📝 Messages array prepared");
    console.log("Total messages in context:", messages.length);
    console.log(
      "Context size estimate:",
      JSON.stringify(messages).length,
      "characters"
    );

    // Gọi OpenAI API
    console.log("🤖 Calling OpenAI API...");
    console.log("Model:", "openai/gpt-4o");
    console.log("Max tokens:", 1000);
    console.log("Temperature:", 0.7);

    const startTime = Date.now();
    const completion = await openai.chat.completions.create({
      model: "openai/gpt-4o",
      messages,
      max_tokens: 1000,
      temperature: 0.7,
    });
    const apiCallDuration = Date.now() - startTime;

    console.log("✅ OpenAI API response received");
    console.log("API call duration:", apiCallDuration, "ms");
    console.log("Response choices:", completion.choices.length);
    console.log("Usage:", completion.usage);

    const response = completion.choices[0].message.content;
    console.log("Response length:", response.length);
    console.log(
      "Response preview:",
      response.substring(0, 100) + (response.length > 100 ? "..." : "")
    );

    // Lưu chat vào database
    console.log("💾 Saving chat to database...");
    const chat = await Chat.create({
      user: userId,
      message,
      response,
    });

    console.log("✅ Chat saved successfully");
    console.log("Chat ID:", chat._id);
    console.log("Created at:", chat.createdAt);

    console.log("=== CHAT REQUEST SUCCESS ===");
    console.log("Total processing time:", Date.now() - startTime, "ms");

    return successResponse(res, 200, "Chat thành công", {
      message,
      response,
      chatId: chat._id,
    });
  } catch (error) {
    console.error("=== CHAT REQUEST ERROR ===");
    console.error("Error type:", error.constructor.name);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);

    if (error.response) {
      console.error("API Error Response:", error.response.data);
      console.error("API Error Status:", error.response.status);
    }

    console.error("Request details:");
    console.error("- User ID:", req.body?.userId);
    console.error("- Message length:", req.body?.message?.length);
    console.error("- Timestamp:", new Date().toISOString());

    return errorResponse(res, 500, "Lỗi server khi xử lý chat", error.message);
  }
};

// Lấy lịch sử chat theo userId
exports.getChatHistory = async (req, res) => {
  try {
    console.log("=== GET CHAT HISTORY START ===");
    console.log("Request params:", req.params);
    console.log("Timestamp:", new Date().toISOString());

    const { userId } = req.params;
    console.log("Fetching history for user:", userId);

    const startTime = Date.now();
    const chats = await Chat.find({ user: userId })
      .sort({ createdAt: 1 })
      .populate("user", "name email");
    const dbQueryDuration = Date.now() - startTime;

    console.log("✅ Database query completed");
    console.log("Query duration:", dbQueryDuration, "ms");
    console.log("Raw chats found:", chats.length);

    if (chats.length > 0) {
      console.log("First chat:", chats[0].createdAt);
      console.log("Last chat:", chats[chats.length - 1].createdAt);
      console.log("User info:", chats[0].user);
    }

    // Chuyển đổi format
    console.log("🔄 Converting chat format...");
    const chatHistory = [];

    chats.forEach((chat, index) => {
      console.log(`Processing chat ${index + 1}/${chats.length}:`);
      console.log(`  ID: ${chat._id}`);
      console.log(`  Created: ${chat.createdAt}`);
      console.log(`  Message: ${chat.message.substring(0, 50)}...`);
      console.log(`  Response: ${chat.response.substring(0, 50)}...`);

      chatHistory.push({
        id: `${chat._id}_user`,
        role: "user",
        content: chat.message,
        timestamp: chat.createdAt,
      });

      chatHistory.push({
        id: `${chat._id}_assistant`,
        role: "assistant",
        content: chat.response,
        timestamp: chat.createdAt,
      });
    });

    console.log("✅ Format conversion completed");
    console.log("Total messages in history:", chatHistory.length);
    console.log("Total conversations:", chats.length);
    console.log("Processing time:", Date.now() - startTime, "ms");

    console.log("=== GET CHAT HISTORY SUCCESS ===");

    return successResponse(res, 200, "Lịch sử chat đã được lấy thành công", {
      chatHistory,
      totalMessages: chatHistory.length,
      totalConversations: chats.length,
    });
  } catch (error) {
    console.error("=== GET CHAT HISTORY ERROR ===");
    console.error("Error type:", error.constructor.name);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    console.error("User ID:", req.params?.userId);
    console.error("Timestamp:", new Date().toISOString());

    return errorResponse(
      res,
      500,
      "Lỗi server khi lấy lịch sử chat",
      error.message
    );
  }
};
