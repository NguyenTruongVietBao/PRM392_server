# Chat API Documentation - Phiên bản đơn giản

## Tổng quan

Chat API đơn giản cho phép người dùng tương tác với AI thông qua OpenAI/GPT-4. Hệ thống lưu trữ lịch sử chat theo userId và có khả năng nhớ context.

## Endpoints

### 1. Gửi tin nhắn chat

```
POST /api/chat/send
```

**Request Body:**

```json
{
  "message": "Xin chào AI",
  "userId": "user_id_here"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Chat thành công",
  "data": {
    "message": "Xin chào AI",
    "response": "Xin chào! Tôi có thể giúp gì cho bạn?",
    "chatId": "chat_id_here"
  }
}
```

### 2. Lấy lịch sử chat theo userId

```
GET /api/chat/history/:userId
```

**Response:**

```json
{
  "success": true,
  "message": "Lịch sử chat đã được lấy thành công",
  "data": {
    "chatHistory": [
      {
        "id": "chat_id_user",
        "role": "user",
        "content": "Xin chào AI",
        "timestamp": "2024-01-01T00:00:00.000Z",
        "user": {
          "_id": "user_id",
          "name": "Tên user",
          "email": "user@email.com"
        }
      },
      {
        "id": "chat_id_assistant",
        "role": "assistant",
        "content": "Xin chào! Tôi có thể giúp gì cho bạn?",
        "timestamp": "2024-01-01T00:00:00.000Z",
        "user": null
      }
    ],
    "totalMessages": 2,
    "totalConversations": 1
  }
}
```

## Database Schema

### Chat Model

```javascript
{
  user: ObjectId,         // ID của user
  message: String,        // Tin nhắn của user
  response: String,       // Phản hồi từ AI
  createdAt: Date,       // Thời gian tạo
  updatedAt: Date        // Thời gian cập nhật
}
```

## Cách sử dụng

### 1. Frontend Integration (JavaScript)

```javascript
// Gửi tin nhắn
async function sendMessage(message, userId) {
  const response = await fetch('/api/chat/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message,
      userId,
    }),
  });

  return await response.json();
}

// Lấy lịch sử chat
async function getChatHistory(userId) {
  const response = await fetch(`/api/chat/history/${userId}`);
  return await response.json();
}
```

### 2. Context Management

- Hệ thống tự động lưu context của 5 tin nhắn gần nhất
- Mỗi tin nhắn mới sẽ được gửi kèm context để AI hiểu ngữ cảnh

### 3. Authentication

- API sử dụng `userId` từ request body
- Nên tích hợp middleware authentication để bảo mật

## Test API

Bạn có thể test API bằng curl:

```bash
# Gửi tin nhắn
curl -X POST http://localhost:8080/api/chat/send \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Xin chào AI",
    "userId": "test_user_id"
  }'

# Lấy lịch sử chat
curl http://localhost:8080/api/chat/history/test_user_id
```

## Tính năng

✅ Chat đơn giản với AI  
✅ Lưu lịch sử chat vào MongoDB  
✅ Context-aware (nhớ 5 tin nhắn gần nhất)  
✅ Format lịch sử phân tách role user/assistant cho FE  
✅ API đơn giản, dễ sử dụng

## Lưu ý

1. **Rate Limiting**: Nên thêm rate limiting để tránh spam
2. **Error Handling**: Xử lý lỗi khi API OpenAI không khả dụng
3. **Security**: Bảo mật API key và thêm authentication
4. **Content Filtering**: Thêm filter cho nội dung không phù hợp
