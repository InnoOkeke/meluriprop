import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { usePrivy } from '@privy-io/expo';
import { API_URL } from '../config';

interface Proposal {
    id: number;
    description: string;
    permissionType: string;
    startTime: string;
    endTime: string;
    active: boolean;
    votes: any[];
}

export function DaoView() {
    const { getAccessToken, user } = usePrivy();
    const [proposals, setProposals] = useState<Proposal[]>([]);
    const [loading, setLoading] = useState(false);
    const [voting, setVoting] = useState<number | null>(null);

    const fetchProposals = async () => {
        setLoading(true);
        try {
            const token = await getAccessToken();
            // Note: Public endpoint usually doesn't need token, but if guarded we need it. 
            // Controller has @UseGuards(PrivyGuard) so we need token.
            const headers: any = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const response = await fetch(`${API_URL}/dao/proposals`, { headers });
            if (response.ok) {
                const data = await response.json();
                setProposals(data);
            } else {
                console.error('Failed to fetch proposals');
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleVote = async (proposalId: number, support: boolean) => {
        setVoting(proposalId);
        try {
            const token = await getAccessToken();
            if (!token) {
                Alert.alert('Error', 'You must be logged in to vote');
                return;
            }

            const response = await fetch(`${API_URL}/dao/vote`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ proposalId, support })
            });

            if (response.ok) {
                Alert.alert('Success', `Voted ${support ? 'Yes' : 'No'}`);
                fetchProposals(); // Refresh
            } else {
                const error = await response.json();
                Alert.alert('Error', error.message || 'Vote failed');
            }
        } catch (err) {
            console.error(err);
            Alert.alert('Error', 'Failed to connect');
        } finally {
            setVoting(null);
        }
    };

    useEffect(() => {
        fetchProposals();
    }, []);

    const hasVoted = (proposal: Proposal) => {
        if (!user) return false;
        // User ID in vote is the Privy DID
        return proposal.votes.some((v: any) => v.userId === user.id);
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Governance</Text>
                <TouchableOpacity onPress={fetchProposals}>
                    <Text style={styles.refresh}>Refresh</Text>
                </TouchableOpacity>
            </View>

            {loading ? (
                <ActivityIndicator size="large" color="#2563EB" />
            ) : (
                <ScrollView contentContainerStyle={styles.list}>
                    {proposals.length === 0 ? (
                        <Text style={styles.empty}>No active proposals</Text>
                    ) : (
                        proposals.map((p) => {
                            const voted = hasVoted(p);
                            const isActive = new Date(p.endTime) > new Date();

                            return (
                                <View key={p.id} style={styles.card}>
                                    <View style={styles.cardHeader}>
                                        <Text style={styles.proposalId}>#{p.id}</Text>
                                        <Text style={[styles.status, isActive ? styles.active : styles.closed]}>
                                            {isActive ? 'Active' : 'Closed'}
                                        </Text>
                                    </View>
                                    <Text style={styles.description}>{p.description}</Text>
                                    <Text style={styles.meta}>Ends: {new Date(p.endTime).toLocaleDateString()}</Text>
                                    <Text style={styles.meta}>Type: {p.permissionType}</Text>

                                    <View style={styles.stats}>
                                        <Text>Votes: {p.votes.length}</Text>
                                    </View>

                                    {isActive && !voted ? (
                                        <View style={styles.voteButtons}>
                                            <TouchableOpacity
                                                style={[styles.voteBtn, styles.yesBtn]}
                                                onPress={() => handleVote(p.id, true)}
                                                disabled={voting === p.id}
                                            >
                                                <Text style={styles.btnText}>Vote Yes</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                style={[styles.voteBtn, styles.noBtn]}
                                                onPress={() => handleVote(p.id, false)}
                                                disabled={voting === p.id}
                                            >
                                                <Text style={styles.btnText}>Vote No</Text>
                                            </TouchableOpacity>
                                        </View>
                                    ) : (
                                        <View style={styles.votedBadge}>
                                            <Text style={styles.votedText}>
                                                {voted ? 'You have voted' : 'Voting Closed'}
                                            </Text>
                                        </View>
                                    )}
                                </View>
                            );
                        })
                    )}
                </ScrollView>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    refresh: {
        color: '#2563EB',
    },
    list: {
        paddingBottom: 20,
    },
    empty: {
        textAlign: 'center',
        color: '#666',
        marginTop: 50,
    },
    card: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    proposalId: {
        fontWeight: 'bold',
        color: '#666',
    },
    status: {
        fontSize: 12,
        fontWeight: 'bold',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
        overflow: 'hidden',
    },
    active: {
        backgroundColor: '#DCFCE7',
        color: '#166534',
    },
    closed: {
        backgroundColor: '#F3F4F6',
        color: '#374151',
    },
    description: {
        fontSize: 16,
        marginBottom: 12,
        fontWeight: '500',
    },
    meta: {
        fontSize: 12,
        color: '#666',
        marginBottom: 4,
    },
    stats: {
        marginTop: 8,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: '#eee',
    },
    voteButtons: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 15,
    },
    voteBtn: {
        flex: 1,
        padding: 10,
        borderRadius: 8,
        alignItems: 'center',
    },
    yesBtn: {
        backgroundColor: '#2563EB',
    },
    noBtn: {
        backgroundColor: '#DC2626',
    },
    btnText: {
        color: 'white',
        fontWeight: 'bold',
    },
    votedBadge: {
        marginTop: 15,
        backgroundColor: '#F3F4F6',
        padding: 8,
        borderRadius: 6,
        alignItems: 'center',
    },
    votedText: {
        color: '#4B5563',
        fontWeight: '500',
    }
});
