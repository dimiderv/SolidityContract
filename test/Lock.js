const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");
const { experimentalAddHardhatNetworkMessageTraceHook } = require("hardhat/config");
const { ethers } = require("hardhat");

describe("Lock", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployOneYearLockFixture() {
    // Contracts are deployed using the first signer/account by default
    const [owner, otherAccount] = await ethers.getSigners();
    const Lock = await ethers.getContractFactory("Lock");
    const lock = await Lock.deploy();

    return { lock, owner, otherAccount };
  }

  describe("Deposit", function () {

    it("Should update the balance value correctly", async function () {
      const { lock, owner, otherAccount } = await loadFixture(deployOneYearLockFixture);
      const preBalance = await lock.getBalance(owner.address);
      
      expect(preBalance).to.equal(0n);

      await expect(lock.deposit(owner.address,{value: ethers.parseEther("1")})).to.emit(lock, "Deposit").withArgs(owner.address, ethers.parseEther("1"), BigInt(Math.ceil(Date.now() /1000) + 60) );

      expect(await lock.getBalance(owner.address)).to.equal(ethers.parseEther("1"));

    });
    
    it("Deposit as the approved user", async function(){
      console.log("===================================================================")
      const { lock, owner, otherAccount } = await loadFixture(deployOneYearLockFixture);
      const approvedUser = await lock.approve(otherAccount.address);
      const firstDeposit = await lock.connect(otherAccount).deposit(owner.address, { value: ethers.parseEther("1") });
      // Sign and send the transaction
      const receipt = await firstDeposit.wait();
      // // Check the transaction status
      
      
      if (receipt.status === 1) {
        console.log("Withdrawal successful");
      } else {
        console.log("Withdrawal failed");
      }
      expect(await lock.getBalance(owner.address)).to.equal(ethers.parseEther('1'));

    })
    it("Should check that the timestamp is updated correctly", async function () {
      console.log("===================================================================");
      const { lock, owner, otherAccount } = await loadFixture(deployOneYearLockFixture);
      const preTimestamp = await lock.getTimestamp(owner.address);
      
      expect(preTimestamp).to.equal(0n);
    
      const firstDeposit = await lock.deposit(owner.address, { value: ethers.parseEther("1") });
    
      const firstTimestamp = await firstDeposit.wait();
      const expectedTimestamp = Math.ceil(Date.now() / 1000) + 60;
      
      // Allow for a small time discrepancy (e.g., 1 second)
      const tolerance = 1;
    
      const actualTimestamp = await lock.getTimestamp(owner.address);
      expect(actualTimestamp).to.be.within(expectedTimestamp - tolerance, expectedTimestamp + tolerance);
    
      await lock.deposit(owner.address, { value: ethers.parseEther("1") });
    
      expect(actualTimestamp).to.be.within(expectedTimestamp - tolerance, expectedTimestamp + tolerance);
    });

// expect().to.revertWith()
    it("Withdraw but not as the owner", async function () {
      console.log("===================================================================")

      const { lock, owner, otherAccount } = await loadFixture(deployOneYearLockFixture);
      await expect(lock.withdraw(otherAccount.address)).to.revertedWith("User is not the owner or is approved");
    });

    it("Withdraw as the user", async function(){
      console.log("===================================================================")
      const { lock, owner, otherAccount } = await loadFixture(deployOneYearLockFixture);
      await lock.withdraw(owner.address);
      expect(await lock.getBalance(owner.address)).to.equal(0);
    })

    it("Withdraw but time hasnt passed yet", async function(){
      console.log("===================================================================")
      const { lock, owner, otherAccount } = await loadFixture(deployOneYearLockFixture);
      const preBalance = await lock.getBalance(owner.address);
      
      // expect(preBalance).to.equal(0n);

     const x= await expect(lock.deposit(owner.address, {value: ethers.parseEther("1")})).to.emit(lock, "Deposit"). withArgs(owner.address, ethers.parseEther("1"), BigInt(Math.ceil(Date.now() /1000) + 60) );

      expect(await lock.getBalance(owner.address)).to.equal(ethers.parseEther("1"));
      await expect(lock.withdraw(owner.address)).to.revertedWith("You cant withdraw yet");
    })

    it("Withdraw as the approved user", async function(){
      console.log("===================================================================")
      const { lock, owner, otherAccount } = await loadFixture(deployOneYearLockFixture);
      const approvedUser = await lock.approve(otherAccount.address);
      const firstDeposit = await lock.deposit(owner.address, { value: ethers.parseEther("1") });
    
      const firstTimestamp = await firstDeposit.wait();
      expect(await lock.getBalance(owner.address)).to.equal(ethers.parseEther('1'));
      expect(await lock.getContractBalance()).to.equal(ethers.parseEther('1'));

      const withdrawTx = await lock.connect(otherAccount).withdraw(owner.address);

      // Sign and send the transaction
      const receipt = await withdrawTx.wait();
      // Check the transaction status
      if (receipt.status === 1) {
        console.log("Withdrawal successful");
      } else {
        console.log("Withdrawal failed");
      }
      expect(await lock.getTotalUsers()).to.equal(1n);

      expect(await lock.getTotalDepositAmount()).to.equal(ethers.parseEther('1'));
      expect(await lock.getTotalWithdrawAmount()).to.equal(ethers.parseEther('1'));
      expect(await lock.getBalance(owner.address)).to.equal(ethers.parseEther('0'));

    })

  });

  
 
});
