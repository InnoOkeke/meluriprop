import { ethers } from "hardhat";

async function main() {
    const PROPERTIES_REGISTRY_ADDRESS = "0x8157c296d175bA336C3Ca471517D0A2176816eE3";
    const MARKETPLACE_ADDRESS = "0xB805c9F6fE99312EB6c3DdB9BB5de5bF856AB13F";
    const REAL_ESTATE_TOKEN_ADDRESS = "0xe5B2CdD99F80E39898cfffCd96086562350192c3";
    const COMPLIANCE_REGISTRY_ADDRESS = "0x71F630430448edAa5fd2dAAd873917C4e078789a";

    console.log("----------------------------------------");
    console.log("STARTING COMPREHENSIVE SEEDING SCRIPT");
    console.log("----------------------------------------");

    const [deployer] = await ethers.getSigners();
    console.log("Using account:", deployer.address);

    // Check Native Balance
    const balance = await ethers.provider.getBalance(deployer.address);
    console.log(`Native Balance (Gas): ${ethers.formatUnits(balance, 18)} ETH/USDC`);

    // Contracts
    const PropertiesRegistry = await ethers.getContractFactory("PropertiesRegistry");
    const registry = PropertiesRegistry.attach(PROPERTIES_REGISTRY_ADDRESS);

    const Marketplace = await ethers.getContractFactory("Marketplace");
    const marketplace = Marketplace.attach(MARKETPLACE_ADDRESS);

    const RealEstateToken = await ethers.getContractFactory("RealEstateToken");
    const token = RealEstateToken.attach(REAL_ESTATE_TOKEN_ADDRESS);

    const ComplianceRegistry = await ethers.getContractFactory("ComplianceRegistry");
    const compliance = ComplianceRegistry.attach(COMPLIANCE_REGISTRY_ADDRESS);

    // 1. Ensure Admin is KYC Verified (Required to receive tokens)
    console.log("\n1. Checking Compliance...");
    const isVerified = await compliance.checkCompliance(deployer.address);
    if (!isVerified) {
        console.log("  Admin not verified. Verifying now...");
        const tx = await compliance.updateIdentity(deployer.address, true, "NG");
        await tx.wait();
        console.log("  Admin Verified!");
    } else {
        console.log("  Admin already verified.");
    }

    // 2. Approve Marketplace
    console.log("\n2. Checking Marketplace Approval...");
    const isApproved = await token.isApprovedForAll(deployer.address, MARKETPLACE_ADDRESS);
    if (!isApproved) {
        const approveTx = await token.setApprovalForAll(MARKETPLACE_ADDRESS, true);
        await approveTx.wait();
        console.log("  Approved Marketplace!");
    } else {
        console.log("  Marketplace already approved.");
    }

    const DEMO_PROPERTIES = [
        {
            name: "Lagos Tech Campus",
            location: "Yaba, Lagos",
            documentIPFS: "QmTechCampus123",
            valuation: "2000000",
            targetRaise: "2000000",
            totalTokens: "20000", // $100/token
            category: 1 // Commercial
        },
        {
            name: "Eko Atlantic Tower A",
            location: "Eko Atlantic, Lagos",
            documentIPFS: "QmEkoAtlantic456",
            valuation: "5000000",
            targetRaise: "5000000",
            totalTokens: "10000", // $500/token
            category: 0 // Residential
        },
        {
            name: "Banana Island Villa",
            location: "Banana Island, Lagos",
            documentIPFS: "QmBananaVilla789",
            valuation: "1200000",
            targetRaise: "1200000",
            totalTokens: "12000", // $100/token
            category: 0 // Residential
        },
        {
            name: "Mainland Warehouse Logistics",
            location: "Ikeja Industrial, Lagos",
            documentIPFS: "QmWarehouseABC",
            valuation: "750000",
            targetRaise: "750000",
            totalTokens: "15000", // $50/token
            category: 1 // Commercial
        },
        {
            name: "Surulere Studio Lofts",
            location: "Surulere, Lagos",
            documentIPFS: "QmSurulereXYZ",
            valuation: "300000",
            targetRaise: "300000",
            totalTokens: "6000", // $50/token
            category: 2 // Shortlet
        }
    ];

    for (const p of DEMO_PROPERTIES) {
        console.log(`\nProcessing Property: ${p.name}...`);
        try {
            // A. Register
            console.log("  A. Registering...");
            const regTx = await registry.registerProperty(
                p.name,
                p.location,
                p.documentIPFS,
                ethers.parseUnits(p.valuation, 6),
                ethers.parseUnits(p.targetRaise, 6),
                BigInt(p.totalTokens),
                p.category, // Pass Category
                { gasLimit: 500000 }
            );
            const receipt = await regTx.wait();

            // Find TokenID
            let tokenId = null;
            for (const log of receipt.logs) {
                try {
                    const parsed = registry.interface.parseLog(log);
                    if (parsed && parsed.name === 'PropertyRegistered') {
                        tokenId = parsed.args[0];
                        break;
                    }
                } catch (e) { }
            }

            if (tokenId == null) {
                console.error("  Could not find TokenID! Skipping.");
                continue;
            }
            console.log(`  > Registered TokenID: ${tokenId}`);

            // B. Mint Tokens to Admin
            console.log("  B. Minting Tokens to Admin...");
            const mintTx = await token.mint(
                deployer.address,
                tokenId,
                BigInt(p.totalTokens),
                "0x",
                { gasLimit: 500000 }
            );
            await mintTx.wait();
            console.log(`  > Minted ${p.totalTokens} tokens`);

            // C. Create Listing
            console.log("  C. Listing on Marketplace...");
            const valuation = Number(p.valuation);
            const totalTokens = Number(p.totalTokens);
            const pricePerShare = valuation / totalTokens;

            const listTx = await marketplace.createListing(
                tokenId,
                BigInt(totalTokens),
                ethers.parseUnits(pricePerShare.toString(), 6),
                { gasLimit: 500000 }
            );
            await listTx.wait();
            console.log("  > Listed Successfully!");

        } catch (error: any) {
            console.error(`  Failed: ${error.message}`);
            if (error.message.includes("Insufficient funds")) {
                console.error("  CRITICAL: Out of Gas.");
                break;
            }
        }
    }

    console.log("\n----------------------------------------");
    console.log("SEEDING COMPLETE");
    console.log("----------------------------------------");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
