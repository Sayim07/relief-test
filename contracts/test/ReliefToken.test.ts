import { expect } from "chai";
import hre from "hardhat";
import "@nomicfoundation/hardhat-chai-matchers";

const { ethers } = hre;

describe("ReliefToken", function () {
  let reliefToken: any;
  let owner: any;
  let beneficiary: any;
  let otherAccount: any;

  beforeEach(async function () {
    [owner, beneficiary, otherAccount] = await ethers.getSigners();

    const ReliefTokenFactory = await ethers.getContractFactory("ReliefToken");
    reliefToken = await ReliefTokenFactory.deploy(
      "Relief Token",
      "RLT",
      owner.address
    );
    await reliefToken.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await reliefToken.owner()).to.equal(owner.address);
    });

    it("Should have correct name and symbol", async function () {
      expect(await reliefToken.name()).to.equal("Relief Token");
      expect(await reliefToken.symbol()).to.equal("RLT");
    });
  });

  describe("Beneficiary Management", function () {
    it("Should whitelist a beneficiary", async function () {
      const categories = ["food", "shelter"];
      const limits = [ethers.parseEther("1000"), ethers.parseEther("2000")];

      await expect(
        reliefToken.whitelistBeneficiary(beneficiary.address, categories, limits)
      )
        .to.emit(reliefToken, "BeneficiaryWhitelisted")
        .withArgs(beneficiary.address, categories, limits);

      const beneficiaryData = await reliefToken.beneficiaries(beneficiary.address);
      expect(beneficiaryData.isWhitelisted).to.be.true;
    });

    it("Should not allow non-owner to whitelist", async function () {
      const categories = ["food"];
      const limits = [ethers.parseEther("1000")];

      await expect(
        reliefToken.connect(otherAccount).whitelistBeneficiary(
          beneficiary.address,
          categories,
          limits
        )
      ).to.be.revertedWithCustomError(reliefToken, "OwnableUnauthorizedAccount");
    });

    it("Should remove a beneficiary", async function () {
      const categories = ["food"];
      const limits = [ethers.parseEther("1000")];

      await reliefToken.whitelistBeneficiary(beneficiary.address, categories, limits);
      await expect(reliefToken.removeBeneficiary(beneficiary.address))
        .to.emit(reliefToken, "BeneficiaryRemoved")
        .withArgs(beneficiary.address);

      const beneficiaryData = await reliefToken.beneficiaries(beneficiary.address);
      expect(beneficiaryData.isWhitelisted).to.be.false;
    });
  });

  describe("Relief Distribution", function () {
    beforeEach(async function () {
      const categories = ["food", "shelter"];
      const limits = [ethers.parseEther("1000"), ethers.parseEther("2000")];
      await reliefToken.whitelistBeneficiary(beneficiary.address, categories, limits);
    });

    it("Should distribute relief to beneficiary", async function () {
      const amount = ethers.parseEther("500");
      const category = "food";

      await expect(
        reliefToken.distributeRelief(beneficiary.address, amount, category)
      )
        .to.emit(reliefToken, "ReliefDistributed")
        .withArgs(beneficiary.address, amount, category);

      expect(await reliefToken.balanceOf(beneficiary.address)).to.equal(amount);

      const beneficiaryData = await reliefToken.beneficiaries(beneficiary.address);
      expect(beneficiaryData.totalReceived).to.equal(amount);
    });

    it("Should not distribute to non-whitelisted beneficiary", async function () {
      const amount = ethers.parseEther("500");
      await expect(
        reliefToken.distributeRelief(otherAccount.address, amount, "food")
      ).to.be.revertedWith("Beneficiary not whitelisted");
    });

    it("Should not allow non-owner to distribute", async function () {
      const amount = ethers.parseEther("500");
      await expect(
        reliefToken.connect(otherAccount).distributeRelief(
          beneficiary.address,
          amount,
          "food"
        )
      ).to.be.revertedWithCustomError(reliefToken, "OwnableUnauthorizedAccount");
    });
  });

  describe("Category-Based Transfers", function () {
    beforeEach(async function () {
      const categories = ["food"];
      const limits = [ethers.parseEther("1000")];
      await reliefToken.whitelistBeneficiary(beneficiary.address, categories, limits);
      await reliefToken.distributeRelief(
        beneficiary.address,
        ethers.parseEther("500"),
        "food"
      );
    });

    it("Should allow transfer within category limit", async function () {
      const amount = ethers.parseEther("300");
      await expect(
        reliefToken.connect(beneficiary).transferWithCategory(
          otherAccount.address,
          amount,
          "food"
        )
      )
        .to.emit(reliefToken, "CategorySpent")
        .withArgs(beneficiary.address, "food", amount);

      expect(await reliefToken.balanceOf(otherAccount.address)).to.equal(amount);
    });

    it("Should not allow transfer exceeding category limit", async function () {
      const amount = ethers.parseEther("1200"); // Exceeds limit of 1000
      await expect(
        reliefToken.connect(beneficiary).transferWithCategory(
          otherAccount.address,
          amount,
          "food"
        )
      ).to.be.revertedWith("Category limit exceeded");
    });

    it("Should track category spending", async function () {
      const amount = ethers.parseEther("200");
      await reliefToken.connect(beneficiary).transferWithCategory(
        otherAccount.address,
        amount,
        "food"
      );

      const [spent, limit] = await reliefToken.getCategorySpending(
        beneficiary.address,
        "food"
      );
      expect(spent).to.equal(amount);
      expect(limit).to.equal(ethers.parseEther("1000"));
    });
  });

  describe("Transaction Recording", function () {
    it("Should record transactions", async function () {
      const categories = ["food"];
      const limits = [ethers.parseEther("1000")];
      await reliefToken.whitelistBeneficiary(beneficiary.address, categories, limits);

      const amount = ethers.parseEther("500");
      await expect(
        reliefToken.distributeRelief(beneficiary.address, amount, "food")
      )
        .to.emit(reliefToken, "TransactionRecorded");

      const txCount = await reliefToken.transactionCount();
      expect(txCount).to.equal(BigInt(1));

      const tx = await reliefToken.getTransaction(0);
      expect(tx.to).to.equal(beneficiary.address);
      expect(tx.amount).to.equal(amount);
      expect(tx.category).to.equal("food");
    });
  });
});
