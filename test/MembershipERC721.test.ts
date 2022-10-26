import { expect } from "chai";
import { Contract, ContractFactory } from "ethers";
import { ethers } from "hardhat";

describe("Membership NFT Contract", function () {
  let Membership: ContractFactory
  let membership: Contract
  let proxy: Contract
  let forwarderAddress: string
  let addressWithBalance: string

  this.beforeAll(async () => {
    Membership = await ethers.getContractFactory("MembershipERC721");
    membership = await Membership.deploy();
    const Beacon = await ethers.getContractFactory("UpgradeableBeacon")
    const beacon = await Beacon.deploy(membership.address);
    const BeaconProxy = await ethers.getContractFactory("BeaconProxy");
    const beaconProxy = await BeaconProxy.deploy(
      beacon.address,
      Membership.interface.encodeFunctionData("setUp", ["TEST", "T", "0x543c433afbF9E8bB5c621b61FA30f8b88cCa85a3", 1])
    );
    proxy = Membership.attach(beaconProxy.address)
    forwarderAddress = "0x543c433afbF9E8bB5c621b61FA30f8b88cCa85a3"
    addressWithBalance = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045"
    await (await proxy.functions.safeMint(addressWithBalance, 1)).wait()
  });

  it("constructor should lock initializers", async function () {
    await expect(proxy.functions.setUp("TEST", "T", forwarderAddress, 1)).to.be.revertedWith(
      "Initializable: contract is already initialized"
    );
  });

  it("setUp should set name, symbol, trusted forwarder, and display type correctly", async function () {
    expect((await proxy.functions.name())[0]).to.equal("TEST")
    expect((await proxy.functions.symbol())[0]).to.equal("T")
    expect((await proxy.functions.trustedForwarder())[0]).to.equal(forwarderAddress)
    expect((await proxy.functions.getDisplayType())[0]).to.equal(1)
  });

  it("safeMint should mint token to address with balance == 0", async function () {
    await (await proxy.functions.safeMint(forwarderAddress, 1)).wait()
    expect((await proxy.functions.balanceOf(forwarderAddress))[0]).to.equal(1)
  });

  it("safeMint should revert on mint to address with balance > 0", async function () {
    await expect(proxy.functions.safeMint(addressWithBalance, 1)).to.be.revertedWith("balanceOf(to) > 0")
  });

  it("updateExpiryTimestamp and getExpiryTimestamp should set/get expiry timestamp correctly", async function () {
    expect((await proxy.functions.getExpiryTimestamp(addressWithBalance))[0]).to.equal(1)
    await (await proxy.functions.updateExpiryTimestamp(addressWithBalance, 23)).wait()
    expect((await proxy.functions.getExpiryTimestamp(addressWithBalance))[0]).to.equal(23)
  });

  it("setDisplayType and getDisplayType should set/get display type correctly", async function () {
    expect((await proxy.functions.getDisplayType())[0]).to.equal(1)
    await (await proxy.functions.setDisplayType(99)).wait()
    expect((await proxy.functions.getDisplayType())[0]).to.equal(99)
  });

  it("setTrustedForwarder should update trusted forwarder address when called by owner", async function () {
    expect((await proxy.functions.trustedForwarder())[0]).to.equal(forwarderAddress)
    await (await proxy.functions.setTrustedForwarder(addressWithBalance)).wait()
    expect((await proxy.functions.trustedForwarder())[0]).to.equal(addressWithBalance)
  });

  it("_beforeTokenTransfer should revert on NFT transfer", async function () {
    const [signer] = await ethers.getSigners()
    await (await proxy.functions.safeMint(signer.address, 1123)).wait()
    const [tokenId] = await proxy.functions.getTokenId(signer.address);
    await expect(proxy.functions.transferFrom(signer.address, forwarderAddress, tokenId)).to.be.revertedWith("non transferable")
  });

  it("tokenURI should return URI with expiry timestamp and display type as params", async function () {});
});