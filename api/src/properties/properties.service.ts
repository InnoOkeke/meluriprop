import { Injectable } from '@nestjs/common';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { PrismaService } from '../prisma.service';

@Injectable()
export class PropertiesService {
  constructor(private prisma: PrismaService) { }

  async create(createPropertyDto: CreatePropertyDto) {
    return this.prisma.property.create({
      data: {
        name: createPropertyDto.name,
        description: createPropertyDto.description,
        location: createPropertyDto.location,
        valuation: createPropertyDto.valuation,
        targetRaise: createPropertyDto.targetRaise,
        minInvestment: createPropertyDto.minInvestment,
        images: createPropertyDto.images || [],
        documents: createPropertyDto.documents || [],
        category: createPropertyDto.category || "Residential",
        tokenId: createPropertyDto.tokenId ? Number(createPropertyDto.tokenId) : undefined,
        contractAddress: createPropertyDto.contractAddress || undefined,
      },
    });
  }

  findAll() {
    return this.prisma.property.findMany();
  }

  findOne(id: number) {
    return this.prisma.property.findUnique({ where: { id } });
  }

  update(id: number, updatePropertyDto: UpdatePropertyDto) {
    return `This action updates a #${id} property`;
  }

  remove(id: number) {
    return `This action removes a #${id} property`;
  }
}
