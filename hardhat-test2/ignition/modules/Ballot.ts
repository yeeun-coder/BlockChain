import { buildModule }
  from "@nomicfoundation/hardhat-ignition/modules";
import { encodeBytes32String } from "ethers";

// 후보 이름은 bytes32 로 바꿔서 전달 (한글 10자 정도까지)
// 각자 후보를 바꿔서 자기만의 투표를 배포해 보기 (배포한 사람 = 의장)
export default buildModule("BallotModule", (m) => {
  const names = ["짜장면", "짬뽕", "탕수육"].map((n) => encodeBytes32String(n));
  const ballot = m.contract("Ballot", [names]);
  return { ballot };
});
