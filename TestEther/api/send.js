// TestEther 송금 API (Vercel 함수: POST /api/send)
//
// 흐름: 1) 요청 확인 → 2) 처리 중 확인 → 3) 송금 제출 → 4) 영수증 대기 → 5) 처리 중 해제
//
// 개인키는 이 서버 코드에서만 환경변수로 읽습니다.
// HTML(브라우저)에 넣으면 누구나 개발자 도구로 개인키를 볼 수 있기 때문입니다.

import fs from 'node:fs';
import path from 'node:path';
import { createPublicClient, createWalletClient, http, isAddress, isAddressEqual, parseEther } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { sepolia } from 'viem/chains';

// 서버에서 고정하는 값 (학생이 바꿀 수 없음)
const FAUCET_ADDRESS = '0x3d4898C971777cdD50edcEA774c0664a1B344EbB'; // 지급 지갑
const AMOUNT = parseEther('0.1'); // 0.1 Sepolia ETH
const EXPLORER = 'https://sepolia.etherscan.io';

export default async function handler(req, res) {
  // ── 1. 요청 확인: 학번, 주소, 서버 설정 ──
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'POST 요청만 받습니다.' });
  }

  const studentId = String(req.body?.studentId ?? '').trim();
  const address = String(req.body?.address ?? '').trim();

  const studentIds = loadStudentIds();
  if (studentIds.length === 0) {
    return res.status(500).json({ message: '학번 목록 미설정' });
  }
  if (!studentIds.includes(studentId)) {
    return res.status(400).json({ message: '등록된 학번이 아닙니다.' });
  }
  if (!isAddress(address)) {
    return res.status(400).json({ message: 'Ethereum 주소 형식이 올바르지 않습니다.' });
  }

  const privateKey = process.env.PRIVATE_KEY;
  const rpcUrl = process.env.SEPOLIA_RPC_URL;
  if (!privateKey || !rpcUrl) {
    return res.status(500).json({ message: '서버 설정 오류: 개인키 또는 RPC URL이 없습니다.' });
  }
  if (!/^0x[0-9a-fA-F]{64}$/.test(privateKey)) {
    return res.status(500).json({ message: '서버 설정 오류: 개인키 형식이 올바르지 않습니다.' });
  }
  const account = privateKeyToAccount(privateKey);
  if (!isAddressEqual(account.address, FAUCET_ADDRESS)) {
    return res.status(500).json({ message: '서버 설정 오류: 개인키가 지급 지갑과 다릅니다.' });
  }

  // ── 2. 처리 중이면 재시도 안내 (설명은 파일 맨 아래) ──
  if (!tryStartSending()) {
    return res.status(429).json({ message: '다른 송금을 처리 중입니다. 잠시 후 다시 시도하세요.' });
  }

  // viem 클라이언트: walletClient는 서명·전송, publicClient는 조회용
  const transport = http(rpcUrl, { timeout: 10_000 }); // RPC 요청 하나당 최대 10초
  const walletClient = createWalletClient({ account, chain: sepolia, transport });
  const publicClient = createPublicClient({ chain: sepolia, transport });

  let hash;
  try {
    // ── 3. 송금 제출 ──
    // 같은 지갑 주소가 메인넷에도 있으므로, RPC가 다른 체인이면 그 체인에서 송금될 수 있습니다.
    // 그래서 보내기 전에 RPC의 체인이 Sepolia인지 확인합니다.
    if ((await publicClient.getChainId()) !== sepolia.id) {
      return res.status(500).json({ message: '서버 설정 오류: RPC URL이 Sepolia가 아닙니다.' });
    }
    // 개인키로 거래에 서명해 RPC 노드에 보내고, 거래 해시를 받습니다.
    hash = await walletClient.sendTransaction({ to: address, value: AMOUNT });

    // ── 4. 영수증 대기 ──
    // 해시를 받은 것은 "제출"일 뿐이고, 블록에 포함되어 영수증이 나와야 "확정"입니다.
    // Sepolia 블록은 약 12초마다 만들어지므로 최대 30초만 기다립니다.
    const receipt = await publicClient.waitForTransactionReceipt({ hash, timeout: 30_000 });
    if (receipt.status === 'success') {
      return res.status(200).json({ message: '0.1 Sepolia ETH를 보냈습니다.', link: `${EXPLORER}/tx/${hash}` });
    }
    return res.status(200).json({ message: '거래가 블록에 포함됐지만 실패했습니다.', link: `${EXPLORER}/tx/${hash}` });
  } catch (err) {
    // 오류 객체 전체에는 RPC URL(API 키 포함 가능)이 들어 있을 수 있으므로
    // 로그에는 오류 이름만 남기고, 브라우저에는 미리 정한 문구만 보냅니다.
    console.error('송금 처리 오류:', err.name);
    if (hash) {
      // 제출은 됐지만 30초 안에 확정을 확인하지 못함 (나중에 확정될 수 있음)
      return res.status(202).json({ message: '전송 제출됨, 확정 여부 확인 필요', link: `${EXPLORER}/tx/${hash}` });
    }
    // 해시를 못 받았어도 거래가 노드에 전달됐을 수 있으므로 "미전송"이라고 단정하지 않습니다.
    return res.status(502).json({
      message: '결과 확인 불가, 지급 지갑의 거래 내역을 확인하세요',
      link: `${EXPLORER}/address/${FAUCET_ADDRESS}`,
    });
  } finally {
    // ── 5. 처리 중 표시 해제 ──
    finishSending();
  }
}

// 학번 목록 읽기 (한 줄에 학번 하나, 숫자로 바꾸지 않고 문자열로 비교)
// - 환경변수 STUDENT_IDS_CSV가 있으면 사용합니다. (Vercel 배포용)
// - 없으면 로컬의 StudentID.csv 파일을 읽습니다. (이 파일은 Git·배포에 올리지 않음)
function loadStudentIds() {
  let text = process.env.STUDENT_IDS_CSV;
  if (text === undefined) {
    const file = path.join(process.cwd(), 'StudentID.csv');
    text = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
  }
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line !== '');
}

// ─────────────────────────────────────────────────────────────
// 동시 요청 처리: "처리 중이면 재시도 안내"
//
// 같은 지갑으로 거의 동시에 두 번 보내면 두 거래가 같은 nonce(거래 순번)를 받아 충돌할 수 있습니다.
// 그래서 송금 하나를 처리하는 동안 들어온 요청은 기다리게 하지 않고 바로 재시도 안내를 돌려줍니다.
// 신청을 저장하지 않으므로 학생이 다시 눌러야 합니다.
//
// 한계 (학생 개선 과제):
// - 이 표시는 모듈 변수라서 "같은 인스턴스 안에서만 유효"합니다.
//   Vercel이 인스턴스를 여러 개 띄우거나 vercel dev가 요청마다 프로세스를 새로 만들면 공유되지 않아,
//   동시에 송금하다 nonce가 충돌할 수 있습니다.
// - 표시를 해제한 뒤에도 이전 거래가 아직 대기 중일 수 있습니다. (30초 안에 확정되지 않은 경우)
// - 서버가 강제 종료되면 finally가 실행된다는 보장이 없습니다.
// ─────────────────────────────────────────────────────────────
let isSending = false;

function tryStartSending() {
  // 확인과 설정 사이에 await가 없으므로, 같은 인스턴스에서 두 요청이 함께 통과할 수 없습니다.
  if (isSending) return false;
  isSending = true;
  return true;
}

function finishSending() {
  isSending = false;
}
