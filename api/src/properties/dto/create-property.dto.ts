export class CreatePropertyDto {
    name: string;
    description: string;
    location: string;
    valuation: number;
    targetRaise: number;
    minInvestment: number;
    images?: string[];
    documents?: string[];
    category?: string;
    tokenId?: number;
    contractAddress?: string;
}
