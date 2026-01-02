import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const DEMO_PROPERTIES = [
    {
        name: "Ikoyi Luxury Apartment",
        location: "Ikoyi, Lagos",
        description: "High-end luxury apartment in the heart of Ikoyi.",
        valuation: "150000",
        targetRaise: "150000",
        minInvestment: "100",
        tokenId: 1
    },
    {
        name: "Victoria Island Commercial Hub",
        location: "Victoria Island, Lagos",
        description: "Prime commercial space in VI.",
        valuation: "450000",
        targetRaise: "450000",
        minInvestment: "500",
        tokenId: 2
    },
    {
        name: "Lekki Shortlet Haven",
        location: "Lekki Phase 1, Lagos",
        description: "Profitable shortlet investment.",
        valuation: "850000",
        targetRaise: "850000",
        minInvestment: "250",
        tokenId: 3
    }
];

async function main() {
    console.log(`Start seeding ...`);
    for (const p of DEMO_PROPERTIES) {
        const property = await prisma.property.create({
            data: p,
        });
        console.log(`Created property with id: ${property.id}`);
    }
    console.log(`Seeding finished.`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
