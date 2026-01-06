export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
export const CONTRACT_ADDRESSES = {
    ComplianceRegistry: '0x18f9898430824DC6452E29f7Fb011BD4051E5DD6',
    RealEstateToken: '0x13530Fa50A903d3029Ffff7B94eb314fe2dEe9d6',
    PropertiesRegistry: '0xA6c1DE875F39818B6cF8861bA16886F0776448Fd',
    USDC: '0x3600000000000000000000000000000000000000',
    Distribution: '0x00D9555D01938cd2f2Df0dA0aAeDF77a2bCbD070',
    Marketplace: '0x7e555f0EC95A3862691f687E00c8C3f5A2b7Ca21',
    MeluriDAO: '0x0d40Acd70873A4aE117EB90364b6A520F538E715'
};

// Define Circle ARC Testnet
export const circleArcTestnet = {
    id: 5042002,
    name: 'Circle ARC Testnet',
    network: 'circle-arc',
    nativeCurrency: { name: 'USDC', symbol: 'USDC', decimals: 18 },
    rpcUrls: {
        default: { http: ['https://rpc.testnet.arc.network'] },
        public: { http: ['https://rpc.testnet.arc.network'] },
    },
    blockExplorers: {
        default: { name: 'Explorer', url: 'https://explorer.testnet.arc.network' },
    },
    testnet: true,
};

// Admin wallet addresses (whitelist)
export const ADMIN_WALLETS = [
    '0x6c8c3fc2717ce887b41e85141b7acd7e0a197946',
    '0xfb5a00d5dfe4d9b149e4bfcf513afcba8900f298',
    // Add more admin wallets as needed
];
