import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESSES } from './constants';
import * as ComplianceRegistryABI from './abis/ComplianceRegistry.json';
import * as RealEstateTokenABI from './abis/RealEstateToken.json';
import * as PropertiesRegistryABI from './abis/PropertiesRegistry.json';
import * as MockUSDCABI from './abis/MockUSDC.json';
import * as DistributionABI from './abis/Distribution.json';
import * as MarketplaceABI from './abis/Marketplace.json';
import * as MeluriDAOABI from './abis/MeluriDAO.json';

@Injectable()
export class BlockchainService implements OnModuleInit {
    public provider: ethers.JsonRpcProvider;
    public signer: ethers.Wallet;

    public complianceRegistry: ethers.Contract;
    public realEstateToken: ethers.Contract;
    public propertiesRegistry: ethers.Contract;
    public mockUSDC: ethers.Contract;
    public distribution: ethers.Contract;
    public marketplace: ethers.Contract;
    public meluriDAO: ethers.Contract;

    constructor(private configService: ConfigService) { }

    onModuleInit() {
        const rpcUrl = this.configService.get<string>('RPC_URL') || 'http://127.0.0.1:8545';
        const privateKey = this.configService.get<string>('PRIVATE_KEY');

        this.provider = new ethers.JsonRpcProvider(rpcUrl);

        if (privateKey) {
            this.signer = new ethers.Wallet(privateKey, this.provider);
        }

        this.complianceRegistry = new ethers.Contract(CONTRACT_ADDRESSES.ComplianceRegistry, ComplianceRegistryABI.abi, this.signer || this.provider);
        this.realEstateToken = new ethers.Contract(CONTRACT_ADDRESSES.RealEstateToken, RealEstateTokenABI.abi, this.signer || this.provider);
        this.propertiesRegistry = new ethers.Contract(CONTRACT_ADDRESSES.PropertiesRegistry, PropertiesRegistryABI.abi, this.signer || this.provider);
        this.mockUSDC = new ethers.Contract(CONTRACT_ADDRESSES.MockUSDC, MockUSDCABI.abi, this.signer || this.provider);
        this.distribution = new ethers.Contract(CONTRACT_ADDRESSES.Distribution, DistributionABI.abi, this.signer || this.provider);
        this.marketplace = new ethers.Contract(CONTRACT_ADDRESSES.Marketplace, MarketplaceABI.abi, this.signer || this.provider);
        this.meluriDAO = new ethers.Contract(CONTRACT_ADDRESSES.MeluriDAO, MeluriDAOABI.abi, this.signer || this.provider);
    }

    getContract(name: keyof typeof CONTRACT_ADDRESSES): ethers.Contract {
        switch (name) {
            case 'ComplianceRegistry': return this.complianceRegistry;
            case 'RealEstateToken': return this.realEstateToken;
            case 'PropertiesRegistry': return this.propertiesRegistry;
            case 'MockUSDC': return this.mockUSDC;
            case 'Distribution': return this.distribution;
            case 'Marketplace': return this.marketplace;
            case 'MeluriDAO': return this.meluriDAO;
            default: throw new Error(`Contract ${name} not found`);
        }
    }
}
