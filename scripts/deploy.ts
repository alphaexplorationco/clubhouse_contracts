import { ethers, upgrades } from "hardhat";

async function main() {
  const MembershipERC721 = await ethers.getContractFactory("MembershipERC721");
  const membership = await upgrades.deployProxy(MembershipERC721, [42]);
  await membership.deployed();
  console.log("MembershipERC721 deployed to:", membership.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
