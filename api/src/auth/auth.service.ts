import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrivyClient } from '@privy-io/server-auth';

@Injectable()
export class AuthService implements OnModuleInit {
    private privy: PrivyClient;

    constructor(private configService: ConfigService) { }

    onModuleInit() {
        const appId = this.configService.get<string>('PRIVY_APP_ID');
        const appSecret = this.configService.get<string>('PRIVY_APP_SECRET');

        // Fallback for dev/test if env vars are missing, though strictly should fail
        if (appId && appSecret) {
            this.privy = new PrivyClient(appId, appSecret);
        }
    }

    async verifyToken(token: string) {
        if (!this.privy) {
            throw new Error('Privy client not initialized');
        }
        return this.privy.verifyAuthToken(token);
    }

    async getUser(userId: string) {
        if (!this.privy) return null;
        return this.privy.getUser(userId);
    }
}
