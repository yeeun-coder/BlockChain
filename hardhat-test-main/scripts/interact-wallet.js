// interact.js 를 Sepolia + 내 개인 키(ethers.Wallet) 용으로 바꾼 버전
//   PowerShell: $env:PRIVATE_KEY = "개인 키"
//               node scripts/interact-wallet.js
import fs from "node:fs";
import { ethers } from "ethers";

// 1. Provider: 127.0.0.1:8545 대신 Sepolia RPC URL
const RPC_URL = process.env.RPC_URL ?? "https://ethereum-sepolia-rpc.publicnode.com";
const provider = new ethers.JsonRpcProvider(RPC_URL);

if (!process.env.PRIVATE_KEY) {
    console.log("PRIVATE_KEY 환경 변수가 없습니다. PowerShell: $env:PRIVATE_KEY = \"개인 키\"");
    process.exit(1);
}

// 2. Signer: provider.getSigner(0) 대신 내 개인 키
const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

// 3. 배포 주소: Ignition 배포 기록 (Sepolia = chain-11155111)
const { chainId } = await provider.getNetwork();
const address = JSON.parse(
    fs.readFileSync(`ignition/deployments/chain-${chainId}/deployed_addresses.json`, "utf8")
)["CounterModule#Counter"];

// 4. ABI, Contract: interact.js 와 같음
const abi = [
    "function count() view returns (uint256)",
    "function increment()",
    "function add(uint256)"
];
const counter = new ethers.Contract(address, abi, signer);

console.log("Contract 주소:", address);
console.log("서명 계정:", signer.address);
console.log("현재 값:", await counter.count());

const tx = await counter.increment();
console.log("트랜잭션 해시:", tx.hash);
const receipt = await tx.wait(); // Sepolia: 약 12초 이상

console.log("사용한 가스:", receipt.gasUsed);
console.log("변경 후:", await counter.count());