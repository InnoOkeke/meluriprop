export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
export const CONTRACT_ADDRESSES = {
    ComplianceRegistry: '0x71F630430448edAa5fd2dAAd873917C4e078789a',
    RealEstateToken: '0xe5B2CdD99F80E39898cfffCd96086562350192c3',
    PropertiesRegistry: '0x8157c296d175bA336C3Ca471517D0A2176816eE3',
    USDC: '0x3600000000000000000000000000000000000000',
    Distribution: '0x794F76a1bF8763B6f0eaaF69fe43930fDc7Be547',
    Marketplace: '0xB805c9F6fE99312EB6c3DdB9BB5de5bF856AB13F',
    MeluriDAO: '0x11fb194306b779a11ae35c7059F6A4b2753C2Dbb'
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
