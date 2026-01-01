import { Controller, Get, Post, Body, UseGuards, Req } from '@nestjs/common';
import { DaoService } from './dao.service';
import { CreateProposalDto } from './dto/create-proposal.dto';
import { VoteDto } from './dto/vote.dto';
import { PrivyGuard } from '../auth/privy.guard';

@Controller('dao')
@UseGuards(PrivyGuard)
export class DaoController {
    constructor(private readonly daoService: DaoService) { }

    @Post('proposals')
    create(@Body() createProposalDto: CreateProposalDto) {
        // In a real app, check if req.user is admin
        return this.daoService.create(createProposalDto);
    }

    @Get('proposals')
    findAll() {
        return this.daoService.findAll();
    }

    @Post('vote')
    vote(@Req() req, @Body() voteDto: VoteDto) {
        return this.daoService.vote(req.user.id, voteDto);
    }
}
