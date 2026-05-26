# 阿里云 OSS 同步配置教程

## 第一步：创建 OSS Bucket

1. 打开 https://oss.console.aliyun.com/
2. 点击 **"创建 Bucket"**
3. 填写：
   - **Bucket 名称**：例如 `my-portfolio-data`（全局唯一，自己取一个）
   - **地域 Region**：选择离你最近的地域，例如 **华东1（杭州）**
   - **存储类型**：标准存储
   - **读写权限**：选择 **公共读**
4. 点击 **"确定"** 创建

> 创建完成后，记住 **Bucket 名称** 和 **Region 端点**（例如 `oss-cn-hangzhou`）。

---

## 第二步：创建 AccessKey

1. 打开 https://ram.console.aliyun.com/users
2. 点击 **"创建用户"**
3. 登录名称：例如 `portfolio-sync`，显示名称随意
4. **访问方式**：勾选 **"OpenAPI 调用访问"**（会生成 AccessKey）
5. 点击 **"确定"**
6. **重要**：创建成功后，**立即复制并保存**：
   - **AccessKey ID**
   - **AccessKey Secret**（关掉弹窗后就再也看不到了）

> 建议创建后**只授予 OSS 权限**（AliyunOSSFullAccess），不要给其他权限。

---

## 第三步：在网站中配置

1. 打开你的网站
2. 开启编辑模式（密码 `1`）
3. 点击右上角的 **💾 按钮** 打开备份弹窗
4. 在 **"阿里云 OSS 自动同步"** 区域填写：

   | 字段 | 说明 | 示例 |
   |------|------|------|
   | Bucket 名称 | 第一步中创建的 Bucket 名 | `my-portfolio-data` |
   | Region 端点 | 创建 Bucket 时选择的地域 | `oss-cn-hangzhou` |
   | AccessKey | 第二步中创建的 AK | `LTAI5t...` |
   | SecretKey | 第二步中创建的 SK | 一串密钥 |

5. 点击 **"连接"**，会自动上传 `data.json` 到 OSS

---

## 验证是否成功

- 连接后页面会显示 **"✅ 阿里云 OSS 同步已连接"**
- 右上角会短暂弹出 **"☁️ 已同步"** 提示
- 可以打开 `https://<bucket名称>.<region>.aliyuncs.com/data.json` 在浏览器中访问查看数据

---

## 常见问题

**Q: 连接时提示失败？**
A: 检查 Bucket 权限是否为 **公共读**。如果填错了 AK/SK，可以断开重新连接。

**Q: 修改数据后没有自动同步？**
A: 检查是否开启了编辑模式，数据修改后会立即同步，右上角会显示 "☁️ 已同步"。

**Q: 如何关闭同步？**
A: 在备份弹窗中点击 **"断开连接"** 即可。

**Q: 游客怎么从 OSS 读取数据？**
A: 游客打开网站时，会自动从 OSS 读取 `data.json` 并展示。不需要额外配置。
