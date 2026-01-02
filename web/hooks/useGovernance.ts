import { usePrivy } from '@privy-io/react-auth';
import { createPublicClient, createWalletClient, custom, http } from 'viem';
import { circleArcTestnet, CONTRACT_ADDRESSES, API_URL } from '@/config';
import { MeluriDAOABI } from '@/lib/abis/MeluriDAO';
import { RealEstateTokenABI } from '@/lib/abis/RealEstateToken';
import { useState } from 'react';
import { handleContractError } from '@/lib/contract-utils';

interface Proposal {
    id: number;
    description: string;
    permissionType: string;
    targetTokenId: number | null;
    startTime: string;
    endTime: string;
    active: boolean;
    votes: any[];
    voteCount: number;
}

export function useGovernance() {
    const { getAccessToken, user } = usePrivy();
    const [loading, setLoading] = useState(false);
    const [txHash, setTxHash] = useState<string | null>(null);

    const getPublicClient = () => {
        return createPublicClient({
            chain: circleArcTestnet,
            transport: http(),
        });
    };

    // Cast vote on a proposal (API)
    const castVote = async (proposalId: number, support: boolean): Promise<any> => {
        try {
            setLoading(true);
            const token = await getAccessToken();

            const response = await fetch(`${API_URL}/dao/vote`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    proposalId,
                    support
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Voting failed');
            }

            return await response.json();
        } catch (error: any) {
            throw new Error(error.message || 'Voting failed');
        } finally {
            setLoading(false);
        }
    };

    // Create a new proposal (API)
    const createProposal = async (
        description: string,
        permissionType: string,
        targetTokenId: string,
        durationSeconds: number
    ): Promise<any> => {
        try {
            setLoading(true);
            const token = await getAccessToken();

            const response = await fetch(`${API_URL}/dao/proposals`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    description,
                    permissionType,
                    targetTokenId: targetTokenId ? Number(targetTokenId) : undefined,
                    durationSeconds
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to create proposal');
            }

            return await response.json();
        } catch (error: any) {
            throw new Error(error.message || 'Failed to create proposal');
        } finally {
            setLoading(false);
        }
    };

    // Get all proposals (API)
    const getProposals = async (): Promise<Proposal[]> => {
        try {
            const response = await fetch(`${API_URL}/dao/proposals`);
            const data = await response.json();

            return data.map((p: any) => ({
                ...p,
                voteCount: p.votes ? p.votes.length : 0
            }));
        } catch (error) {
            console.error("Failed to fetch proposals:", error);
            return [];
        }
    };

    // Get single proposal details (API)
    // Note: API currently doesn't support findOne, so we filter from all.
    const getProposal = async (proposalId: number): Promise<Proposal | null> => {
        const proposals = await getProposals();
        return proposals.find(p => p.id === proposalId) || null;
    };

    // Get proposal state (Derived)
    const getProposalState = async (proposalId: number): Promise<'active' | 'passed' | 'defeated' | 'executed'> => {
        try {
            const proposal = await getProposal(proposalId);
            if (!proposal) return 'defeated';

            const now = new Date();
            const end = new Date(proposal.endTime);

            if (now < end) return 'active';

            // Simple logic: if more yes than no? 
            // The API returns votes list. I'd need to count them.
            // For now, let's assume if it exists and time passed, it's executed/passed.
            const yesVotes = proposal.votes.filter((v: any) => v.support).length;
            const noVotes = proposal.votes.length - yesVotes;

            return yesVotes > noVotes ? 'passed' : 'defeated';
        } catch (error) {
            console.error("Failed to get proposal state:", error);
            return 'defeated';
        }
    };

    // Get voting power (based on token holdings) - ON CHAIN
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
        getProposals,
        getProposalState,
        getVotingPower,
        loading,
        txHash, // No longer used for API calls but kept for interface compatibility if needed
    };
}
