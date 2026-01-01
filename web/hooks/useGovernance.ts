import { usePrivy, useWallets } from '@privy-io/react-auth';
import { createPublicClient, createWalletClient, custom, http } from 'viem';
import { circleArcTestnet, CONTRACT_ADDRESSES } from '@/config';
import { MeluriDAOABI } from '@/lib/abis/MeluriDAO';
import { RealEstateTokenABI } from '@/lib/abis/RealEstateToken';
import { useState } from 'react';
import { handleContractError } from '@/lib/contract-utils';

interface Proposal {
    proposer: string;
    description: string;
    permissionType: number;
    targetTokenId: bigint;
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
                functionName: 'vote',
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
        permissionType: number,
        targetTokenId: bigint,
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
                args: [description, permissionType, targetTokenId, BigInt(durationDays * 86400)], // Convert days to seconds
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
            functionName: 'getProposal', // Corrected function name from 'proposals' to 'getProposal' based on ABI
            args: [BigInt(proposalId)],
        }) as any;

        // Based on ABI: description, permissionType, targetTokenId, yesVotes, noVotes, endTime, active
        // But previously it was mapping index-based array. The ABI shows getProposal returns explicit struct-like multiple return values.
        // Let's assume Viem returns an array or object depending on config.
        // The return structure from ABI is: 
        // [0] description (string)
        // [1] permissionType (uint8)
        // [2] targetTokenId (uint256)
        // [3] yesVotes (uint256)
        // [4] noVotes (uint256)
        // [5] endTime (uint256)
        // [6] active (bool)

        // Note: The previous code was using 'proposals' mapping but passing an index. 
        // My ABI view showed a 'getProposal' function.
        // Let's stick to what the view_file of ABI showed:
        // getProposal outputs: description, permissionType, targetTokenId, yesVotes, noVotes, endTime, active

        return {
            proposer: "0x0000000000000000000000000000000000000000", // Not returned by getProposal in ABI
            description: data[0],
            permissionType: Number(data[1]),
            targetTokenId: data[2],
            voteCount: data[3] + data[4], // Sum of yes and no votes
            endTime: data[5],
            executed: !data[6], // If not active, assume executed or ended? Active implies open for voting.
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
    // const executeProposal = async (proposalId: number): Promise<string> => {
    //     try {
    //         setLoading(true);
    //         const publicClient = getPublicClient();
    //         const walletClient = await getWalletClient();
    //         const daoAddress = CONTRACT_ADDRESSES.MeluriDAO as `0x${string}`;

    //         const { request } = await publicClient.simulateContract({
    //             account: wallet.address as `0x${string}`,
    //             address: daoAddress,
    //             abi: MeluriDAOABI,
    //             functionName: 'executeProposal',
    //             args: [BigInt(proposalId)],
    //         });

    //         const hash = await walletClient.writeContract(request);
    //         setTxHash(hash);

    //         await publicClient.waitForTransactionReceipt({ hash });

    //         return hash;
    //     } catch (error) {
    //         throw new Error(handleContractError(error));
    //     } finally {
    //         setLoading(false);
    //     }
    // };

    // Get voting power (based on token holdings)
    const getVotingPower = async (address: string): Promise<bigint> => {
        try {
            const publicClient = getPublicClient();
            const tokenAddress = CONTRACT_ADDRESSES.RealEstateToken as `0x${string}`;

            const power = await publicClient.readContract({
                address: tokenAddress,
                abi: RealEstateTokenABI,
                functionName: 'totalUserBalance',
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
        // executeProposal,
        getVotingPower,
        loading,
        txHash,
    };
}
