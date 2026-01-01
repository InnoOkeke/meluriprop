import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';

@Injectable()
export class PrivyGuard implements CanActivate {
    constructor(private authService: AuthService) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const authHeader = request.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new UnauthorizedException('Missing or invalid Authorization header');
        }

        const token = authHeader.split(' ')[1];

        try {
            const verifiedClaims = await this.authService.verifyToken(token);
            request.user = verifiedClaims; // Attach claims to request object
            return true;
        } catch (error) {
            console.error('Token verification failed:', error);
            throw new UnauthorizedException('Invalid token');
        }
    }
}
