const { PrismaClient } = require('@prisma/client');
const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

// Simple .env parser
function loadEnv() {
    try {
        const envPath = path.resolve(__dirname, '../../.env');
        console.log("Loading .env from:", envPath);

        if (fs.existsSync(envPath)) {
            const data = fs.readFileSync(envPath, 'utf8');
            data.split('\n').forEach(line => {
                const parts = line.split('=');
                if (parts.length >= 2) {
                    const key = parts[0].trim();
                    const value = parts.slice(1).join('=').trim();
                    if (key && value && !key.startsWith('#')) {
                        process.env[key] = value;
                    }
                }
            });
            console.log("Loaded .env file.");
        } else {
            console.log("WARNING: .env file not found at " + envPath);
        }
    } catch (e) {
        console.error("Error loading .env:", e.message);
    }
}

loadEnv();

// Debug Env Vars
console.log("Environment Check:");
console.log("RPC_URL:", process.env.RPC_URL || "Using Default");
console.log("PRIVATE_KEY:", process.env.PRIVATE_KEY ? "Set (starts with " + process.env.PRIVATE_KEY.substring(0, 6) + "...)" : "NOT SET");
console.log("DATABASE_URL:", process.env.DATABASE_URL ? "Set" : "NOT SET");

const abiPath = path.resolve(__dirname, '../blockchain/abis/PropertiesRegistry.json');
let PropertiesRegistryABI;
try {
    PropertiesRegistryABI = JSON.parse(fs.readFileSync(abiPath, 'utf8'));
} catch (e) {
    console.error("Failed to load ABI from", abiPath);
    process.exit(1);
}

const PROPERTIES_REGISTRY_ADDRESS = '0xF249B10d05394e4A4FB74802127ef096812306bB';
const ARC_TESTNET_RPC = 'https://rpc.testnet.arc.network';

async function main() {
    console.log("Starting main execution...");

    let prisma;
    try {
        console.log("Initializing Prisma Client...");
        prisma = new PrismaClient();
        // Force connection test
        await prisma.$connect();
        console.log("Prisma Connected successfully.");
    } catch (e) {
        console.error("Failed to connect to Database via Prisma:", e.message);
        process.exit(1);
    }

    const rpcUrl = process.env.RPC_URL || ARC_TESTNET_RPC;
    const privateKey = process.env.PRIVATE_KEY;

    if (!privateKey) {
        console.error("CRITICAL: PRIVATE_KEY not defined.");
        process.exit(1);
    }

    console.log(`Setting up Provider: ${rpcUrl}`);
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const wallet = new ethers.Wallet(privateKey, provider);

    console.log(`Wallet Address: ${wallet.address}`);

    const registry = new ethers.Contract(PROPERTIES_REGISTRY_ADDRESS, PropertiesRegistryABI.abi, wallet);

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

    for (const p of properties) {
        console.log(`\n-----------------------------------`);
        console.log(`Processing: ${p.name}`);

        try {
            const valuationWei = ethers.parseUnits(p.val, 18);
            const raiseWei = ethers.parseUnits(p.raise, 18);
            const totalTokens = valuationWei;

            console.log(`Minting on blockchain...`);
            // Estimate gas first to check for reverts
            try {
                await registry.registerProperty.estimateGas(
                    p.name,
                    p.location,
                    "QmHashPlaceholder",
                    valuationWei,
                    raiseWei,
                    totalTokens
                );
            } catch (estimErr) {
                console.error("Gas Estimate Failed (Will revert):", estimErr.shortMessage || estimErr.message);
                if (estimErr.data) console.error("Revert Data:", estimErr.data);
                continue; // Skip this one
            }

            const tx = await registry.registerProperty(
                p.name,
                p.location,
                "QmHashPlaceholder",
                valuationWei,
                raiseWei,
                totalTokens
            );
            console.log(`Tx sent: ${tx.hash}`);
            console.log(`Waiting for confirmation...`);
            const receipt = await tx.wait();

            let tokenId = null;
            for (const log of receipt.logs) {
                try {
                    const parsed = registry.interface.parseLog(log);
                    if (parsed && parsed.name === 'PropertyRegistered') {
                        tokenId = parsed.args.tokenId;
                        console.log(`Event Token ID: ${tokenId}`);
                        break;
                    }
                } catch (e) { }
            }

            if (!tokenId) {
                console.error("Could not find TokenId in logs! Contract address might be wrong for ARC or check 'PropertyRegistered' event.");
                continue;
            }

            console.log(`Creating Database Record...`);
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
                    images: ["https://placehold.co/600x400"],
                    documents: ["QmHashPlaceholder"]
                }
            });
            console.log(`Success DB Insert.`);

        } catch (error) {
            console.error(`Failed execution step for ${p.name}:`, error.message);
        }
    }
    console.log("\nSeeding attempt complete.");
}

main().catch(e => console.error("Fatal Script Error:", e)).finally(() => process.exit(0));
