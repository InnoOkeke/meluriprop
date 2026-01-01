import { usePrivy, useWallets } from '@privy-io/react-auth';
import { createPublicClient, createWalletClient, custom, http } from 'viem';
import { circleArcTestnet, CONTRACT_ADDRESSES, ADMIN_WALLETS } from '@/config';
import { PropertiesRegistryABI } from '@/lib/abis/PropertiesRegistry';
import { MarketplaceABI } from '@/lib/abis/Marketplace';
import { MeluriDAOABI } from '@/lib/abis/MeluriDAO';
import { DistributionABI } from '@/lib/abis/Distribution';
import { useState, useMemo } from 'react';
import { handleContractError, parseUSDC } from '@/lib/contract-utils';

export function useAdmin() {
    const { wallets } = useWallets();
    const wallet = wallets[0];
    const [loading, setLoading] = useState(false);
    const [txHash, setTxHash] = useState<string | null>(null);

    // Check if current wallet is an admin
    const isAdmin = useMemo(() => {
        if (!wallet?.address) return false;
        return ADMIN_WALLETS.map(a => a.toLowerCase()).includes(wallet.address.toLowerCase());
    }, [wallet?.address]);

    const getPublicClient = () => {
        return createPublicClient({
            chain: circleArcTestnet,
            transport: http(),
        });
    };

    const getWalletClient = async () => {
        if (!wallet) throw new Error("No wallet connected");
        if (!isAdmin) throw new Error("Not authorized");
        const provider = await wallet.getEthereumProvider();
        return createWalletClient({
            account: wallet.address as `0x${string}`,
            chain: circleArcTestnet,
            transport: custom(provider),
        });
    };

    // Register a new property
    const registerProperty = async (
        name: string,
        location: string,
        documentIPFS: string,
        valuation: string,
        targetRaise: string,
        totalTokens: string
    ): Promise<{ hash: string; tokenId?: number }> => {
        try {
            setLoading(true);
            const publicClient = getPublicClient();
            const walletClient = await getWalletClient();
            const registryAddress = CONTRACT_ADDRESSES.PropertiesRegistry as `0x${string}`;

            const valuationWei = parseUSDC(valuation);
            const targetRaiseWei = parseUSDC(targetRaise);
            const totalTokensBigInt = BigInt(totalTokens);

            const { request } = await publicClient.simulateContract({
                account: wallet.address as `0x${string}`,
                address: registryAddress,
                abi: PropertiesRegistryABI,
                functionName: 'registerProperty',
                args: [name, location, documentIPFS, valuationWei, targetRaiseWei, totalTokensBigInt],
            });

            const hash = await walletClient.writeContract(request);
            setTxHash(hash);

            // Wait for confirmation and get receipt
            const receipt = await publicClient.waitForTransactionReceipt({ hash });

            // Try to extract tokenId from event logs
            let tokenId: number | undefined;
            try {
                const propertyRegisteredLog = receipt.logs.find(log =>
                    log.topics[0] === '0x...' // PropertyRegistered event signature
                );
                // Parse tokenId from log if available
            } catch (err) {
                console.warn("Could not extract tokenId from logs");
            }

            return { hash, tokenId };
        } catch (error) {
            throw new Error(handleContractError(error));
        } finally {
            setLoading(false);
        }
    };

    // Create a marketplace listing for a property
    const createListing = async (
        tokenId: number,
        amount: number,
        pricePerShare: string
    ): Promise<string> => {
        try {
            setLoading(true);
            const publicClient = getPublicClient();
            const walletClient = await getWalletClient();
            const marketplaceAddress = CONTRACT_ADDRESSES.Marketplace as `0x${string}`;

            const pricePerShareWei = parseUSDC(pricePerShare);

            const { request } = await publicClient.simulateContract({
                account: wallet.address as `0x${string}`,
                address: marketplaceAddress,
                abi: MarketplaceABI,
                functionName: 'createListing',
                args: [BigInt(tokenId), BigInt(amount), pricePerShareWei],
            });

            const hash = await walletClient.writeContract(request);
            setTxHash(hash);

            await publicClient.waitForTransactionReceipt({ hash });

            return hash;
        } catch (error) {
            throw new Error(handleContractError(error));
        } finally {
            setLoading(false);
        }
    };

    // Create a DAO proposal
    const createDAOProposal = async (
        description: string,
        permissionType: string,
        newValue: string,
        durationDays: number
    ): Promise<string> => {
        try {
            setLoading(true);
            const publicClient = getPublicClient();
            const walletClient = await getWalletClient();
            const daoAddress = CONTRACT_ADDRESSES.MeluriDAO as `0x${string}`;

            const { request } = await publicClient.simulateContract({
                account: wallet.address as `0x${string}`,
                address: daoAddress,
                abi: MeluriDAOABI,
                functionName: 'createProposal',
                args: [description, permissionType, newValue, BigInt(durationDays)],
            });

            const hash = await walletClient.writeContract(request);
            setTxHash(hash);

            await publicClient.waitForTransactionReceipt({ hash });

            return hash;
        } catch (error) {
            throw new Error(handleContractError(error));
        } finally {
            setLoading(false);
        }
    };

    // Allocate rent to investors (admin function)
    const allocateRent = async (
        tokenId: number,
        recipients: string[],
        amounts: string[]
    ): Promise<string> => {
        try {
            setLoading(true);
            const publicClient = getPublicClient();
            const walletClient = await getWalletClient();
            const distributionAddress = CONTRACT_ADDRESSES.Distribution as `0x${string}`;

            // Convert amounts to wei
            const amountsWei = amounts.map(a => parseUSDC(a));

            const { request } = await publicClient.simulateContract({
                account: wallet.address as `0x${string}`,
                address: distributionAddress,
                abi: DistributionABI,
                functionName: 'allocateRent',
                args: [BigInt(tokenId), recipients as `0x${string}`[], amountsWei],
            });

            const hash = await walletClient.writeContract(request);
            setTxHash(hash);

            await publicClient.waitForTransactionReceipt({ hash });

            return hash;
        } catch (error) {
            throw new Error(handleContractError(error));
        } finally {
            setLoading(false);
        }
    };

    // Deposit rent into distribution contract
    const depositRent = async (
        tokenId: number,
        amount: string
    ): Promise<string> => {
        try {
            setLoading(true);
            const publicClient = getPublicClient();
            const walletClient = await getWalletClient();
            const distributionAddress = CONTRACT_ADDRESSES.Distribution as `0x${string}`;

            const amountWei = parseUSDC(amount);

            const { request } = await publicClient.simulateContract({
                account: wallet.address as `0x${string}`,
                address: distributionAddress,
                abi: DistributionABI,
                functionName: 'depositRent',
                args: [BigInt(tokenId), amountWei],
            });

            const hash = await walletClient.writeContract(request);
            setTxHash(hash);

            await publicClient.waitForTransactionReceipt({ hash });

            return hash;
        } catch (error) {
            throw new Error(handleContractError(error));
        } finally {
            setLoading(false);
        }
    };

    return {
        isAdmin,
        loading,
        txHash,
        registerProperty,
        createListing,
        createDAOProposal,
        allocateRent,
        depositRent,
    };
}
