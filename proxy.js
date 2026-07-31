// 人生模拟 · Hy3 版 —— 本地代理（兼静态服务器）
//
// 为什么需要它：
//   腾讯云 TokenHub 的 /chat/completions 接口**不响应浏览器的 CORS 预检（OPTIONS 返回 405）**，
//   导致网页里直接 fetch 会被浏览器拦截（即使 Key 和地址都对也"跑不了"）。
//   本程序在本地起一个服务：① 托管游戏页面（同源，彻底无 CORS 问题）；
//   ② 把 /v1/* 的请求转发到 TokenHub（服务端转发，不受浏览器 CORS 限制）。
//   你的 Key 仍只在浏览器里（localStorage）产生，由浏览器发给本机代理，代理再转发给 TokenHub。
//
// 用法（只需两步）：
//   1) 在本文件所在目录执行：   node proxy.js
//   2) 浏览器打开：             http://localhost:8787
//      页面里点 ⚙ → 粘贴你的 TokenHub Key → 点「测试连接」→ 看到 ✅ 即可开玩。
//
// 进阶：若想让代理自带 Key（不想在页面填），可设环境变量后启动：
//   HY3_API_KEY=sk-xxx node proxy.js
// 此时页面里 Key 留空也能用（代理会注入环境变量里的 Key）。
//
// 默认端口 8787，可用 PORT 环境变量覆盖。

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 8787;
const UP_HOST = 'tokenhub.tencentmaas.com';   // TokenHub 上游主机
const ENV_KEY = process.env.HY3_API_KEY || ''; // 可选：代理自带 Key
const ROOT = __dirname;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
  const u = url.parse(req.url, true);

  // 允许跨域（同源自用，跨域也放行，方便灵活部署）
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');

  // 预检：直接放行（避免任何 OPTIONS 被拦）
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  // [WorkBuddy 协作] 为绕过 TokenHub CORS 预检(OPTIONS 405)而设计：将 /v1/* 中继到 TokenHub
  // —— API 转发：把 /v1/* 中继到 TokenHub ——
  if (req.method === 'POST' && u.pathname.startsWith('/v1/')) {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
      // Key 优先用环境变量（若设了），否则透传浏览器发来的 Authorization
      const auth = ENV_KEY ? ('Bearer ' + ENV_KEY)
                           : (req.headers['authorization'] || '');
      const r = https.request({
        hostname: UP_HOST,
        path: u.pathname + (u.search || ''),
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': auth }
      }, resp => {
        let d = '';
        resp.on('data', c => d += c);
        resp.on('end', () => {
          res.writeHead(resp.statusCode, { 'Content-Type': resp.headers['content-type'] || 'application/json' });
          res.end(d);
        });
      });
      r.on('error', e => {
        res.writeHead(502);
        res.end(JSON.stringify({ error: String(e) }));
      });
      r.write(body);
      r.end();
    });
    return;
  }

  // —— 静态文件托管 ——
  let rel = u.pathname === '/' ? '/index.html' : u.pathname;
  const fp = path.join(ROOT, rel);
  if (!fp.startsWith(ROOT)) { res.writeHead(403); res.end('forbidden'); return; }
  fs.readFile(fp, (err, data) => {
    if (err) { res.writeHead(404); res.end('not found: ' + rel); return; }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(fp)] || 'application/octet-stream' });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log('[OK] 人生模拟 · Hy3 代理已启动');
  console.log('     打开游戏： http://localhost:' + PORT);
  console.log('     转发目标： https://' + UP_HOST + '/v1/chat/completions');
  if (!ENV_KEY) console.log('     ⚠️ 未在环境变量设置 HY3_API_KEY，请在游戏页面 ⚙ 里填写你的 TokenHub Key');
});
