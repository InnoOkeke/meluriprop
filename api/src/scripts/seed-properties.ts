import { PrismaClient } from '@prisma/client';
import { ethers } from 'ethers';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

// Load env vars from api/.env
const envPath = path.resolve(__dirname, '../../../.env');
dotenv.config({ path: envPath });

// ABI Import workaround for raw TS script
const abiPath = path.resolve(__dirname, '../blockchain/abis/PropertiesRegistry.json');
const PropertiesRegistryABI = JSON.parse(fs.readFileSync(abiPath, 'utf8'));

const PROPERTIES_REGISTRY_ADDRESS = '0xA6c1DE875F39818B6cF8861bA16886F0776448Fd';

async function main() {
    console.log("Starting seed script...");

    // 1. Setup
    const prisma = new PrismaClient();

    const rpcUrl = process.env.RPC_URL || 'https://rpc.testnet.arc.network';
    const privateKey = process.env.PRIVATE_KEY;

    if (!privateKey) {
        throw new Error("PRIVATE_KEY not defined in .env");
    }

    console.log(`Connecting to ${rpcUrl}`);
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const wallet = new ethers.Wallet(privateKey, provider);
    const registry = new ethers.Contract(PROPERTIES_REGISTRY_ADDRESS, PropertiesRegistryABI.abi, wallet);

    // 2. Data (Lagos properties matching frontend assets)
    const properties = [
        {
            name: "Eko Atlantic Premium",
            location: "Eko Atlantic City, Lagos",
            val: "500000",
            raise: "100000",
            desc: "Premium waterfront apartment with ocean view.",
            image: "/images/property_vi_waterfront.png",
            category: "Residential"
        },
        {
            name: "Mainland Retail Hub",
            location: "Ikeja, Lagos",
            val: "1000000",
            raise: "200000",
            desc: "Central business district retail space near Ikeja Mall.",
            image: "/images/property_ikeja_retail_1767224752311.png",
            category: "Commercial"
        },
        {
            name: "Banana Island Mansion",
            location: "Banana Island, Ikoyi",
            val: "2000000",
            raise: "500000",
            desc: "Exclusive luxury living in Nigeria's most prestigious neighborhood.",
            image: "/images/property_ikoyi_luxury.png",
            category: "Residential"
        },
        {
            name: "Surulere Shortlet Scheme",
            location: "Surulere, Lagos",
            val: "750000",
            raise: "150000",
            desc: "High-yield shortlet apartments in a cultural hotspot.",
            image: "/images/property_lekki_shortlet_1767224780085.png",
            category: "Shortlet"
        },
        {
            name: "Lagos Tech Valley",
            location: "Yaba, Lagos",
            val: "3000000",
            raise: "1000000",
            desc: "Modern office complex for tech startups and innovation hubs.",
            image: "/images/property_vi_commercial_1767224722088.png",
            category: "Commercial"
        },
    ];

    // 3. Loop
    for (const p of properties) {
        console.log(`\nProcessing: ${p.name}`);

        try {
            // Check if exists in DB to avoid duplicates (based on name)
            const existing = await prisma.property.findFirst({
                where: { name: p.name }
            });

            if (existing) {
                console.log(`Property ${p.name} already in DB. Skipping minting to save gas.`);
                continue;
            }

            // Convert to Wei (18 decimals)
            const valuationWei = ethers.parseUnits(p.val, 18);
            const raiseWei = ethers.parseUnits(p.raise, 18);
            const totalTokens = valuationWei; // 1 token = 1 unit

            console.log(`Minting on blockchain...`);
            const tx = await registry.registerProperty(
                p.name,
                p.location,
                "QmHashPlaceholder", // IPFS
                valuationWei,
                raiseWei,
                totalTokens
            );
            console.log(`Tx sent: ${tx.hash}. Waiting for confirmation...`);

            const receipt = await tx.wait();

            // Parse logs to find TokenId
            let tokenId = null;
            for (const log of receipt.logs) {
                try {
                    const parsed = registry.interface.parseLog(log);
                    if (parsed && parsed.name === 'PropertyRegistered') {
                        tokenId = parsed.args.tokenId;
                        console.log(`Event Token ID: ${tokenId}`);
                        break;
                    }
                } catch (e) {
                    // ignore other events
                }
            }

            if (!tokenId) {
                console.error("Could not find TokenId in logs!");
                continue;
            }

            console.log(`Creating Database Record for Token ID ${tokenId}...`);

            await prisma.property.create({
                data: {
                    name: p.name,
                    description: p.desc,
                    location: p.location,
                    valuation: p.val,
                    targetRaise: p.raise,
                    minInvestment: 100,
                    tokenId: Number(tokenId),
                    contractAddress: PROPERTIES_REGISTRY_ADDRESS,
                    images: [p.image],
                    documents: ["QmHashPlaceholder"],
                    category: p.category
                }
            });
            console.log(`Success.`);

        } catch (error) {
            console.error(`Failed to process ${p.name}:`, error);
        }
    }

    console.log("\nSeeding complete.");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        // Disconnect prisma if needed, though script exit handles it
    });
