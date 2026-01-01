import { Module } from '@nestjs/common';
import { InvestmentsService } from './investments.service';
import { InvestmentsController } from './investments.controller';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [InvestmentsController],
  providers: [InvestmentsService, PrismaService],
})
export class InvestmentsModule { }
