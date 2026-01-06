import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function main() {
    try {
        const count = await prisma.property.count();
        console.log(`Total properties in DB: ${count}`);
        const products = await prisma.property.findMany();
        console.log(JSON.stringify(products, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
