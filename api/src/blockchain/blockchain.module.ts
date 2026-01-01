import { Module, Global } from '@nestjs/common';
import { BlockchainService } from './blockchain.service';
import { ConfigModule } from '@nestjs/config';

@Global()
@Module({
    imports: [ConfigModule],
    providers: [BlockchainService],
    exports: [BlockchainService],
})
export class BlockchainModule { }
