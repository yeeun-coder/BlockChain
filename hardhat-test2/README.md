# Hardhat 3 + ethers.js 웹 페이지 실습 (hardhat-test2)

홀짝 게임(실습1의 2부)과 투표 Ballot(실습2)을 위한 두 번째 프로젝트입니다.
첫 번째 프로젝트 `hardhat-test` 와 설정(Hardhat 3.20.0, ethers 6.17.0)은 같고, 컨트랙트와 배포 모듈이 들어 있습니다.

## 받는 방법
```
cd C:\blockchain
git clone https://github.com/Inhatc-BlockChain/hardhat-test2.git
cd hardhat-test2
npm ci
```
- ZIP: 이 저장소의 **Code → Download ZIP** → `C:\blockchain` 에 풀기 → 폴더 이름이 `hardhat-test2-main` 이면 `hardhat-test2` 로
- VS Code → File → Open Folder → `hardhat-test2` (**새 창**)
- 명령을 치기 전에 터미널 경로가 `…\hardhat-test2>` 인지 확인 (hardhat-test 에서 배포하면 기록이 그쪽에 남음)

## 들어 있는 파일
| 파일 | 내용 | 학생 |
|---|---|---|
| `contracts/OddEven.sol`, `ignition/modules/OddEven.ts` | 홀짝 게임 (준비금 0.005 ETH 와 함께 배포) | 제공 (읽고 이해) |
| `contracts/Ballot.sol`, `ignition/modules/Ballot.ts` | 투표: Solidity 공식 문서 예제 + `register()` | 제공 (읽고 이해, 후보 바꿔 보기) |
| `scripts/serve.js` | 웹 서버 `http://localhost:3000` | 수정하지 않음 |
| `web/odd-even.html`, `web/ballot.html` | 웹 페이지 | 제공 (읽고 실행) |
| 변화 예제 | 컨트랙트와 웹 페이지를 직접 고치기 (강의자료 참고) | **작성** |

## 명령
| 하는 일 | 명령 | 짧은 명령 |
|---|---|---|
| 컴파일 | `npx hardhat build` | `npm run build` |
| 홀짝 게임 배포 | `npx hardhat ignition deploy ignition/modules/OddEven.ts --network sepolia` | `npm run deploy:oddeven` |
| 투표 배포 | `npx hardhat ignition deploy ignition/modules/Ballot.ts --network sepolia` | `npm run deploy:ballot` |
| 웹 서버 (터미널 하나 더, 끄지 않기) | `node scripts/serve.js` | `npm run serve` |

## 프로젝트마다 따로 / 같이 쓰는 것
| | 따로 | 같이 씀 |
|---|---|---|
| node_modules, hardhat.config.ts, contracts, artifacts | O | |
| 배포 기록 `ignition/deployments/` (여기에는 Counter 기록이 없음) | O | |
| keystore (SEPOLIA_RPC_URL, SEPOLIA_PRIVATE_KEY) | | O (Windows 사용자별, 다시 set 하지 않아도 됨) |
| MetaMask 계정, Sepolia 에 배포된 컨트랙트 | | O |

### 올리면 안 되는 것
- **개인 키를 코드나 파일에 쓰지 않기** → `npx hardhat keystore set …` 으로만 저장
- `node_modules/`, `artifacts/`, `cache/`, `ignition/deployments/` 는 `.gitignore` 에 등록되어 있어 올라가지 않음
