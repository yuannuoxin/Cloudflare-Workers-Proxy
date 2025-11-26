// 核心配置（新增 Cookie 相关配置）
const CONFIG = {
    PASSWORD: "y123456", // 替换为你的强密码（如：CGL@2025!）
    D1_TABLE: "cgl_access_control",   // D1 数据库表名
    DEFAULT_EXPIRY_MINUTES: 5,        // 默认过期时间：5分钟
    EXPIRY_OPTIONS: [5, 15, 30, 60, 360, 1440], // 快捷过期选项（分钟）
    // Cookie 配置
    COOKIE_NAME: "cgl_token",    // 更改Cookie名称以避免与Cloudflare自动添加的token冲突
    COOKIE_SECRET: "your_cookie_secret_" + Math.random().toString(36).substring(2, 15), // 加密密钥（随机生成）
    HEADER_AUTH_KEY: "x-cgl-password" // 自定义请求头名称（用于通过请求头传密码）
};

// 密码验证表单（不变）
const PASSWORD_FORM = (error = '') => `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CGL - 访问验证</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    body { background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%); min-height: 100vh; display: flex; justify-content: center; align-items: center; padding: 20px; }
    .cgl-card { background: white; border-radius: 16px; box-shadow: 0 10px 40px rgba(0,0,0,0.12); width: 100%; max-width: 420px; padding: 3rem 2rem; position: relative; overflow: hidden; }
    .cgl-card::before { content: ''; position: absolute; top: 0; left: 0; width: 100%; height: 6px; background: linear-gradient(90deg, #2563eb, #6366f1); }
    .cgl-logo { text-align: center; margin-bottom: 2.5rem; }
    .cgl-logo svg { width: 72px; height: 72px; margin: 0 auto; fill: #2563eb; }
    h3 { color: #1e293b; font-size: 1.5rem; font-weight: 600; text-align: center; margin-bottom: 2rem; }
    .cgl-form-group { margin-bottom: 1.8rem; }
    label { display: block; color: #475569; font-size: 1rem; margin-bottom: 0.8rem; font-weight: 500; }
    input[type="password"], select, input[type="number"] {
      width: 100%; padding: 1.1rem; border: 1px solid #e2e8f0; border-radius: 12px;
      font-size: 1.05rem; transition: all 0.3s ease; background: #f8fafc;
    }
    input[type="password"]:focus, select:focus, input[type="number"]:focus {
      outline: none; border-color: #2563eb; box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.15); background: white;
    }
    .cgl-custom-expiry { margin-top: 1rem; }
    button {
      width: 100%; padding: 1.1rem; background: #2563eb; color: white; border: none;
      border-radius: 12px; font-size: 1.1rem; font-weight: 600; cursor: pointer;
      transition: all 0.3s ease; margin-top: 1.5rem; display: flex; align-items: center; justify-content: center; gap: 8px;
    }
    button:hover { background: #1d4ed8; transform: translateY(-2px); }
    button:active { transform: translateY(0); }
    .cgl-error { color: #dc2626; font-size: 0.95rem; text-align: center; margin-top: 1.2rem; height: 1.4rem; line-height: 1.4; }
    .cgl-tip { color: #94a3b8; font-size: 0.9rem; text-align: center; margin-top: 1.2rem; }
  </style>
</head>
<body>
  <div class="cgl-card">
    <div class="cgl-logo">
      <svg viewBox="0 0 24 24">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
      </svg>
    </div>
    <h3>🔒 Cloudflare Guard Lock</h3>
    <form method="POST">
      <div class="cgl-form-group">
        <label for="password">访问密码</label>
        <input type="password" id="password" name="password" placeholder="请输入访问密码" required autocomplete="off">
      </div>
      <div class="cgl-form-group">
        <label for="expiry">过期时间</label>
        <select id="expiry" name="expiry" onchange="toggleCustomExpiry()">
          <option value="${CONFIG.DEFAULT_EXPIRY_MINUTES}" selected>默认：${CONFIG.DEFAULT_EXPIRY_MINUTES}分钟</option>
          ${CONFIG.EXPIRY_OPTIONS.filter(min => min !== CONFIG.DEFAULT_EXPIRY_MINUTES)
    .map(min => `<option value="${min}">${min}分钟${min >= 60 ? `（${min / 60}小时）` : ''}</option>`)
    .join('')}
          <option value="custom">自定义分钟</option>
        </select>
        <div id="customExpiryBox" class="cgl-custom-expiry" style="display: none;">
          <input type="number" name="customExpiry" placeholder="最小1分钟" min="1" value="5">
        </div>
      </div>
      <button type="submit">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M5 12h14"></path>
          <path d="m12 5 7 7-7 7"></path>
        </svg>
        验证并访问
      </button>
      <div class="cgl-error">${error || '&nbsp;'}</div>
      <div class="cgl-tip">有效期内所有用户访问该域名无需重复验证（Cookie 自动保存，已加密）</div>
    </form>
  </div>
  <script>
    function toggleCustomExpiry() {
      const select = document.getElementById('expiry');
      const box = document.getElementById('customExpiryBox');
      box.style.display = select.value === 'custom' ? 'block' : 'none';
    }
  </script>
</body>
</html>
`;

