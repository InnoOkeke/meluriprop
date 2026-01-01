import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateProposalDto, PermissionType } from './dto/create-proposal.dto';
import { VoteDto } from './dto/vote.dto';

@Injectable()
export class DaoService {
    constructor(private prisma: PrismaService) { }

    async create(createProposalDto: CreateProposalDto) {
        return this.prisma.proposal.create({
            data: {
                description: createProposalDto.description,
                permissionType: createProposalDto.permissionType,
                targetTokenId: createProposalDto.targetTokenId,
                startTime: new Date(),
                endTime: new Date(Date.now() + createProposalDto.durationSeconds * 1000),
            },
        });
    }

    async findAll() {
        return this.prisma.proposal.findMany({
            include: {
                votes: true,
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    async vote(userId: string, voteDto: VoteDto) {
        const proposal = await this.prisma.proposal.findUnique({
            where: { id: voteDto.proposalId },
        });

        if (!proposal) throw new BadRequestException('Proposal not found');
        if (new Date() > proposal.endTime) throw new BadRequestException('Voting ended');

        // Check Permissions
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) throw new BadRequestException('User not found');

        if (proposal.permissionType === PermissionType.Global) {
            if (user.kycStatus !== 'VERIFIED') throw new BadRequestException('Must be verified to vote');
        } else if (proposal.permissionType === PermissionType.AnyInvestor) {
            const investments = await this.prisma.investment.count({ where: { userId } });
            if (investments === 0) throw new BadRequestException('Must be an investor to vote');
        } else if (proposal.permissionType === PermissionType.SpecificHolders) {
            if (!proposal.targetTokenId) throw new BadRequestException('Invalid proposal config');
            const investment = await this.prisma.investment.findFirst({
                where: { userId, propertyId: proposal.targetTokenId }, // Assuming Property ID maps to Token ID
            });
            if (!investment) throw new BadRequestException('Must hold specific property token to vote');
        }

        // Cast Vote
        return this.prisma.vote.create({
            data: {
                proposalId: voteDto.proposalId,
                userId,
                support: voteDto.support,
            },
        });
    }
}
