import { expect } from "chai";
import { Contract } from "ethers";
import { ethers } from "hardhat";

describe("Membership NFT Contract", function () {
  let proxyFactoryContract: Contract

  this.beforeAll(async () => {
    const factory = await ethers.getContractFactory("MembershipERC721");
    proxyFactoryContract = await factory.deploy()
  });

  it("constructor should lock initializers", async function () {});
  it("setUp should set trusted forwarder and display type correctly", async function () {});
  it("safeMint should mint token to address wit balance == 0", async function () {});
  it("safeMint should revert on mint to address with balance > 0", async function () {});
  it("updateExpiryTimestamp and getExpiryTimestamp should get/set expiry timestamp correctly", async function () {});
  it("setDisplayType and getDisplayType should get/set display type correctly", async function () {});
  it("setTrustedForwarder should update trusted forwarder address when called by owner", async function () {});
  it("_beforeTokenTransfer should revert on NFT transfer", async function () {});
  it("tokenURI should return URI with expiry timestamp and display type as params", async function () {});
});