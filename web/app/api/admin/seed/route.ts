import { NextResponse } from 'next/server';
import { createPublicClient, createWalletClient, http, parseUnits } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { circleArcTestnet } from '@/config'; // Assuming this exports the chain definition
import { PropertiesRegistryABI } from '@/lib/abis/PropertiesRegistry';
import { CONTRACT_ADDRESSES } from '@/config';

const DEMO_PROPERTIES = [
    {
        name: "Ikoyi Luxury Apartment",
        location: "Ikoyi, Lagos",
        documentIPFS: "QmX7yP8j5e6k3o9q4t2u1v0w5x8y7z",
        valuation: "150000",
        targetRaise: "150000",
        totalTokens: "3000"
    },
    {
        name: "Victoria Island Commercial Hub",
        location: "Victoria Island, Lagos",
        documentIPFS: "QmA1b2c3d4e5f6g7h8i9j0k1l2m3n",
        valuation: "450000",
        targetRaise: "450000",
        totalTokens: "4500"
    },
    {
        name: "Lekki Shortlet Haven",
        location: "Lekki Phase 1, Lagos",
        documentIPFS: "QmO9p8q7r6s5t4u3v2w1x0y9z8a7b",
        valuation: "850000",
        targetRaise: "850000",
        totalTokens: "17000"
    },
    {
        name: "Ikeja Retail Plaza",
        location: "Ikeja, Lagos",
        documentIPFS: "QmZ1y2x3w4v5u6t7s8r9q0p1o2n3m",
        valuation: "200000",
        targetRaise: "200000",
        totalTokens: "4000"
    },
    {
        name: "Waterfront Condo VI",
        location: "Victoria Island, Lagos",
        documentIPFS: "QmK1l2m3n4o5p6q7r8s9t0u1v2w",
        valuation: "320000",
        targetRaise: "320000",
        totalTokens: "3200"
    },
    {
        name: "Lekki Commercial Complex",
        location: "Lekki, Lagos",
        documentIPFS: "QmV3w4x5y6z7a8b9c0d1e2f3g4h",
        valuation: "600000",
        targetRaise: "600000",
        totalTokens: "6000"
    },
    {
        name: "Ikoyi Residential Estate",
        location: "Ikoyi, Lagos",
        documentIPFS: "QmJ5k6l7m8n9o0p1q2r3s4t5u6v",
        valuation: "950000",
        targetRaise: "950000",
        totalTokens: "9500"
    }
];

export async function POST() {
    try {
        const privateKey = process.env.PRIVATE_KEY;
        if (!privateKey) {
            return NextResponse.json({ error: "Server private key not configured" }, { status: 500 });
        }

        const account = privateKeyToAccount(privateKey as `0x${string}`);

        const client = createWalletClient({
            account,
            chain: circleArcTestnet,
            transport: http()
        });

        const publicClient = createPublicClient({
            chain: circleArcTestnet,
            transport: http()
        });

        const results = [];
        let successCount = 0;

        // Execute transactions sequentially
        for (const p of DEMO_PROPERTIES) {
            try {
                const hash = await client.writeContract({
                    address: CONTRACT_ADDRESSES.PropertiesRegistry as `0x${string}`,
                    abi: PropertiesRegistryABI,
                    functionName: 'registerProperty',
                    args: [
                        p.name,
                        p.location,
                        p.documentIPFS,
                        parseUnits(p.valuation, 6), // USDC 6 decimals
                        parseUnits(p.targetRaise, 6),
                        BigInt(p.totalTokens)
                    ]
                });

                // Wait for receipt to ensure nonce ordering and success
                await publicClient.waitForTransactionReceipt({ hash });

                results.push({ name: p.name, status: 'success', hash });
                successCount++;
            } catch (err: any) {
                console.error(`Failed to see ${p.name}`, err);
                results.push({ name: p.name, status: 'error', error: err.message });
            }
        }

        return NextResponse.json({
            success: true,
            seeded: successCount,
            results
        });

    } catch (error: any) {
        console.error("Seeding error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
