import { usePrivy, useWallets } from '@privy-io/react-auth';
import { createPublicClient, createWalletClient, custom, http } from 'viem';
import { circleArcTestnet, CONTRACT_ADDRESSES } from '@/config';
import { RealEstateTokenABI } from '@/lib/abis/RealEstateToken';
import { DistributionABI } from '@/lib/abis/Distribution';
import { useState } from 'react';
import { handleContractError, formatUSDC } from '@/lib/contract-utils';

export function usePortfolio() {
    const { wallets } = useWallets();
    const wallet = wallets[0];
    const [balances, setBalances] = useState<Record<number, bigint>>({});
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

    // Fetch token balances for multiple token IDs
    const fetchBalances = async (tokenIds: number[]) => {
        try {
            setLoading(true);
            const publicClient = getPublicClient();
            const tokenAddress = CONTRACT_ADDRESSES.RealEstateToken as `0x${string}`;

            const balancePromises = tokenIds.map(async (tokenId) => {
                const balance = await publicClient.readContract({
                    address: tokenAddress,
                    abi: RealEstateTokenABI,
                    functionName: 'balanceOf',
                    args: [wallet.address as `0x${string}`, BigInt(tokenId)],
                }) as bigint;

                return { tokenId, balance };
            });

            const results = await Promise.all(balancePromises);
            const balanceMap: Record<number, bigint> = {};

            results.forEach(({ tokenId, balance }) => {
                balanceMap[tokenId] = balance;
            });

            setBalances(balanceMap);
            return balanceMap;
        } catch (error) {
            console.error("Failed to fetch balances:", error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    // Get pending rent for a specific property
    const getPendingRent = async (tokenId: number): Promise<string> => {
        try {
            const publicClient = getPublicClient();
            const distributionAddress = CONTRACT_ADDRESSES.Distribution as `0x${string}`;

            const claimable = await publicClient.readContract({
                address: distributionAddress,
                abi: DistributionABI,
                functionName: 'claimableBalance',
                args: [wallet.address as `0x${string}`, BigInt(tokenId)],
            }) as bigint;

            return formatUSDC(claimable);
        } catch (error) {
            console.error("Failed to fetch pending rent:", error);
            return "0";
        }
    };

    // Claim rent for a single property
    const claimRent = async (tokenId: number): Promise<string> => {
        try {
            setLoading(true);
            const publicClient = getPublicClient();
            const walletClient = await getWalletClient();
            const distributionAddress = CONTRACT_ADDRESSES.Distribution as `0x${string}`;

            const { request } = await publicClient.simulateContract({
                account: wallet.address as `0x${string}`,
                address: distributionAddress,
                abi: DistributionABI,
                functionName: 'claimRent',
                args: [BigInt(tokenId)],
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

    // Claim all rent for multiple properties
    const claimAllRent = async (tokenIds: number[]): Promise<string> => {
        try {
            setLoading(true);
            const publicClient = getPublicClient();
            const walletClient = await getWalletClient();
            const distributionAddress = CONTRACT_ADDRESSES.Distribution as `0x${string}`;

            const tokenIdsBigInt = tokenIds.map(id => BigInt(id));

            const { request } = await publicClient.simulateContract({
                account: wallet.address as `0x${string}`,
                address: distributionAddress,
                abi: DistributionABI,
                functionName: 'claimAllRent',
                args: [tokenIdsBigInt],
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

    // Get total pending rent across all properties
    const getTotalPendingRent = async (tokenIds: number[]): Promise<string> => {
        try {
            const rentPromises = tokenIds.map(id => getPendingRent(id));
            const rents = await Promise.all(rentPromises);

            const total = rents.reduce((sum, rent) => {
                return sum + parseFloat(rent);
            }, 0);

            return total.toFixed(2);
        } catch (error) {
            console.error("Failed to get total pending rent:", error);
            return "0";
        }
    };

    return {
        balances,
        loading,
        txHash,
        fetchBalances,
        getPendingRent,
        getTotalPendingRent,
        claimRent,
        claimAllRent,
    };
}
