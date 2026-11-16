import { expect } from "chai";
import hre from "hardhat";

describe("EtherVault", function () {
  let connection;
  let ethers;
  let networkHelpers;
  let owner, supporter1, supporter2;

  before(async function () {
    // Connect to the Hardhat network to get network connection and helpers
    connection = await hre.network.getOrCreate("hardhat");
    ethers = connection.ethers;
    networkHelpers = connection.networkHelpers;

    [owner, supporter1, supporter2] = await ethers.getSigners();
  });

  async function deployEtherVaultFixture() {
    const EtherVault = await ethers.getContractFactory("EtherVault");
    const etherVault = await EtherVault.deploy();
    return { etherVault };
  }

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      const { etherVault } = await networkHelpers.loadFixture(deployEtherVaultFixture);
      expect(await etherVault.owner()).to.equal(owner.address);
    });

    it("Should initialize with zero tips and zero deposited balance", async function () {
      const { etherVault } = await networkHelpers.loadFixture(deployEtherVaultFixture);
      expect(await etherVault.getTipCount()).to.equal(0n);
      expect(await etherVault.totalDeposited()).to.equal(0n);
    });
  });

  describe("Tipping", function () {
    it("Should successfully receive a tip and emit NewTip event", async function () {
      const { etherVault } = await networkHelpers.loadFixture(deployEtherVaultFixture);
      const tipAmount = ethers.parseEther("0.05");

      const tx = await etherVault.connect(supporter1).tip("Alice", "Keep up the great work!", { value: tipAmount });
      const receipt = await tx.wait();

      // Verify event emission via manual log parsing (highly robust in ESM)
      const logs = receipt.logs.map(log => {
        try {
          return etherVault.interface.parseLog(log);
        } catch (e) {
          return null;
        }
      }).filter(log => log !== null);

      const newTipEvent = logs.find(log => log.name === "NewTip");
      expect(newTipEvent).to.not.be.undefined;
      expect(newTipEvent.args.sender).to.equal(supporter1.address);
      expect(newTipEvent.args.amount).to.equal(tipAmount);
      expect(newTipEvent.args.name).to.equal("Alice");
      expect(newTipEvent.args.message).to.equal("Keep up the great work!");
      expect(newTipEvent.args.timestamp).to.be.a("bigint");

      expect(await etherVault.getTipCount()).to.equal(1n);
      expect(await etherVault.totalDeposited()).to.equal(tipAmount);

      const tips = await etherVault.getTotalTips();
      expect(tips[0].sender).to.equal(supporter1.address);
      expect(tips[0].amount).to.equal(tipAmount);
      expect(tips[0].name).to.equal("Alice");
      expect(tips[0].message).to.equal("Keep up the great work!");
    });

    it("Should default empty name to 'Anonymous'", async function () {
      const { etherVault } = await networkHelpers.loadFixture(deployEtherVaultFixture);
      const tipAmount = ethers.parseEther("0.01");

      await etherVault.connect(supporter1).tip("", "Silent supporter!", { value: tipAmount });
      const tips = await etherVault.getTotalTips();
      expect(tips[0].name).to.equal("Anonymous");
    });

    it("Should revert if tip amount is zero", async function () {
      const { etherVault } = await networkHelpers.loadFixture(deployEtherVaultFixture);
      await expect(
        etherVault.connect(supporter1).tip("Bob", "Free support?", { value: 0n })
      ).to.be.revertedWith("Tip amount must be greater than zero");
    });

    it("Should revert if name is longer than 50 characters", async function () {
      const { etherVault } = await networkHelpers.loadFixture(deployEtherVaultFixture);
      const longName = "A".repeat(51);
      await expect(
        etherVault.connect(supporter1).tip(longName, "Hello", { value: ethers.parseEther("0.01") })
      ).to.be.revertedWith("Name exceeds 50 characters");
    });

    it("Should revert if message is longer than 280 characters", async function () {
      const { etherVault } = await networkHelpers.loadFixture(deployEtherVaultFixture);
      const longMessage = "M".repeat(281);
      await expect(
        etherVault.connect(supporter1).tip("Alice", longMessage, { value: ethers.parseEther("0.01") })
      ).to.be.revertedWith("Message exceeds 280 characters");
    });
  });

  describe("Withdrawals", function () {
    it("Should allow the owner to withdraw tips", async function () {
      const { etherVault } = await networkHelpers.loadFixture(deployEtherVaultFixture);
      const tipAmount = ethers.parseEther("1.0");

      // Deposit a tip first
      await etherVault.connect(supporter1).tip("Alice", "Huge tip!", { value: tipAmount });

      // Record owner's balance before withdrawal
      const ownerBalanceBefore = await ethers.provider.getBalance(owner.address);

      // Perform withdrawal
      const tx = await etherVault.connect(owner).withdraw();
      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed * receipt.gasPrice;

      // Check balance after withdrawal
      const ownerBalanceAfter = await ethers.provider.getBalance(owner.address);
      expect(ownerBalanceAfter).to.equal(ownerBalanceBefore + tipAmount - gasUsed);

      // Verify contract balance is zero
      expect(await ethers.provider.getBalance(await etherVault.getAddress())).to.equal(0n);
    });

    it("Should revert if non-owner tries to withdraw", async function () {
      const { etherVault } = await networkHelpers.loadFixture(deployEtherVaultFixture);
      await expect(
        etherVault.connect(supporter1).withdraw()
      ).to.be.revertedWithCustomError(etherVault, "OwnableUnauthorizedAccount");
    });

    it("Should revert if there are no funds to withdraw", async function () {
      const { etherVault } = await networkHelpers.loadFixture(deployEtherVaultFixture);
      await expect(
        etherVault.connect(owner).withdraw()
      ).to.be.revertedWith("No funds to withdraw");
    });
  });

  describe("View Helpers", function () {
    it("Should return correct latest tips count", async function () {
      const { etherVault } = await networkHelpers.loadFixture(deployEtherVaultFixture);

      await etherVault.connect(supporter1).tip("Alice", "One", { value: ethers.parseEther("0.01") });
      await etherVault.connect(supporter2).tip("Bob", "Two", { value: ethers.parseEther("0.02") });
      await etherVault.connect(supporter1).tip("Charlie", "Three", { value: ethers.parseEther("0.03") });

      const latestTips = await etherVault.getLatestTips(2n);
      expect(latestTips.length).to.equal(2);
      expect(latestTips[0].name).to.equal("Charlie");
      expect(latestTips[1].name).to.equal("Bob");

      const allThree = await etherVault.getLatestTips(5n);
      expect(allThree.length).to.equal(3);
      expect(allThree[0].name).to.equal("Charlie");
      expect(allThree[2].name).to.equal("Alice");
    });
  });
});
