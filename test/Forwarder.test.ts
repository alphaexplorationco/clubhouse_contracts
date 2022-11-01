import { expect } from "chai";
import { Contract, ContractFactory } from "ethers";
import { ethers, upgrades } from "hardhat";

describe("Forwarder", function () {
  let Forwarder: ContractFactory
  let forwarder: Contract
  let ForwarderV2: ContractFactory

  this.beforeAll(async () => {
    Forwarder = await ethers.getContractFactory("Forwarder")
    forwarder = await upgrades.deployProxy(Forwarder)
    ForwarderV2 = await ethers.getContractFactory("ForwarderV2")
  });

  it("initializer should call MinimalForwarderUpgradeable initializer", async function () {
    await expect(forwarder.functions.initialize()).to.be.revertedWith("Initializable: contract is already initialized");
  });

  it("transparent proxy upgrades should work", async function () {
    expect(function () {forwarder.functions.getNameHash()}).to.throw("forwarder.functions.getNameHash is not a function");
    const upgradedContract = await upgrades.upgradeProxy(forwarder, ForwarderV2);
    await expect(upgradedContract.functions.initialize()).to.be.revertedWith("Initializable: contract is already initialized");
    expect((await upgradedContract.functions.getNameHash())[0]).to.equal("0x9e0923a39f515e9a8cebc9fb694b9abf7e4b8c3f7ab6f81b56eabdac504b08dc")
  });
});