import { expect } from "chai";
import { Contract, ContractFactory } from "ethers";
import { ethers } from "hardhat";

describe("Membership NFT Proxy Factory Contract", function () {
  let Implementation: ContractFactory
  let proxyFactory: Contract
  let implementation: Contract
  let forwarder: Contract
  let proxy1: Contract
  let proxy2: Contract
  let beacon: Contract
  let upgradedImplementation: Contract

  this.beforeAll(async () => {
    const Forwarder = await ethers.getContractFactory("MinimalForwarder");
    forwarder = await Forwarder.deploy();
    Implementation = await ethers.getContractFactory("MembershipERC721");
    implementation = await Implementation.deploy();
    const ProxyFactory = await ethers.getContractFactory("MembershipERC721Factory");
    proxyFactory = await ProxyFactory.deploy(implementation.address);
    const beaconAddress = (await proxyFactory.functions.getBeacon())[0];
    const Beacon = await ethers.getContractFactory("UpgradeableBeacon");
    beacon = Beacon.attach(beaconAddress);

    // Create proxies to be used in tests
    const createProxy1Tx = await proxyFactory.functions.buildMembershipERC721Proxy("TEST1", "T1", forwarder.address, 1, 1);
    await createProxy1Tx.wait();
    proxy1 = Implementation.attach((await proxyFactory.functions.getMembershipERC721ProxyAddress(1))[0]);
    const createProxy2Tx = await proxyFactory.functions.buildMembershipERC721Proxy("TEST2", "T2", forwarder.address, 100, 2);
    await createProxy2Tx.wait();
    proxy2 = Implementation.attach((await proxyFactory.functions.getMembershipERC721ProxyAddress(2))[0]);

    // Mint one token from first proxy to wallet
    const [tokenOwner] = (await ethers.getSigners()); 
    const mintToProxy1Tx = await proxy1.functions.safeMint(tokenOwner.address, 0);
    await mintToProxy1Tx.wait();

    // Deploy second implementation to be used for upgrade test
    const UpgradedImplementation = await ethers.getContractFactory("MembershipERC721V2");
    upgradedImplementation = await UpgradedImplementation.deploy();

  });

  it("constructor should init beacon with caller as owner", async function () {
    const [expectedOwner] = (await ethers.getSigners());
    const [beaconOwnerAddress] = await beacon.functions.owner();
    const [beaconImplementationAddress] = await beacon.functions.implementation();
    expect(beaconOwnerAddress).to.equal(expectedOwner.address);
    expect(beaconImplementationAddress).to.equal(implementation.address);
  });

  it("buildMembershipERC721Proxy should revert if proxy exists for social club id", async function () {
    await expect(
      proxyFactory.buildMembershipERC721Proxy("TEST", "T", forwarder.address, 1, 1)
      ).to.be.revertedWith("membership proxy exists for social club");
  });

  it("buildMembershipERC721Proxy should create proxy if does not exist for social club id", async function () {
    const [proxyAddress] = await proxyFactory.functions.getMembershipERC721ProxyAddress(2);
    const proxy = Implementation.attach(proxyAddress);
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

  it("getMembershipERC721ProxyAddress should fetch proxy for correct social club id ", async function () {
    const [proxy1Address] = await proxyFactory.functions.getMembershipERC721ProxyAddress(1);
    const [proxy2Address] = await proxyFactory.functions.getMembershipERC721ProxyAddress(2);
    const fetchedProxy1 = Implementation.attach(proxy1Address);
    const fetchedProxy2 = Implementation.attach(proxy2Address);
    expect(fetchedProxy1.address).to.equal(proxy1.address);
    expect(fetchedProxy2.address).to.equal(proxy2.address);
    expect((await fetchedProxy1.functions.name())[0]).to.equal("TEST1");
    expect((await fetchedProxy2.functions.name())[0]).to.equal("TEST2");
    expect((await fetchedProxy1.functions.symbol())[0]).to.equal("T1");
    expect((await fetchedProxy2.functions.symbol())[0]).to.equal("T2");
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
    await expect(proxy1.functions.transferFrom(tokenOwner.address, receiverAddress, 0)).to.be.revertedWith("non transferable");

    // Upgrade
    const upgradeTx = await beacon.functions.upgradeTo(upgradedImplementation.address);
    await upgradeTx.wait();

    // After upgrade, tokens should be transferable
    const transferTx = await proxy1.functions.transferFrom(tokenOwner.address, "0x543c433afbF9E8bB5c621b61FA30f8b88cCa85a3", 0);
    await transferTx.wait();
   
    const [newBalance] = await proxy1.functions.balanceOf(receiverAddress);
    expect(newBalance).to.equal(1);
  });
});