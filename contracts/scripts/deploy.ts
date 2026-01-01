import hre, { ethers, upgrades } from "hardhat";

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Deploying contracts with the account:", deployer.address);

    // 1. Deploy ComplianceRegistry
    const ComplianceRegistry = await ethers.getContractFactory("ComplianceRegistry");
    const complianceRegistry = await upgrades.deployProxy(ComplianceRegistry, [deployer.address], { initializer: 'initialize', kind: 'uups' });
    await complianceRegistry.waitForDeployment();
    console.log("ComplianceRegistry deployed to:", await complianceRegistry.getAddress());

    // 2. Deploy RealEstateToken
    const RealEstateToken = await ethers.getContractFactory("RealEstateToken");
    const realEstateToken = await upgrades.deployProxy(RealEstateToken, [deployer.address, await complianceRegistry.getAddress()], { initializer: 'initialize', kind: 'uups' });
    await realEstateToken.waitForDeployment();
    console.log("RealEstateToken deployed to:", await realEstateToken.getAddress());

    // 3. Deploy PropertiesRegistry
    const PropertiesRegistry = await ethers.getContractFactory("PropertiesRegistry");
    const propertiesRegistry = await upgrades.deployProxy(PropertiesRegistry, [deployer.address], { initializer: 'initialize', kind: 'uups' });
    await propertiesRegistry.waitForDeployment();
    console.log("PropertiesRegistry deployed to:", await propertiesRegistry.getAddress());

    // 4. Deploy Mock USDC (Testnet) - ONLY FOR DEV
    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    // Assuming MockUSDC is a standard ERC20, not upgradeable, for simplicity in tests
    // We need to create a MockUSDC contract first or use a standard one.
    // Let's assume we'll create it. if not, we skip.
    // For now, let's deploy a standard ERC20 if we want, or just placeholders.
    // We'll skip MockUSDC deployment here and assume it's done separately or we use a known address.

    // 5. Identify USDC address
    let usdcAddress = process.env.USDC_ADDRESS;
    const networkName = hre.network.name;

    if (networkName === "arc") {
        usdcAddress = "0x3600000000000000000000000000000000000000";
        console.log("Using Circle ARC Native USDC (ERC20 interface):", usdcAddress);
    }

    if (!usdcAddress) {
        console.log("No USDC_ADDRESS found for network " + networkName + ", deploying MockUSDC...");
        const MockERC20 = await ethers.getContractFactory("MockUSDC");
        const mockUsdc = await MockERC20.deploy("Mock USDC", "mUSDC");
        await mockUsdc.waitForDeployment();
        usdcAddress = await mockUsdc.getAddress();
        console.log("MockUSDC deployed to:", usdcAddress);
    }

    const Distribution = await ethers.getContractFactory("Distribution");
    const distribution = await upgrades.deployProxy(Distribution, [deployer.address, await realEstateToken.getAddress(), usdcAddress], { initializer: 'initialize', kind: 'uups' });
    await distribution.waitForDeployment();
    console.log("Distribution deployed to:", await distribution.getAddress());

    // 6. Deploy Marketplace
    const Marketplace = await ethers.getContractFactory("Marketplace");
    const marketplace = await upgrades.deployProxy(Marketplace, [deployer.address, await realEstateToken.getAddress(), usdcAddress], { initializer: 'initialize', kind: 'uups' });
    await marketplace.waitForDeployment();
    console.log("Marketplace deployed to:", await marketplace.getAddress());

    // 7. Deploy MeluriDAO
    const MeluriDAO = await ethers.getContractFactory("MeluriDAO");
    const meluriDAO = await upgrades.deployProxy(MeluriDAO, [deployer.address, await complianceRegistry.getAddress(), await realEstateToken.getAddress()], { initializer: 'initialize', kind: 'uups' });
    await meluriDAO.waitForDeployment();
    const daoAddress = await meluriDAO.getAddress();
    console.log("MeluriDAO deployed to:", daoAddress);

    const addresses = {
        complianceRegistry: await complianceRegistry.getAddress(),
        realEstateToken: await realEstateToken.getAddress(),
        propertiesRegistry: await propertiesRegistry.getAddress(),
        distribution: await distribution.getAddress(),
        marketplace: await marketplace.getAddress(),
        meluriDAO: daoAddress,
        usdc: usdcAddress
    };

    const fs = require("fs");
    fs.writeFileSync("addresses.json", JSON.stringify(addresses, null, 2));
    console.log("Addresses saved to addresses.json");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
