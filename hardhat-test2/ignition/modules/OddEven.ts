import { buildModule }
  from "@nomicfoundation/hardhat-ignition/modules";

// 배포할 때 상금 준비금을 함께 보냄 (기본 0.005 ETH = 2배 상금 2.5번)
export default buildModule("OddEvenModule", (m) => {
  const reserve = m.getParameter("reserve", 5n * 10n ** 15n);
  const game = m.contract("OddEven", [], { value: reserve });
  return { game };
});
