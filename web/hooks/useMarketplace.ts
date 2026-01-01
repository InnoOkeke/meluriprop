import { usePrivy, useWallets } from '@privy-io/react-auth';
import { createPublicClient, createWalletClient, custom, http, parseUnits, formatUnits } from 'viem';
import { circleArcTestnet, CONTRACT_ADDRESSES } from '@/config';
import { MarketplaceABI } from '@/lib/abis/Marketplace';
import { PropertiesRegistryABI } from '@/lib/abis/PropertiesRegistry';
import { USDCABI } from '@/lib/abis/USDC';
import { useState } from 'react';
import { handleContractError, formatUSDC, parseUSDC } from '@/lib/contract-utils';

interface Listing {
    seller: string;
    tokenId: bigint;
    amount: bigint;
    pricePerShare: bigint;
    isActive: boolean;
}

export function useMarketplace() {
    const { wallets } = useWallets();
    const wallet = wallets[0];
    const [loading, setLoading] = useState(false);
    const [txHash, setTxHash] = useState<string | null>(null);

    const getPublicClient = () => {
        return createPublicClient({
            chain: circleArcTestnet,
            transport: http(),
        });
    };

    const getWalletClient = async () => {
        if (!wallet) throw new Error("No wallet connected");
        const provider = await wallet.getEthereumProvider();
        return createWalletClient({
            account: wallet.address as `0x${string}`,
            chain: circleArcTestnet,
            transport: custom(provider),
        });
    };

    // Get USDC allowance for marketplace
    const getUSDCAllowance = async (): Promise<bigint> => {
        const publicClient = getPublicClient();
        const usdcAddress = CONTRACT_ADDRESSES.USDC as `0x${string}`;
        const marketplaceAddress = CONTRACT_ADDRESSES.Marketplace as `0x${string}`;

        const allowance = await publicClient.readContract({
            address: usdcAddress,
            abi: USDCABI,
            functionName: 'allowance',
            args: [wallet.address as `0x${string}`, marketplaceAddress],
        }) as bigint;

        return allowance;
    };

    // Approve USDC for marketplace
    const approveUSDC = async (amount: string): Promise<string> => {
        try {
            setLoading(true);
            const publicClient = getPublicClient();
            const walletClient = await getWalletClient();
            const usdcAddress = CONTRACT_ADDRESSES.USDC as `0x${string}`;
            const marketplaceAddress = CONTRACT_ADDRESSES.Marketplace as `0x${string}`;

            const amountWei = parseUSDC(amount);

            const { request } = await publicClient.simulateContract({
                account: wallet.address as `0x${string}`,
                address: usdcAddress,
                abi: USDCABI,
                functionName: 'approve',
                args: [marketplaceAddress, amountWei],
            });

            const hash = await walletClient.writeContract(request);
            setTxHash(hash);

            // Wait for confirmation
            await publicClient.waitForTransactionReceipt({ hash });

            return hash;
        } catch (error) {
            throw new Error(handleContractError(error));
        } finally {
            setLoading(false);
        }
    };

    // Buy property tokens
    const buyProperty = async (listingId: number, amount: number): Promise<string> => {
        try {
            setLoading(true);
            const publicClient = getPublicClient();
            const walletClient = await getWalletClient();
            const marketplaceAddress = CONTRACT_ADDRESSES.Marketplace as `0x${string}`;

            const { request } = await publicClient.simulateContract({
                account: wallet.address as `0x${string}`,
                address: marketplaceAddress,
                abi: MarketplaceABI,
                functionName: 'buyListing',
                args: [BigInt(listingId), BigInt(amount)],
            });

            const hash = await walletClient.writeContract(request);
            setTxHash(hash);

            // Wait for confirmation
            await publicClient.waitForTransactionReceipt({ hash });

            return hash;
        } catch (error) {
            throw new Error(handleContractError(error));
        } finally {
            setLoading(false);
        }
    };

    // Get single listing details
    const getListing = async (listingId: number): Promise<Listing> => {
        const publicClient = getPublicClient();
        const data = await publicClient.readContract({
            address: CONTRACT_ADDRESSES.Marketplace as `0x${string}`,
            abi: MarketplaceABI,
            functionName: 'listings',
            args: [BigInt(listingId)],
        }) as any;

        return {
            seller: data[0],
            tokenId: data[1],
            amount: data[2],
            pricePerShare: data[3],
            isActive: data[4],
        };
    };

    // Get property details from Registry
    const getProperty = async (tokenId: number) => {
        const publicClient = getPublicClient();
        const registryAddress = CONTRACT_ADDRESSES.PropertiesRegistry as `0x${string}`;
        // We need PropertiesRegistry ABI here. Assuming it is imported or available.
        // If not, we should import it.
        // It seems PropertiesRegistryABI is not imported in the original file.
        // checking imports...
        // We need to add import { PropertiesRegistryABI } from '@/lib/abis/PropertiesRegistry'; at the top.

        const data = await publicClient.readContract({
            address: registryAddress,
            abi: PropertiesRegistryABI,
            functionName: 'getProperty',
            args: [BigInt(tokenId)],
        }) as any;

        return {
            name: data.name,
            location: data.location,
            documentIPFS: data.documentIPFS,
            valuation: data.valuation,
            targetRaise: data.targetRaise,
            totalTokens: data.totalTokens,
            category: data.category,
            isActive: data.isActive
        };
    };

    // Get all active listings with property details
    const getActiveListings = async (): Promise<Array<Listing & { listingId: number, property: any }>> => {
        const publicClient = getPublicClient();
        const marketplaceAddress = CONTRACT_ADDRESSES.Marketplace as `0x${string}`;

        // Get nextListingId to know how many listings exist
        const nextListingId = await publicClient.readContract({
            address: marketplaceAddress,
            abi: MarketplaceABI,
            functionName: 'nextListingId',
        }) as bigint;

        const listings: Array<Listing & { listingId: number, property: any }> = [];

        // Fetch all listings and their property details
        for (let i = 1; i < Number(nextListingId); i++) {
            try {
                const listing = await getListing(i);
                if (listing.isActive) {
                    // Fetch generic property details using the listing's tokenId
                    const propertyDetails = await getProperty(Number(listing.tokenId));
                    listings.push({
                        ...listing,
                        listingId: i,
                        property: propertyDetails
                    });
                }
            } catch (error) {
                console.warn(`Failed to fetch listing ${i}:`, error);
            }
        }

        return listings;
    };

    // Calculate total purchase price
    const calculatePurchasePrice = (pricePerShare: bigint, amount: number): string => {
        const totalPrice = pricePerShare * BigInt(amount);
        return formatUSDC(totalPrice);
    };



    return {
        buyProperty,
        approveUSDC,
        getListing,
        getProperty, // Exported
        getActiveListings,
        getUSDCAllowance,
        calculatePurchasePrice,
        loading,
        txHash,
    };
}
