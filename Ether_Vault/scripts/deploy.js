import hre from "hardhat";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  console.log("Starting deployment...");

  // Determine network and connect
  const networkName = hre.globalOptions.network || "hardhat";
  console.log(`Connecting to network: ${networkName}`);
  const connection = await hre.network.getOrCreate(networkName);
  const ethers = connection.ethers;

  const [deployer] = await ethers.getSigners();
  console.log("Deploying contract with account:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "ETH");

  // Get contract factory and deploy
  const EtherVault = await ethers.getContractFactory("EtherVault");
  const etherVault = await EtherVault.deploy();
  
  console.log("Waiting for block confirmation...");
  await etherVault.waitForDeployment();

  const address = await etherVault.getAddress();
  console.log("EtherVault deployed to:", address);

  // Read ABI from Hardhat's compiled artifacts
  const artifactPath = path.join(__dirname, "../artifacts/contracts/EtherVault.sol/EtherVault.json");
  let abi = [];
  if (fs.existsSync(artifactPath)) {
    const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
    abi = artifact.abi;
  } else {
    // Fallback using Interface fragments if the compiled artifact isn't read
    abi = JSON.parse(EtherVault.interface.formatJson());
  }

  // Create frontend config directory if it does not exist
  const configDir = path.join(__dirname, "../src/config");
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }

  const configPath = path.join(configDir, "contract.json");
  fs.writeFileSync(
    configPath,
    JSON.stringify({ address, abi }, null, 2),
    "utf8"
  );
  console.log("Successfully wrote contract configuration to:", configPath);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Deployment failed:", error);
    process.exit(1);
  });
