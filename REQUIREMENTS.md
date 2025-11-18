# TH-Research 开发需求文档

## 项目概述

TH-Research 是一个 AI 生成的 HTML 报告存放与分享平台。

**项目位置**: `/Users/angelchang3/TH-Research`

## 已完成的部分 ✅

### 后端 (server.js)
- Express.js 服务器框架
- 8 个完整的 API 端点
- 密码认证中间件
- Supabase 集成（Storage + Database）
- 文件上传处理（Multer）
- 错误处理

### 前端 (public/)
- **index.html** - 首页（展示功能介绍）
- **manage.html** - 管理界面
  - 密码登入
  - HTML 文件上传
  - 报告列表显示
  - 报告操作（复制链接、停用、置换、删除）

### 配置文件
- package.json（所有依赖已配置）
- .env.example（环境变量模板）
- .gitignore
- SETUP.md（详细配置指南）
- README.md（项目说明）

## 当前代码情况

### API 端点实现完整度：100% ✅
- POST /api/upload - 上传文件
- GET /api/reports - 获取报告列表
- GET /reports/:reportId - 查看报告
- DELETE /api/reports/:reportId - 删除报告
- PATCH /api/reports/:reportId/disable - 停用报告
- POST /api/reports/:reportId/replace - 置换报告

### 管理界面功能完整度：80%
- ✅ 密码认证
- ✅ 文件上传
- ✅ 报告列表显示
- ✅ 复制链接
- ✅ 停用/置换/删除操作
- ❓ 可继续改进的地方

## 可选的改进功能

### 优先级 HIGH - 推荐实现

1. **报告搜索和过滤**
   - 按文件名搜索
   - 按状态过滤（活跃/已停用）
   - 按日期排序（升序/降序）
   - 实时搜索反馈

2. **更好的上传体验**
   - 上传进度条显示
   - 拖拽上传支持
   - 上传失败重试机制
   - 上传前文件大小检查

3. **UI/UX 改进**
   - 报告卡片展示（比表格更现代）
   - 批量操作功能
   - 确认对话框优化
   - 加载骨架屏

### 优先级 MEDIUM - 可选实现

4. **报告管理功能**
   - 为报告添加描述/备注
   - 为报告添加标签分类
   - 批量导出报告元数据
   - 最近访问记录

5. **性能优化**
   - 虚拟滚动（大量报告时）
   - 图片缩略图预览
   - 本地缓存优化

6. **安全性增强**
   - 为公开链接添加过期时间选项
   - 添加访问日志
   - IP 限制选项

### 优先级 LOW - 扩展功能

7. **高级功能**
   - 多用户支持
   - 报告分享权限控制
   - API 密钥管理
   - 统计数据展示

## 当前的技术约束

- **前端**: 纯 HTML/CSS/JavaScript（无框架）
- **后端**: Express.js + Node.js
- **数据库**: Supabase PostgreSQL
- **存储**: Supabase Storage
- **认证**: 简单密码认证（header 传递）

## 开发指南

### 代码风格
- 遵循现有代码风格
- 使用 ES6+ 语法
- 添加清晰的注释
- 函数/变量命名使用驼峰式

### 文件修改原则
- **server.js** - 后端 API 逻辑
- **public/manage.html** - 管理界面（HTML/CSS/JavaScript）
- **public/index.html** - 首页内容
- 不修改已有 API 的函数签名
- 新增功能通过新增 API 端点或前端交互实现

### 测试方法
1. 运行 `npm start`
2. 访问 `http://localhost:3000`
3. 在浏览器中测试新功能
4. 检查浏览器控制台是否有错误

## 我的建议 💡

如果你第一次开发这个项目，我建议按以下优先级实现：

1. **第一步**: 报告搜索和过滤（相对简单，提升体验最大）
2. **第二步**: 上传进度条 + 拖拽上传（改进用户体验）
3. **第三步**: UI 改进（卡片式展示）
4. **后续**: 其他高优先级功能

## 如何提交需求给 Claude Code

复制以下模板，告诉 Claude Code 你想要什么：

```
基于 REQUIREMENTS.md 文档，我要在 TH-Research 项目中实现以下功能：

1. [具体功能描述]
   - 相关文件: server.js / public/manage.html
   - 预期效果: [描述预期行为]

2. [另一个功能]
   ...

请帮我完成这些功能，确保与现有代码兼容。
```

## 注意事项 ⚠️

- 不要修改项目结构，保持现有布局
- 新增的 npm 包需要写入 package.json
- 确保代码在本地测试通过
- 保持后端 API 的稳定性
- 前端要保持响应式设计

---

**准备好了吗？告诉我你想要 Claude Code 实现哪个功能！**
