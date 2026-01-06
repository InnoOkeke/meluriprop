"use client"

import React, { useState, useEffect } from "react"
import { usePrivy } from "@privy-io/react-auth"
import { Navbar } from "@/components/layout/navbar"
import { Footer } from "@/components/layout/footer"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
    Users,
    Clock,
    CheckCircle2,
    GanttChart,
    Loader2,
    Target,
    Trophy,
    TrendingUp
} from "lucide-react"
import { motion } from "framer-motion"
import { useGovernance } from "@/hooks/useGovernance"
import { API_URL } from "@/config"

export default function DaoView() {
    const { getAccessToken, user, authenticated } = usePrivy()
    const { castVote } = useGovernance()
    const [proposals, setProposals] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState("Active")

    useEffect(() => {
        fetchProposals()
    }, [])

    const fetchProposals = async () => {
        try {
            setLoading(true)
            const res = await fetch(`${API_URL}/dao/proposals`)
            const data = await res.json()
            if (Array.isArray(data)) {
                setProposals(data)
            } else {
                console.error("API returned non-array:", data)
                setProposals([])
            }
        } catch (err) {
            console.error("Failed to fetch proposals:", err)
        } finally {
            setLoading(false)
        }
    }

    const handleVote = async (proposalId: number, support: boolean) => {
        if (!authenticated) {
            alert("Please login to participate in governance.")
            return
        }

        try {
            // castVote now calls the API directly
            await castVote(proposalId, support);

            // Refresh proposals
            fetchProposals();
        } catch (err: any) {
            console.error("Voting failed:", err)
            alert(`Voting failed: ${err.message || "Unknown error"}`)
        }
    }

    const activeProposalsCount = proposals.filter(p => new Date(p.endTime) > new Date()).length
    const totalVotesMock = Array.isArray(proposals) ? proposals.reduce((acc, p) => acc + (Array.isArray(p.votes) ? p.votes.length : 0), 0) : 0

    return (
        <div className="min-h-screen bg-background font-sans transition-colors duration-500">
            <Navbar />

            <main className="container mx-auto max-w-7xl px-4 md:px-6 pt-24 lg:pt-32 pb-16 lg:pb-24">
                {/* Header Section */}
                <div className="flex flex-col lg:flex-row justify-between items-end mb-16 gap-10">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="space-y-6 max-w-2xl"
                    >
                        <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-none px-4 py-1.5 text-[10px] font-black uppercase tracking-widest">
                            Governance Protocol V2
                        </Badge>
                        <h1 className="text-5xl lg:text-7xl font-heading font-black text-foreground tracking-tightest leading-[0.9]">
                            Decentralized <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">Consensus.</span>
                        </h1>
                        <p className="text-muted-foreground font-medium text-lg leading-relaxed max-w-xl">
                            Shape the future of the Meluri ecosystem. Your voting power is directly proportional to your verified asset holdings on-chain.
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex flex-col gap-6 w-full lg:w-auto"
                    >
                        <div className="flex items-center gap-4 p-4 bg-card rounded-[2rem] border border-border shadow-soft">
                            <div className="flex -space-x-4">
                                {[1, 2, 3, 4].map((i) => (
                                    <div key={i} className="w-12 h-12 rounded-full border-4 border-card bg-muted flex items-center justify-center overflow-hidden">
                                        <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=voter${i}`} alt="voter" className="w-full h-full" />
                                    </div>
                                ))}
                                <div className="w-12 h-12 rounded-full border-4 border-card bg-primary flex items-center justify-center text-[10px] font-black text-primary-foreground">
                                    +{totalVotesMock > 0 ? totalVotesMock : "124"}
                                </div>
                            </div>
                            <div className="pr-4">
                                <div className="text-xs font-bold text-foreground uppercase tracking-wider">Active Voters</div>
                                <div className="text-[10px] text-muted-foreground font-medium">Global Council</div>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <Button variant="outline" className="flex-1 h-14 rounded-2xl font-black text-xs uppercase tracking-widest border-border text-foreground hover:bg-muted">
                                Read Whitepaper
                            </Button>
                            <Button className="flex-1 h-14 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20 bg-primary text-primary-foreground hover:bg-primary/90">
                                Create Proposal
                            </Button>
                        </div>
                    </motion.div>
                </div>

                {/* Governance Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-24">
                    {[
                        { label: "Active Mandates", value: activeProposalsCount, icon: Target, color: "text-blue-500", bg: "bg-blue-500/10" },
                        { label: "Quorum Status", value: "Healthy", icon: Users, color: "text-green-500", bg: "bg-green-500/10" },
                        { label: "Treasury Value", value: "$2.4M", icon: Trophy, color: "text-amber-500", bg: "bg-amber-500/10" },
                        { label: "Participation", value: "84.2%", icon: TrendingUp, color: "text-purple-500", bg: "bg-purple-500/10" },
                    ].map((stat, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                        >
                            <Card className="rounded-[2.5rem] border-border bg-card shadow-soft p-8 hover:-translate-y-1 transition-transform duration-300">
                                <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center mb-6", stat.bg, stat.color)}>
                                    <stat.icon className="h-6 w-6" />
                                </div>
                                <div className="text-3xl font-heading font-black text-foreground tracking-tight">{stat.value}</div>
                                <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-2">{stat.label}</div>
                            </Card>
                        </motion.div>
                    ))}
                </div>

                {/* Proposals Section */}
                <section className="max-w-5xl mx-auto space-y-10">
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
                        <h2 className="text-3xl font-heading font-black text-foreground tracking-tight">Governance Feed</h2>
                        <div className="flex p-1.5 bg-card rounded-xl border border-border">
                            {["Active", "Executed", "Defeated"].map((f) => (
                                <button
                                    key={f}
                                    onClick={() => setFilter(f)}
                                    className={cn(
                                        "px-6 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                                        filter === f
                                            ? "bg-foreground text-background shadow-lg"
                                            : "text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    {f}
                                </button>
                            ))}
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-48 text-center">
                            <Loader2 className="h-10 w-10 text-primary animate-spin mb-6" />
                            <p className="text-muted-foreground font-black uppercase tracking-widest text-xs">Syncing On-Chain Data...</p>
                        </div>
                    ) : (
                        <div className="space-y-8">
                            {proposals.length > 0 ? (
                                proposals.map((p, idx) => {
                                    const totalVotes = Array.isArray(p.votes) ? p.votes.length : 0
                                    const yesVotes = Array.isArray(p.votes) ? p.votes.filter((v: any) => v.support).length : 0
                                    const noVotes = totalVotes - yesVotes
                                    const hasVoted = Array.isArray(p.votes) && p.votes.some((v: any) => user?.id && v.userId === user.id.replace("did:privy:", ""))
                                    const isActive = new Date(p.endTime) > new Date()
                                    const yesPercent = totalVotes ? (yesVotes / totalVotes) * 100 : 0
                                    const noPercent = totalVotes ? (noVotes / totalVotes) * 100 : 0

                                    return (
                                        <motion.div
                                            key={p.id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.1 }}
                                        >
                                            <Card className="rounded-[3rem] border-border bg-card shadow-soft overflow-hidden hover:shadow-2xl transition-all duration-500 group">
                                                <div className="p-10 lg:p-12">
                                                    <div className="flex flex-col lg:flex-row gap-10">
                                                        <div className="flex-grow space-y-6">
                                                            <div className="flex items-center gap-4">
                                                                <Badge className={cn(
                                                                    "px-4 py-1.5 rounded-full text-[9px] font-black tracking-widest uppercase border-none",
                                                                    isActive ? "bg-green-500 text-white shadow-lg shadow-green-500/30" : "bg-muted text-muted-foreground"
                                                                )}>
                                                                    {isActive ? "Live Voting" : "Closed"}
                                                                </Badge>
                                                                <span className="text-[10px] font-black text-muted-foreground tracking-[0.2em] uppercase">MIP-{600 + p.id}</span>
                                                            </div>

                                                            <h3 className="text-2xl lg:text-4xl font-heading font-black text-foreground tracking-tight leading-tight group-hover:text-primary transition-colors">
                                                                {p.description}
                                                            </h3>

                                                            <div className="flex flex-wrap gap-6 pt-2">
                                                                <div className="flex items-center gap-2 text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                                                                    <Target className="h-4 w-4" />
                                                                    {p.permissionType}
                                                                </div>
                                                                <div className="flex items-center gap-2 text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                                                                    <Clock className="h-4 w-4" />
                                                                    Ends: {new Date(p.endTime).toLocaleDateString()}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="lg:w-72 shrink-0 space-y-8">
                                                            <div className="bg-muted/30 rounded-[2rem] p-6 border border-border">
                                                                <div className="flex justify-between items-center mb-4">
                                                                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Current Stand</span>
                                                                    <span className="text-xs font-bold text-foreground">{totalVotes} Votes</span>
                                                                </div>

                                                                <div className="space-y-3">
                                                                    <div>
                                                                        <div className="flex justify-between text-[10px] font-bold mb-1.5">
                                                                            <span className="text-primary">For</span>
                                                                            <span className="text-foreground">{Math.round(yesPercent)}%</span>
                                                                        </div>
                                                                        <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                                                                            <div className="h-full bg-primary rounded-full" style={{ width: `${yesPercent}%` }} />
                                                                        </div>
                                                                    </div>
                                                                    <div>
                                                                        <div className="flex justify-between text-[10px] font-bold mb-1.5">
                                                                            <span className="text-red-400">Against</span>
                                                                            <span className="text-foreground">{Math.round(noPercent)}%</span>
                                                                        </div>
                                                                        <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                                                                            <div className="h-full bg-red-400 rounded-full" style={{ width: `${noPercent}%` }} />
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {isActive && !hasVoted && (
                                                                <div className="flex gap-3">
                                                                    <Button
                                                                        onClick={() => handleVote(p.id, true)}
                                                                        className="flex-1 h-12 rounded-xl bg-foreground text-background hover:bg-primary hover:text-primary-foreground transition-all font-black text-[10px] uppercase tracking-widest"
                                                                    >
                                                                        Vote Yes
                                                                    </Button>
                                                                    <Button
                                                                        onClick={() => handleVote(p.id, false)}
                                                                        variant="outline"
                                                                        className="flex-1 h-12 rounded-xl border-border font-black text-[10px] uppercase tracking-widest hover:border-red-500 hover:text-red-500"
                                                                    >
                                                                        Vote No
                                                                    </Button>
                                                                </div>
                                                            )}

                                                            {hasVoted && (
                                                                <div className="flex items-center justify-center gap-2 h-12 bg-primary/10 rounded-xl text-primary font-bold text-xs">
                                                                    <CheckCircle2 className="h-4 w-4" />
                                                                    You Voted
                                                                </div>
                                                            )}

                                                            {!isActive && (
                                                                <div className="flex items-center justify-center gap-2 h-12 bg-muted rounded-xl text-muted-foreground font-bold text-xs">
                                                                    <GanttChart className="h-4 w-4" />
                                                                    Vote Concluded
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </Card>
                                        </motion.div>
                                    )
                                })
                            ) : (
                                <div className="text-center py-32 bg-card rounded-[3rem] border border-border shadow-soft">
                                    <div className="w-20 h-20 bg-muted/50 rounded-3xl flex items-center justify-center mx-auto mb-8">
                                        <GanttChart className="h-8 w-8 text-muted-foreground" />
                                    </div>
                                    <h3 className="text-2xl font-heading font-black text-foreground mb-2">Governance Dormant</h3>
                                    <p className="text-muted-foreground font-medium mb-8">No active mandates found.</p>
                                    <Button onClick={fetchProposals} variant="ghost" className="text-primary font-black uppercase tracking-widest text-xs">
                                        Refresh Feed
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}
                </section>
            </main>

            <Footer />
        </div>
    )
}
