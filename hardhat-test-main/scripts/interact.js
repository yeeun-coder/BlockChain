import fs from "node:fs";
import { ethers } from "ethers";

// 1. Provider: 내 PC의 Hardhat Node 에 연결
const provider =
    new ethers.JsonRpcProvider("http://127.0.0.1:8545");

// 2. Signer: Hardhat Node 가 관리하는 0번 테스트 계정
const signer =
    await provider.getSigner(0);

// 3. 배포 주소: Ignition 배포 기록 파일에서 자동으로 읽기
const deployed = JSON.parse(
    fs.readFileSync(
        "ignition/deployments/chain-31337/deployed_addresses.json", "utf8"));
const address = deployed["CounterModule#Counter"];

// 4. ABI: 사용할 함수 목록 (사람이 읽을 수 있는 형태)
const abi = [
    "function count() view returns (uint256)",
    "function increment()",
    "function add(uint256)"
];

// 5. Contract: 배포된 컨트랙트를 JavaScript 객체처럼 사용
const counter = new ethers.Contract(address, abi, signer);
console.log("Contract 주소:", address);
console.log("서명 계정:", await signer.getAddress());

// view 함수 → call (트랜잭션 X, 가스비 X)
console.log("현재 값:", await counter.count());

// 상태 변경 함수 → 트랜잭션 (서명 O, 가스 사용)
const tx = await counter.increment(); // increment()를 실행하는 트랜잭션 자체를 받음– 아직 블록에 반영전
const receipt = await tx.wait(); // 트랜잭션이 블록에 포함될 때까지 기다림, receipt.logs : event 로그

console.log("트랜잭션 해시:", tx.hash);
console.log("사용한 가스:", receipt.gasUsed);
console.log("변경 후:", await counter.count());