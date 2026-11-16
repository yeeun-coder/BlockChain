# TestEther

학번과 Ethereum 주소를 입력하면 **0.1 Sepolia ETH**를 보내 주는 강의용 예제입니다.
HTML 1개와 서버 JavaScript 1개로 viem 송금 흐름을 보여 줍니다.

| 파일 | 역할 |
|---|---|
| `public/index.html` | 입력 화면, 서버 요청(fetch), 결과 표시 |
| `api/send.js` | 학번·주소 확인, viem으로 송금, 처리 중 표시 |
| `local-server.js` | Vercel 없이 내 PC에서 실행하는 서버 (`npm start`) |

그 밖의 파일: `package.json`, `vercel.json`(공개 폴더 `public`, 함수 최대 60초), `.env.example`, `StudentID.example.csv`, `.gitignore`, `.vercelignore`

## 1. Node.js 24 준비 (기존 Node를 바꾸지 않는 방법)

이 프로젝트 전용 Node.js를 프로젝트 안 `node24` 폴더에 둡니다. `node24`는 Git과 Vercel 업로드에서 제외되어 있습니다.

1. <https://nodejs.org/dist/latest-v24.x/> 에서 `node-v24.x.x-win-x64.zip`을 받아 풀고, 풀린 폴더 이름을 `node24`로 바꿔 프로젝트 폴더 안에 둡니다. (`node24\node.exe`가 있으면 됩니다)
2. 프로젝트 폴더에서 연 PowerShell 창에서만 PATH 앞에 추가합니다. 창을 닫으면 원래대로 돌아갑니다.

   ```powershell
   $env:Path = "$PWD\node24;" + $env:Path
   node -v
   ```

   macOS/Linux는 `tar.xz`를 같은 방식으로 `node24`에 풀고 `export PATH="$PWD/node24/bin:$PATH"`를 사용합니다.
3. 같은 창에서 `npm install`을 실행합니다. 아래의 `npx vercel` 명령도 이 창에서 실행합니다.

## 2. 로컬 실행 (Vercel 없이)

1. `.env.example`을 `.env`로 복사하고 `PRIVATE_KEY`(`0x` + 64자리 16진수)와 `SEPOLIA_RPC_URL`을 직접 입력합니다. 개인키는 Sepolia ETH가 있는 실습 계정의 것만 사용하세요.
2. 프로젝트 폴더에 `StudentID.csv`를 만들고 한 줄에 학번 하나씩 적습니다. 형식은 `StudentID.example.csv`를 참고하세요. 예시의 가상 학번을 복사해 넣으면 그 학번도 유효해집니다.
3. 지급 지갑 주소를 `.env` 개인키의 주소로 바꿉니다. 그대로 두면 "개인키가 지급 지갑과 다릅니다"가 나오고 송금하지 않습니다.
   - `api/send.js`의 `FAUCET_ADDRESS`
   - `public/index.html`의 `FAUCET_HISTORY` (결과를 모를 때 보여 줄 거래 내역 링크)
4. 실행합니다.

   ```powershell
   Copy-Item .env.example .env
   Copy-Item StudentID.example.csv StudentID.csv
   npm start
   ```

5. 브라우저에서 <http://localhost:3000> 을 엽니다.

- `npm start`는 `node --env-file=.env local-server.js`입니다. `local-server.js`가 `public/index.html`을 보여 주고 `POST /api/send`를 `api/send.js`에 넘깁니다.
- `.env`를 고치면 Ctrl + C로 끄고 다시 실행합니다.
- 개인키가 있는 서버이므로 내 PC(127.0.0.1)에서만 접속됩니다.

### Vercel CLI로 로컬 실행 (선택)

Vercel 배포와 같은 방식으로 실행하려면 Vercel CLI를 씁니다. 처음 한 번은 Vercel 계정 로그인과 프로젝트 연결이 필요합니다.

```powershell
npx vercel login
npx vercel link
npx vercel dev
```

- `vercel dev`는 로컬 설정을 `.env`에서 읽습니다. `.env.local`은 읽지 않습니다.
- `npx vercel`만 입력하면 개발 실행이 아니라 **배포**가 시작되니 주의하세요.

## 3. Vercel 배포

1. GitHub 저장소를 Vercel 프로젝트에 연결합니다.
2. 프로젝트 Settings → Environment Variables에 아래 값을 **Production** 환경으로 등록합니다.

   | 이름 | 값 |
   |---|---|
   | `PRIVATE_KEY` | 지급 지갑 개인키 (Preview에는 등록하지 않음) |
   | `SEPOLIA_RPC_URL` | Sepolia RPC URL |
   | `STUDENT_IDS_CSV` | 학번 목록, 한 줄에 하나 |

3. 환경변수를 바꾸면 **재배포해야** 반영됩니다.

- Preview 배포에는 개인키가 없어서 "서버 설정 오류"가 나오고 송금하지 않습니다.
- 배포 환경에서 `STUDENT_IDS_CSV`가 없거나 비어 있으면 "학번 목록 미설정"이 나옵니다.
- 실제 `StudentID.csv`와 `.env`는 Git과 Vercel 업로드에서 제외되어 있습니다.

## 결과 메시지

- **보냈습니다**: 영수증까지 확인한 성공
- **포함됐지만 실패**: 블록에는 들어갔지만 거래가 실패
- **전송 제출됨, 확정 여부 확인 필요**: 거래 해시는 받았지만 30초 안에 확정되지 않음 (나중에 확정될 수 있음)
- **결과 확인 불가**: 해시나 응답을 받지 못함. 보내졌을 수도 있으니 지급 지갑의 거래 내역을 확인

## 한계 (학생 개선 과제)

- "처리 중" 표시는 같은 서버 인스턴스 안에서만 유효합니다. Vercel이 인스턴스를 여러 개 띄우거나 `vercel dev`처럼 요청마다 프로세스가 새로 뜨면 공유되지 않아 nonce가 충돌할 수 있습니다.
- 처리 중 표시가 풀린 뒤에도 이전 거래가 아직 대기 중일 수 있습니다.
- 학번 확인은 본인 인증이 아닙니다. 학번을 아는 사람은 반복 요청으로 잔액을 소진할 수 있습니다.
- 신청 저장, 중복 지급 방지, 요청 속도 제한, 자동 재시도는 없습니다.
