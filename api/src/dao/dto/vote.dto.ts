import { IsInt, IsBoolean } from 'class-validator';

export class VoteDto {
    @IsInt()
    proposalId: number;

    @IsBoolean()
    support: boolean;
}
