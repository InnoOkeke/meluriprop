import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { PrivyGuard } from './privy.guard';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Get('profile')
    @UseGuards(PrivyGuard)
    getProfile(@Request() req) {
        return req.user;
    }
}
