import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { Contract, ContractFactory, Event } from "ethers";
import { ethers } from "hardhat";

describe("Membership NFT Proxy Factory Contract", function () {
  let Implementation: ContractFactory
  let ProxyFactory: ContractFactory
  let proxyFactory: Contract
  let implementation: Contract
  let forwarder: Contract
  let proxy1: Contract
  let proxy2: Contract
  let beacon: Contract
  let upgradedImplementation: Contract
  let beaconOwner: SignerWithAddress

  this.beforeAll(async () => {
    beaconOwner = (await ethers.getSigners())[5];
    const Forwarder = await ethers.getContractFactory("MinimalForwarder");
    forwarder = await Forwarder.deploy();
    Implementation = await ethers.getContractFactory("MembershipERC721");
    implementation = await Implementation.deploy();
    ProxyFactory = await ethers.getContractFactory("MembershipERC721Factory");
    proxyFactory = await ProxyFactory.deploy(implementation.address, beaconOwner.address);
    const beaconAddress = (await proxyFactory.functions.getBeacon())[0];
    const Beacon = await ethers.getContractFactory("UpgradeableBeacon");
    beacon = Beacon.attach(beaconAddress);

    // Create proxies to be used in tests
    const createProxy1Tx = await proxyFactory.functions.buildMembershipERC721Proxy("TEST1", "T1", forwarder.address);
    const createProxy1TxReceipt = await createProxy1Tx.wait();
    const proxy1Address = await createProxy1TxReceipt.events.slice(-1)[0].args.proxyAddress
    proxy1 = Implementation.attach(proxy1Address);
    const createProxy2Tx = await proxyFactory.functions.buildMembershipERC721Proxy("TEST2", "T2", forwarder.address);
    const createProxy2TxReceipt = await createProxy2Tx.wait();
    const proxy2Address = await createProxy2TxReceipt.events.slice(-1)[0].args.proxyAddress
    proxy2 = Implementation.attach(proxy2Address)

    // Mint one token from first proxy to wallet
    const [tokenOwner] = (await ethers.getSigners()); 
    const mintToProxy1Tx = await proxy1.functions.safeMint(tokenOwner.address, 0);
    await mintToProxy1Tx.wait();

    // Deploy second implementation to be used for upgrade test
    const UpgradedImplementation = await ethers.getContractFactory("MembershipERC721V2");
    upgradedImplementation = await UpgradedImplementation.deploy();

  });

  it("constructor should init beacon with correct owner", async function () {
    const [beaconOwnerAddress] = await beacon.functions.owner();
    const [beaconImplementationAddress] = await beacon.functions.implementation();
    expect(beaconOwnerAddress).to.equal(beaconOwner.address);
    expect(beaconImplementationAddress).to.equal(implementation.address);
  });

  it("buildMembershipERC721Proxy should create proxy and emit event", async function () {
    const proxy = Implementation.attach(proxy2.address);
    const [expectedOwner] = (await ethers.getSigners());
    const [proxyOwnerAddress] = await proxy.functions.owner()
    const [proxyForwarderAddress] = await proxy.functions.trustedForwarder();
    const [proxyTokenName] = await proxy.functions.name();
    const [proxyTokenSymbol] = await proxy.functions.symbol();
    expect(proxyOwnerAddress).to.equal(expectedOwner.address);
    expect(proxyTokenName).to.equal("TEST2");
    expect(proxyTokenSymbol).to.equal("T2");
    expect(proxyForwarderAddress).to.equal(forwarder.address);
  });

  it("buildMembershipERC721Proxy should emit event", async function () {
    expect(
      await proxyFactory.functions.buildMembershipERC721Proxy("TEST2", "T2", forwarder.address)
    ).to.emit(proxyFactory, "MembershipERC721ProxyCreated").withArgs(anyValue, "TEST2", "T2", forwarder.address)
  });

  it("buildMembershipERC721Proxy should not be callable by non-owner", async function () {
    const nonOwnerSigner = (await ethers.getSigners())[5];
    await expect(
        proxyFactory.connect(nonOwnerSigner).functions.buildMembershipERC721Proxy("TEST3", "T3", forwarder.address)
    ).to.be.revertedWith("Ownable: caller is not the owner");
  });

  it("getBeacon should return beacon address", async function () {
   expect((await proxyFactory.functions.getBeacon())[0]).to.equal(beacon.address);
  });

  it("getImplementation should return implementation contract address", async function () {
    expect((await proxyFactory.functions.getImplementation())[0]).to.equal(implementation.address);
  });

  it("beacon upgrade should replace implementation backing proxies", async function () {
    const [tokenOwner] = (await ethers.getSigners());
    const receiverAddress = "0x543c433afbF9E8bB5c621b61FA30f8b88cCa85a3"

    // Before upgrade, tokens should be non-transferable
    await expect(
      proxy1.functions.transferFrom(tokenOwner.address, receiverAddress, 0)
      ).to.be.revertedWithCustomError(proxy1, "NonTransferable").withArgs(await proxy1.signer.getAddress(), receiverAddress);

    // Upgrade
    const upgradeTx = await beacon.connect(beaconOwner).functions.upgradeTo(upgradedImplementation.address);
    await upgradeTx.wait();

    // After upgrade, tokens should be transferable
    const transferTx = await proxy1.functions.transferFrom(tokenOwner.address, "0x543c433afbF9E8bB5c621b61FA30f8b88cCa85a3", 0);
    await transferTx.wait();
   
    const [newBalance] = await proxy1.functions.balanceOf(receiverAddress);
    expect(newBalance).to.equal(1);
  });

  it("proxyWasCreatedByFactory should return true for existing proxy and false otherwise", async function () {
    const [proxy1Exists] = await proxyFactory.functions.proxyWasCreatedByFactory(proxy1.address);
    const [proxy2Exists] = await proxyFactory.functions.proxyWasCreatedByFactory(proxy2.address);
    const [randomAddressExists] = await proxyFactory.functions.proxyWasCreatedByFactory("0x543c433afbF9E8bB5c621b61FA30f8b88cCa85a3");
    expect(await proxy1Exists).to.equal(true);  
    expect(await proxy2Exists).to.equal(true);
    expect(await randomAddressExists).to.equal(false);
  });

  it("renounceOwnership should revert", async function() {
    const [owner] = await proxyFactory.functions.owner()
    await expect(proxyFactory.functions.renounceOwnership()).to.be.revertedWithCustomError(proxyFactory, "RenounceOwnership").withArgs(owner);
  });
});