export interface Property {
    id: number
    name: string
    location: string
    price: number
    roi: string
    investors: number
    status: "active" | "funded" | "coming-soon"
    imageUrl: string
    category?: string
    description?: string
    totalValue?: number
    tokenId?: number
}

export interface Investment {
    id: string
    amount: number
    tokens: number
    property: {
        name: string
        location: string
    }
}

export interface Proposal {
    id: number
    description: string
    permissionType: string
    endTime: string
    votes: {
        userId: string
        support: boolean
    }[]
}
