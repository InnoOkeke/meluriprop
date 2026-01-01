import { usePrivy, useWallets } from '@privy-io/react-auth';
import { createPublicClient, createWalletClient, custom, http } from 'viem';
import { circleArcTestnet, CONTRACT_ADDRESSES } from '@/config';
import { MeluriDAOABI } from '@/lib/abis/MeluriDAO';
import { useState } from 'react';
import { handleContractError } from '@/lib/contract-utils';

interface Proposal {
    proposer: string;
    description: string;
    permissionType: string;
    newValue: string;
    voteCount: bigint;
    endTime: bigint;
    executed: boolean;
}

export function useGovernance() {
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

    // Cast vote on a proposal
    const castVote = async (proposalId: number, support: boolean): Promise<string> => {
        try {
            setLoading(true);
            const publicClient = getPublicClient();
            const walletClient = await getWalletClient();
            const daoAddress = CONTRACT_ADDRESSES.MeluriDAO as `0x${string}`;

            const { request } = await publicClient.simulateContract({
                account: wallet.address as `0x${string}`,
                address: daoAddress,
                abi: MeluriDAOABI,
                functionName: 'castVote',
                args: [BigInt(proposalId), support],
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

    // Create a new proposal (admin only)
    const createProposal = async (
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

    // Get proposal details
    const getProposal = async (proposalId: number): Promise<Proposal> => {
        const publicClient = getPublicClient();
        const daoAddress = CONTRACT_ADDRESSES.MeluriDAO as `0x${string}`;

        const data = await publicClient.readContract({
            address: daoAddress,
            abi: MeluriDAOABI,
            functionName: 'proposals',
            args: [BigInt(proposalId)],
        }) as any;

        return {
            proposer: data[0],
            description: data[1],
            permissionType: data[2],
            newValue: data[3],
            voteCount: data[4],
            endTime: data[5],
            executed: data[6],
        };
    };

    // Get proposal state (active, passed, defeated)
    const getProposalState = async (proposalId: number): Promise<'active' | 'passed' | 'defeated' | 'executed'> => {
        try {
            const proposal = await getProposal(proposalId);
            const now = BigInt(Math.floor(Date.now() / 1000));

            if (proposal.executed) {
                return 'executed';
            }

            if (now < proposal.endTime) {
                return 'active';
            }

            // Check if proposal passed (this is simplified - actual logic may vary)
            // You might need to add a threshold check here
            return proposal.voteCount > 0n ? 'passed' : 'defeated';
        } catch (error) {
            console.error("Failed to get proposal state:", error);
            return 'defeated';
        }
    };

    // Execute a passed proposal (admin only)
    const executeProposal = async (proposalId: number): Promise<string> => {
        try {
            setLoading(true);
            const publicClient = getPublicClient();
            const walletClient = await getWalletClient();
            const daoAddress = CONTRACT_ADDRESSES.MeluriDAO as `0x${string}`;

            const { request } = await publicClient.simulateContract({
                account: wallet.address as `0x${string}`,
                address: daoAddress,
                abi: MeluriDAOABI,
                functionName: 'executeProposal',
                args: [BigInt(proposalId)],
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

    // Get voting power (based on token holdings)
    const getVotingPower = async (address: string): Promise<bigint> => {
        try {
            const publicClient = getPublicClient();
            const daoAddress = CONTRACT_ADDRESSES.MeluriDAO as `0x${string}`;

            const power = await publicClient.readContract({
                address: daoAddress,
                abi: MeluriDAOABI,
                functionName: 'getVotingPower',
                args: [address as `0x${string}`],
            }) as bigint;

            return power;
        } catch (error) {
            console.error("Failed to get voting power:", error);
            return 0n;
        }
    };

    return {
        castVote,
        createProposal,
        getProposal,
        getProposalState,
        executeProposal,
        getVotingPower,
        loading,
        txHash,
    };
}
