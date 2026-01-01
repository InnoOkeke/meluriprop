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

const PROPERTIES_REGISTRY_ADDRESS = '0xF249B10d05394e4A4FB74802127ef096812306bB';

async function main() {
    console.log("Starting seed script...");

    // 1. Setup
    const prisma = new PrismaClient();

    const rpcUrl = process.env.RPC_URL || 'https://alfajores-forno.celo-testnet.org';
    const privateKey = process.env.PRIVATE_KEY;

    if (!privateKey) {
        throw new Error("PRIVATE_KEY not defined in .env");
    }

    console.log(`Connecting to ${rpcUrl}`);
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const wallet = new ethers.Wallet(privateKey, provider);
    const registry = new ethers.Contract(PROPERTIES_REGISTRY_ADDRESS, PropertiesRegistryABI.abi, wallet);

    // 2. Data (Lagos properties)
    const properties = [
        {
            name: "Luxury Apartment in VI",
            location: "Victoria Island, Lagos",
            val: "500000",
            raise: "100000",
            desc: "Premium 3-bedroom apartment with ocean view."
        },
        {
            name: "Commercial Hub Ikeja",
            location: "Ikeja, Lagos",
            val: "1000000",
            raise: "200000",
            desc: "Central business district office space near Ikeja Mall."
        },
        {
            name: "Waterfront Condo Ikoyi",
            location: "Ikoyi, Lagos",
            val: "2000000",
            raise: "500000",
            desc: "Exclusive waterfront living in the heart of Ikoyi."
        },
        {
            name: "Lekki Gardens Villa",
            location: "Lekki, Lagos",
            val: "750000",
            raise: "150000",
            desc: "Spacious family villa in a gated community."
        },
        {
            name: "Yaba Tech Park",
            location: "Yaba, Lagos",
            val: "3000000",
            raise: "1000000",
            desc: "Modern office complex for tech startups and innovation hubs."
        },
    ];

    // 3. Loop
    for (const p of properties) {
        console.log(`\nProcessing: ${p.name}`);

        // Check if already exists in DB to avoid dupes?
        // Actually, we want to mint on chain. If we re-run, we might mint duplicates on chain.
        // Ideally we check chain for duplicates or just assume fresh seed.
        // For now, we proceed.

        try {
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
            const dbVal = parseFloat(p.val); // Storing as simple number/decimal in DB? Model says Decimal.
            // Prisma Decimal expects string or number.

            await prisma.property.create({
                data: {
                    name: p.name,
                    description: p.desc,
                    location: p.location,
                    valuation: p.val, // Prisma handles string -> Decimal
                    targetRaise: p.raise,
                    minInvestment: 100, // default
                    tokenId: Number(tokenId),
                    contractAddress: PROPERTIES_REGISTRY_ADDRESS,
                    images: ["https://placehold.co/600x400"],
                    documents: ["QmHashPlaceholder"]
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
        // Disconnect prisma
    });