// 工具函数：加密 Cookie 内容（避免明文存储密码）
function encryptCookie(value, secret) {
    // 简单异或加密（生产环境可替换为更复杂的加密方式）
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    const valueBytes = encoder.encode(value);
    const secretBytes = encoder.encode(secret);
    const encryptedBytes = valueBytes.map((byte, i) => byte ^ secretBytes[i % secretBytes.length]);
    return btoa(String.fromCharCode(...encryptedBytes));
}

// 工具函数：解密 Cookie 内容
function decryptCookie(encryptedValue, secret) {
    try {
        const encoder = new TextEncoder();
        const decoder = new TextDecoder();
        const encryptedBytes = new Uint8Array(atob(encryptedValue).split('').map(c => c.charCodeAt(0)));
        const secretBytes = encoder.encode(secret);
        const decryptedBytes = encryptedBytes.map((byte, i) => byte ^ secretBytes[i % secretBytes.length]);
        return decoder.decode(decryptedBytes);
    } catch (e) {
        return null;
    }
}

// 工具函数：从 Cookie 中获取指定字段
function getCookieFromHeaders(headers, cookieName) {
    const cookieHeader = headers.get('Cookie') || '';
    // 使用更标准的方式查找特定Cookie
    const cookies = cookieHeader.split(';');
    for (const cookie of cookies) {
        const [name, value] = cookie.trim().split('=');
        if (name === cookieName) {
            const decodedValue = decodeURIComponent(value || '');
            return decodedValue;
        }
    }
    return null;
}

// 无入侵注入有效期提示（不变）
async function injectExpiryNotice(originalResponse, remainingMinutes) {
    try {
        const contentType = originalResponse.headers.get("Content-Type") || "";
        if (contentType.includes("text/html") && originalResponse.ok) {
            const originalHtml = await originalResponse.text();
            const expiryNotice = `
        <div style="position: fixed; top: 0; left: 0; right: 0; background: #2563eb; color: white;
        padding: 8px 0; text-align: center; font-size: 0.9rem; z-index: 99999; margin: 0; border: none;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          🔒 CGL - 访问有效期剩余：${remainingMinutes} 分钟（Cookie 已保存，无需重复验证）
        </div>
      `;
            return new Response(
                originalHtml.includes("</head>")
                    ? originalHtml.replace("</head>", `${expiryNotice}</head>`)
                    : originalHtml.replace("<body", `${expiryNotice}<body`),
                {
                    status: originalResponse.status,
                    statusText: originalResponse.statusText,
                    headers: originalResponse.headers
                }
            );
        }
    } catch (e) {
        console.error("CGL 提示注入失败：", e.message);
    }
    return originalResponse;
}

