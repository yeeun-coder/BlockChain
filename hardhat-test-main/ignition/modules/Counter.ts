import { buildModule }
from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule(
    "CounterModule"
    , // 모듈 이름
    (m) => {

        const counter =
            m.contract("Counter"); // Counter 컨트랙트를 배포하겠다고 선언
            
        return { counter }; // 배포 결과를 돌려줌
    }
);