// 내 PC에서 Vercel 없이 실행하는 서버 (실행: npm start)
//
// Vercel이 해 주던 두 가지를 직접 합니다.
//   GET  /          → public/index.html 보여 주기
//   POST /api/send  → api/send.js의 handler 실행
// 개인키가 있는 서버이므로 내 PC(127.0.0.1)에서만 접속할 수 있게 엽니다.

import fs from 'node:fs';
import http from 'node:http';
import handler from './api/send.js';

const PORT = 3000;

const server = http.createServer(async (req, res) => {
  if (req.method === 'GET' && (req.url === '/' || req.url === '/index.html')) {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    return res.end(fs.readFileSync('public/index.html'));
  }

  if (req.url === '/api/send') {
    // Vercel 함수와 같은 모양으로 맞춥니다: req.body(JSON), res.status(...).json(...)
    let text = '';
    for await (const chunk of req) text += chunk;
    try {
      req.body = text ? JSON.parse(text) : {};
    } catch {
      req.body = {};
    }
    res.status = (code) => {
      res.statusCode = code;
      return res;
    };
    res.json = (data) => {
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify(data));
      return res;
    };
    return handler(req, res);
  }

  res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('Not Found');
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`TestEther: http://localhost:${PORT}`);
});