// 核心验证逻辑（新增 Cookie/请求头验证跳过逻辑）
export async function handleAuth(params) {
    const {request, env, ctx, originalLogic, next} = params;
    const now = Date.now();
    const url = new URL(request.url);
    const hostname = url.hostname;

    // 检查是否是请求头调试接口
    if (url.pathname === '/debug/headers') {
        const headersObj = {};
        for (const [key, value] of request.headers.entries()) {
            headersObj[key] = value;
        }
        return new Response(JSON.stringify({
            url: request.url,
            method: request.method,
            headers: headersObj,
            cookie1: request.headers.get('Cookie') || '',
            cookie2: getCookieFromHeaders(request.headers, CONFIG.COOKIE_NAME),
            cookie3: request.headers.get('cookie') || '',
        }, null, 2), {
            headers: {
                'Content-Type': 'application/json;charset=utf-8'
            }
        });
    }

    // 打印所有请求头
    // console.log("=== 所有请求头 ===");
    // for (const [key, value] of request.headers.entries()) {
    //     console.log(`${key}: ${value}`);
    // }
    // console.log("=================");

    // -------------------------- 新增：Cookie/请求头验证跳过逻辑 --------------------------
    let skipAuth = false;
    let remainingMinutes = 0;

    // 1. 检查请求头是否包含密码（优先于 Cookie，方便接口调用）
    const headerPassword = request.headers.get(CONFIG.HEADER_AUTH_KEY);
    if (headerPassword === CONFIG.PASSWORD) {
        skipAuth = true;
        remainingMinutes = CONFIG.DEFAULT_EXPIRY_MINUTES; // 默认为默认过期时间
    }

    // 2. 检查 Cookie 是否包含有效密码（若请求头未匹配）
    if (!skipAuth) {
        // 使用加密方式存储密码到Cookie中
        const cookieValue = getCookieFromHeaders(request.headers, CONFIG.COOKIE_NAME);
        if (cookieValue) {
            // 解密 Cookie 值
            const decryptedPassword = decryptCookie(cookieValue, CONFIG.COOKIE_SECRET);
            if (decryptedPassword === CONFIG.PASSWORD) {
                skipAuth = true;
            }
        }
    }

    // 跳过验证：直接执行原逻辑并注入提示
    if (skipAuth) {
        let originalResponse;
        // 移除修改后的headers参数，直接使用原始request
        if (originalLogic) originalResponse = await originalLogic(request, env, ctx);
        else if (next) originalResponse = await next();
        else return new Response("验证通过，但未配置原逻辑", {status: 500});
        // 注入有效期提示
        return originalResponse;
    }
    // -------------------------- Cookie/请求头跳过逻辑结束 --------------------------

    // 1. D1 数据库初始化（不变）
    let db = null;
    try {
        db = env?.ACCESS_DB || (typeof ACCESS_DB !== "undefined" ? ACCESS_DB : null);
        if (!db) throw new Error("D1 数据库未绑定！绑定名称必须为 ACCESS_DB");
    } catch (e) {
        console.error("CGL 数据库初始化失败：", e.message);
        if (originalLogic) return originalLogic(request, env, ctx);
        if (next) return next();
        return new Response("CGL 验证服务异常", {status: 500});
    }

    // 2. 查询未过期的验证记录（不变）
    let dbResult = null;
    try {
        const results = await db.prepare(`
            SELECT valid_until
            FROM ${CONFIG.D1_TABLE}
            WHERE hostname = ?
              AND valid_until > ?
            ORDER BY created_at DESC LIMIT 1
        `).bind(hostname, now).all();
        dbResult = results.results.length > 0 ? results.results[0] : null;
    } catch (e) {
        console.error("CGL 数据库查询失败：", e.message);
        if (originalLogic) return originalLogic(request, env, ctx);
        if (next) return next();
        return new Response("CGL 验证服务异常", {status: 500});
    }

    // 3. 验证通过：执行原项目逻辑（不变）
    if (dbResult?.valid_until) {
        let originalResponse;
        if (originalLogic) originalResponse = await originalLogic(request, env, ctx);
        else if (next) originalResponse = await next();
        else return new Response("验证通过，但未配置原逻辑", {status: 500});

        // const remainingMinutes = Math.ceil((dbResult.valid_until - now) / 60000);
        return originalResponse;
    }

    // 4. 处理密码提交（POST 请求，新增 Cookie 写入）
    if (request.method === "POST") {
        try {
            const formData = await request.formData();
            const inputPwd = formData.get("password");
            const selectedExpiry = formData.get("expiry");

            // 解析过期时间（不变）
            let expiryMinutes = CONFIG.DEFAULT_EXPIRY_MINUTES;
            if (selectedExpiry === "custom") {
                expiryMinutes = Math.max(1, parseInt(formData.get("customExpiry") || CONFIG.DEFAULT_EXPIRY_MINUTES));
            } else if (selectedExpiry) {
                expiryMinutes = parseInt(selectedExpiry) || CONFIG.DEFAULT_EXPIRY_MINUTES;
            }

            // 密码验证（新增 Cookie 写入）
            if (inputPwd === CONFIG.PASSWORD) {
                const expiryTime = now + expiryMinutes * 60 * 1000;
                // 写入数据库（不变）
                await db.prepare(`
                    INSERT INTO ${CONFIG.D1_TABLE} (hostname, valid_until, created_at, ip_address, user_agent)
                    VALUES (?, ?, CURRENT_TIMESTAMP, ?, ?)
                `).bind(
                    hostname,
                    expiryTime,
                    request.headers.get("CF-Connecting-IP") || "unknown",
                    request.headers.get("User-Agent") || "unknown"
                ).run();

                // 加密密码并存储到Cookie中
                const encryptedPassword = encryptCookie(CONFIG.PASSWORD, CONFIG.COOKIE_SECRET);
                // console.log(`[CGL DEBUG] Encrypted password: ${encryptedPassword}`)
                const cookieExpiry = new Date(expiryTime).toUTCString();

                // 修改Cookie设置，移除Secure标志以适应HTTP环境，或者根据实际情况动态设置
                const isHttps = url.protocol === 'https:';
                const cookie = `${CONFIG.COOKIE_NAME}=${encodeURIComponent(encryptedPassword)}; Path=/; Expires=${cookieExpiry}; HttpOnly; SameSite=Lax` +
                    (isHttps ? '; Secure' : '');
                // console.log(`[CGL DEBUG] Setting cookie: ${cookie}`); // 添加调试日志

                // 重定向并设置 Cookie（使用构造函数方式添加headers）
                const response = new Response(null, {
                    status: 302,
                    headers: {
                        'Location': url.toString(),
                        'Set-Cookie': cookie
                    }
                });
                return response;
            } else {
                return new Response(PASSWORD_FORM("密码错误，请重新输入"), {
                    headers: {"Content-Type": "text/html; charset=utf-8"}
                });
            }
        } catch (e) {
            console.error("CGL 密码处理失败：", e.message);
            return new Response(PASSWORD_FORM("服务器异常，请稍后重试"), {
                headers: {"Content-Type": "text/html; charset=utf-8"}
            });
        }
    }

    // 5. 未验证：返回登录表单（不变）
    return new Response(PASSWORD_FORM(), {
        headers: {"Content-Type": "text/html; charset=utf-8"}
    });
}