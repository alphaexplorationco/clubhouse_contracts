import { expect } from "chai";
import { Contract, ContractFactory } from "ethers";
import { ethers } from "hardhat";

describe("Membership NFT Contract", function () {
  let Membership: ContractFactory
  let membership: Contract
  let proxy: Contract
  let Beacon: ContractFactory
  let beacon: Contract
  let BeaconProxy: ContractFactory
  let forwarderAddress: string
  let addressWithBalance: string
  let addressWithBalanceTokenId: Number

  this.beforeAll(async () => {
    Membership = await ethers.getContractFactory("MembershipERC721");
    membership = await Membership.deploy();
    Beacon = await ethers.getContractFactory("UpgradeableBeacon")
    beacon = await Beacon.deploy(membership.address);
    BeaconProxy = await ethers.getContractFactory("BeaconProxy");
    const beaconProxy = await BeaconProxy.deploy(
      beacon.address,
      Membership.interface.encodeFunctionData("setUp", ["TEST", "T", "0x543c433afbF9E8bB5c621b61FA30f8b88cCa85a3"])
    );
    proxy = Membership.attach(beaconProxy.address)
    forwarderAddress = "0x543c433afbF9E8bB5c621b61FA30f8b88cCa85a3"
    addressWithBalance = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045"
    const mintReceipt = await (await proxy.functions.safeMint(addressWithBalance, 1)).wait()
    addressWithBalanceTokenId = await mintReceipt.events[0].args.tokenId
  });

  it("constructor should lock initializers", async function () {
    await expect(proxy.functions.setUp("TEST", "T", forwarderAddress)).to.be.revertedWith(
      "Initializable: contract is already initialized"
    );
  });

  it("setUp should set name, symbol, trusted forwarder, and display type correctly", async function () {
    await expect(BeaconProxy.deploy(
      beacon.address,
      Membership.interface.encodeFunctionData("setUp", ["", "T", "0x543c433afbF9E8bB5c621b61FA30f8b88cCa85a3"])
    )).to.be.revertedWith("_name or _symbol empty");
    await expect(BeaconProxy.deploy(
      beacon.address,
      Membership.interface.encodeFunctionData("setUp", ["TEST", "", "0x543c433afbF9E8bB5c621b61FA30f8b88cCa85a3"])
    )).to.be.revertedWith("_name or _symbol empty");
  });

  it("setUp should set revert if name or symbol is empty", async function () {
    expect((await proxy.functions.name())[0]).to.equal("TEST")
    expect((await proxy.functions.symbol())[0]).to.equal("T")
    expect((await proxy.functions.trustedForwarder())[0]).to.equal(forwarderAddress)
  });

  it("safeMint should mint token to address with balance == 0", async function () {
    await (await proxy.functions.safeMint(forwarderAddress, 1)).wait()
    expect((await proxy.functions.balanceOf(forwarderAddress))[0]).to.equal(1)
  });

  it("safeMint should revert on mint to address with balance > 0", async function () {
    await expect(proxy.functions.safeMint(addressWithBalance, 1)).to.be.revertedWith("balanceOf(to) > 0")
  });

  it("safeMint should revert if called by non-owner address", async function () {
    const [_, nonOwnerSigner] = (await ethers.getSigners())
    const proxyNonOwner = proxy.connect(nonOwnerSigner)
    await expect(
      proxyNonOwner.functions.safeMint("0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045", 12345)
      ).to.be.revertedWith("Ownable: caller is not the owner")
  });

  it("updateExpiryTimestamp and getExpiryTimestamp should set/get expiry timestamp correctly", async function () {
    expect((await proxy.functions.getExpiryTimestamp(addressWithBalanceTokenId))[0]).to.equal(1)
    await (await proxy.functions.updateExpiryTimestamp(addressWithBalanceTokenId, 23)).wait()
    expect((await proxy.functions.getExpiryTimestamp(addressWithBalanceTokenId))[0]).to.equal(23)
  });

  it("updateExpiryTimestamp should revert if called by non-owner address", async function () {
    const [_, nonOwnerSigner] = (await ethers.getSigners())
    const proxyNonOwner = proxy.connect(nonOwnerSigner)
    await expect(proxyNonOwner.functions.updateExpiryTimestamp(addressWithBalance, 12345)).to.be.revertedWith("Ownable: caller is not the owner")
  });

  it("setTrustedForwarder should update trusted forwarder address when called by owner", async function () {
    expect((await proxy.functions.trustedForwarder())[0]).to.equal(forwarderAddress)
    await (await proxy.functions.setTrustedForwarder(addressWithBalance)).wait()
    expect((await proxy.functions.trustedForwarder())[0]).to.equal(addressWithBalance)
  });

  it("setTrustedForwarder should revert if called by non-owner address", async function () {
    const [_, nonOwnerSigner] = (await ethers.getSigners())
    const proxyNonOwner = proxy.connect(nonOwnerSigner)
    await expect(proxyNonOwner.functions.setTrustedForwarder(addressWithBalance)).to.be.revertedWith("Ownable: caller is not the owner")
  });

  it("_beforeTokenTransfer should revert on NFT transfer except when burning", async function () {
    const [signer] = await ethers.getSigners()
    const receipt = await (await proxy.functions.safeMint(signer.address, 1123)).wait()
    const tokenId = await receipt.events[0].args.tokenId
    await expect(proxy.functions.transferFrom(signer.address, forwarderAddress, tokenId)).to.be.revertedWith("non transferable")
    await (await proxy.functions.burn(tokenId)).wait()
    expect((await proxy.functions.balanceOf(signer.address))[0]).to.equal(0)
  });

  it("tokenURI should return URI with expiry timestamp and display type as params", async function () {
    const [tokenURI] = await proxy.functions.tokenURI(addressWithBalanceTokenId);
    const data = JSON.parse(Buffer.from(tokenURI.split(",")[1], "base64").toString())
    const [name] = await proxy.functions.name()
    expect(data.name).to.equal(name)
    expect(data.image).to.equal(`https://clubhouse.com/nft/${proxy.address.toLowerCase()}_${addressWithBalanceTokenId}.png`)
  });

  it("renounceOwnership should revert", async function (){
    await expect(proxy.functions.renounceOwnership()).to.be.revertedWith("Cannot renounce ownership");
  });
});