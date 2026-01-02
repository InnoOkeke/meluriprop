import { Module } from '@nestjs/common';
import { DaoService } from './dao.service';
import { DaoController } from './dao.controller';
import { PrismaService } from '../prisma.service';
import { AuthModule } from '../auth/auth.module';

@Module({
    imports: [AuthModule],
    controllers: [DaoController],
    providers: [DaoService, PrismaService],
})
export class DaoModule { }
