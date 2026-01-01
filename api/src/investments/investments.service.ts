import { Injectable } from '@nestjs/common';
import { CreateInvestmentDto } from './dto/create-investment.dto';
import { UpdateInvestmentDto } from './dto/update-investment.dto';
import { PrismaService } from '../prisma.service';

@Injectable()
export class InvestmentsService {
  constructor(private prisma: PrismaService) { }

  async create(userId: string, createInvestmentDto: CreateInvestmentDto) {
    // 1. Get Property to check price/valuation
    const property = await this.prisma.property.findUnique({
      where: { id: createInvestmentDto.propertyId }
    });

    if (!property) throw new Error('Property not found');

    // 2. Calculate tokens (mock logic: $1 = 1 token for simplicity, or based on valuation)
    // For now, let's assume 1 token = $100 (min investment)
    const tokenPrice = 100;
    const tokens = createInvestmentDto.amount / tokenPrice;

    // 3. Create Investment Record
    return this.prisma.investment.create({
      data: {
        userId: userId,
        propertyId: createInvestmentDto.propertyId,
        amount: createInvestmentDto.amount,
        tokens: tokens,
      },
    });
  }

  findAll(userId: string) {
    return this.prisma.investment.findMany({
      where: { userId },
      include: { property: true }
    });
  }

  findOne(id: number) {
    return `This action returns a #${id} investment`;
  }

  update(id: number, updateInvestmentDto: UpdateInvestmentDto) {
    return `This action updates a #${id} investment`;
  }

  remove(id: number) {
    return `This action removes a #${id} investment`;
  }
}
