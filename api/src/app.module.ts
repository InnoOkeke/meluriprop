import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { PropertiesModule } from './properties/properties.module';
import { InvestmentsModule } from './investments/investments.module';
import { DaoModule } from './dao/dao.module';
import { BlockchainModule } from './blockchain/blockchain.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), AuthModule, PropertiesModule, InvestmentsModule, DaoModule, BlockchainModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
