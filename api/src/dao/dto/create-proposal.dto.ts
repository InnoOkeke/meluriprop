import { IsString, IsEnum, IsOptional, IsInt, IsBoolean } from 'class-validator';

export enum PermissionType {
    Global = 'Global',
    AnyInvestor = 'AnyInvestor',
    SpecificHolders = 'SpecificHolders',
}

export class CreateProposalDto {
    @IsString()
    description: string;

    @IsEnum(PermissionType)
    permissionType: PermissionType;

    @IsOptional()
    @IsInt()
    targetTokenId?: number;

    @IsInt()
    durationSeconds: number;
}
