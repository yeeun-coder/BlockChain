// 웹 페이지를 브라우저에서 열기 위한 간단한 웹 서버
//   node scripts/serve.js   →   http://localhost:3000
// (MetaMask 는 file:// 로 연 페이지에서는 동작하지 않으므로 http 로 엽니다)
import http from "node:http";
import fs from "node:fs";
import path from "node:path";

const PORT = 3000;
const ROOT = process.cwd();                       // 프로젝트 폴더 (hardhat-test)
const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".json": "application/json",
                ".css": "text/css", ".map": "application/json", ".svg": "image/svg+xml", ".png": "image/png" };
// 웹 페이지가 읽을 수 있는 폴더만 허용 (개인 키 등 다른 파일은 보내지 않음)
const ALLOWED = ["/web/", "/node_modules/ethers/dist/", "/ignition/deployments/", "/artifacts/contracts/"];

http.createServer((req, res) => {
  let url = decodeURIComponent(req.url.split("?")[0]);
  if (url === "/") url = "/web/index.html";
  const file = path.join(ROOT, url);
  if (!ALLOWED.some((p) => url.startsWith(p)) || !file.startsWith(ROOT) ||
      !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    res.writeHead(404); res.end("Not found"); return;
  }
  res.writeHead(200, { "Content-Type": TYPES[path.extname(file)] ?? "application/octet-stream",
                       "Cache-Control": "no-store" });
  fs.createReadStream(file).pipe(res);
}).listen(PORT, "127.0.0.1", () => {
  console.log(`웹 페이지: http://localhost:${PORT}   (끝내려면 Ctrl + C)`);
});
