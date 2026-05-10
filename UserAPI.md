### 认证接口

#### POST /api/auth/verify-invite — 验证邀请码

**认证：** 无

```json
// 请求
{ "invite_code": "ABC12345" }

// 响应
{ "valid": true, "message": "邀请码有效" }
```

#### POST /api/auth/register — 注册

**认证：** 无  
**说明：** 必须先持有有效邀请码，注册成功后返回 JWT Token。

```json
// 请求
{
    "invite_code": "ABC12345",
    "username": "张三",
    "password": "password123",
    "confirm_password": "password123",
    "exam_region": "全国I卷",
    "grade": "高三",
    "school": "示范高中"
}

// 响应 (201)
{
    "user_id": "uuid-xxxx",
    "username": "张三",
    "access_token": "eyJ...",
    "token_type": "bearer"
}
```

**密码规则：** 8–20 位，两次输入须一致。

#### POST /api/auth/login — 登录

**认证：** 无  
**说明：** 使用用户名（或手机号/邮箱）与密码登录，返回 JWT Token。

```json
// 请求
{
    "login_id": "张三",
    "password": "password123"
}

// 响应 (200)
{
    "user_id": "uuid-xxxx",
    "username": "张三",
    "access_token": "eyJ...",
    "token_type": "bearer"
}
```

#### POST /api/auth/logout — 登出

**认证：** 无（客户端清除 Token 即可）

#### POST /api/auth/refresh — 刷新 Token

**认证：** ✅ Bearer Token

```json
// 响应
{ "access_token": "eyJ...", "token_type": "bearer" }
```

---

### 用户信息接口

所有接口需要在 Header 中携带：`Authorization: Bearer <token>`

#### GET /api/users/me — 获取当前用户信息

```json
{
    "id": "uuid-xxxx",
    "username": "张三",
    "exam_region": "全国I卷",
    "grade": "高三",
    "school": "示范高中",
    "role": "user",
    "status": "active",
    "created_at": "2024-04-04T00:00:00",
    "last_login_at": "2024-04-04T12:00:00"
}
```

#### PUT /api/users/me — 更新用户信息

可修改字段：`username`、`exam_region`、`grade`、`school`

#### PUT /api/users/password — 修改密码

**认证：** ✅ Bearer Token

```json
// 请求
{
    "old_password": "oldPass12",
    "new_password": "newPass12",
    "confirm_password": "newPass12"
}

// 响应
{ "message": "密码修改成功，请重新登录" }
```

#### GET /api/users/stats — 获取用户统计

```json
{
    "user_id": "uuid-xxxx",
    "mistake_count": 15,
    "due_for_review": 3,
    "latest_power": 85.5,
    "power_records": 12
}
```
