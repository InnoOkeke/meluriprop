"use client"

import React, { useState, useEffect } from "react"
import { usePrivy } from "@privy-io/react-auth"
import { Navbar } from "@/components/layout/navbar"
import { Footer } from "@/components/layout/footer"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import {
    TrendingUp,
    Building2,
    Clock,
    MoreVertical,
    ShieldCheck,
    PieChart,
    ChevronRight,
    Lock,
    ArrowUpRight as ArrowUpRightIcon
} from "lucide-react"
import { motion } from "framer-motion"
import { usePortfolio } from "@/hooks/usePortfolio"
import { API_URL } from "@/config"

interface Investment {
    id: string;
    amount: number;
    tokens: number;
    property: {
        name: string;
        location: string;
    };
}

export default function PortfolioView() {
    const { ready, authenticated, getAccessToken, user } = usePrivy()
    const { balances, loading: loadingBalances, fetchBalances } = usePortfolio()
    const [investments, setInvestments] = useState<Investment[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (authenticated) {
            fetchInvestments()
        } else if (ready && !authenticated) {
            setLoading(false)
        }
    }, [authenticated, ready])

    const fetchInvestments = async () => {
        try {
            setLoading(true)
            const token = await getAccessToken()
            const response = await fetch(`${API_URL}/investments`, {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            })
            if (response.ok) {
                const data = await response.json()
                setInvestments(data)
                const ids = data.map((inv: Investment) => Number(inv.id))
                fetchBalances(ids)
            }
        } catch (err) {
            console.error("Failed to fetch investments:", err)
        } finally {
            setLoading(false)
        }
    }

    const totalValue = investments.reduce((sum, inv) => sum + Number(inv.amount), 0)

    if (!ready || (loading && investments.length === 0)) {
        return (
            <div className="min-h-screen bg-background">
                <Navbar />
                <main className="container mx-auto px-6 py-32">
                    <div className="flex justify-between items-end mb-16">
                        <div className="space-y-4">
                            <Skeleton className="h-4 w-32 rounded-full" />
                            <Skeleton className="h-16 w-96 rounded-3xl" />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
                        <Skeleton className="h-64 rounded-[2.5rem]" />
                        <Skeleton className="h-64 rounded-[2.5rem]" />
                        <Skeleton className="h-64 rounded-[2.5rem]" />
                    </div>
                </main>
            </div>
        )
    }

    if (!authenticated) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
                <div className="w-24 h-24 bg-card border border-border rounded-[2.5rem] flex items-center justify-center mb-10 shadow-soft">
                    <Lock className="h-10 w-10 text-primary" />
                </div>
                <h1 className="text-4xl font-heading font-black text-foreground mb-4 tracking-tight">Institutional Portal</h1>
                <p className="text-muted-foreground font-medium max-w-sm mb-12 text-lg">Identity verification and wallet connection required to access Meluri Capital assets.</p>
                <Button size="lg" className="h-16 px-12 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-primary/20 bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => (window as any).privy_login?.()}>
                    Verify Identity
                </Button>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background font-sans transition-colors duration-500">
            <Navbar />

            <main className="container mx-auto max-w-7xl px-4 md:px-6 pt-24 lg:pt-32 pb-16 lg:pb-24">
                {/* Header Section */}
                <div className="flex flex-col lg:flex-row justify-between items-end mb-16 gap-8">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="space-y-4"
                    >
                        <Badge variant="outline" className="border-primary/20 bg-primary/5 text-primary tracking-widest uppercase font-black px-4 py-1.5 rounded-full text-[10px]">
                            Investor Dashboard
                        </Badge>
                        <h1 className="text-4xl lg:text-7xl font-heading font-black text-foreground tracking-tightest leading-none">
                            Portfolio <br />Execution.
                        </h1>
                        <div className="flex items-center gap-2 pt-2">
                            <span className="text-muted-foreground font-medium">Verified Account:</span>
                            <span className="text-foreground font-bold">{user?.email?.address || "Institutional Investor"}</span>
                            <Badge className="bg-green-500/10 text-green-600 border-none font-black text-[9px] uppercase tracking-widest ml-1 px-3 py-1">Whitelisted</Badge>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-4 w-full lg:w-auto"
                    >
                        <Button variant="outline" className="flex-1 lg:flex-none h-16 px-8 rounded-2xl border-border font-black uppercase text-[10px] tracking-widest bg-card text-foreground hover:bg-muted">
                            <Clock className="h-4 w-4 mr-2" />
                            Activity Logs
                        </Button>
                        <Button className="flex-1 lg:flex-none h-16 px-8 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-primary/20 bg-primary text-primary-foreground hover:bg-primary/90">
                            Claim All Yield
                        </Button>
                    </motion.div>
                </div>

                {/* Top Metrics Hierarchy */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                        <Card className="rounded-[3rem] border-border shadow-soft overflow-hidden group hover:border-primary/20 transition-all bg-card p-10 h-full">
                            <div className="flex justify-between items-start mb-10">
                                <div className="w-16 h-16 rounded-[1.5rem] bg-primary/5 dark:bg-primary/10 flex items-center justify-center text-primary">
                                    <PieChart className="h-8 w-8" />
                                </div>
                                <div className="flex flex-col items-end">
                                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Growth (MTD)</span>
                                    <span className="text-sm font-black text-green-500 flex items-center gap-1">
                                        +12.4% <ArrowUpRightIcon className="h-3 w-3" />
                                    </span>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest leading-none">Total Value Locked</div>
                                <div className="text-5xl font-heading font-black text-foreground tracking-tightest leading-none">
                                    {totalValue.toLocaleString()} <span className="text-xl text-muted-foreground font-bold tracking-tighter ml-1">USDC</span>
                                </div>
                            </div>
                            <div className="mt-8 h-1.5 w-full bg-muted rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: "65%" }}
                                    transition={{ duration: 1.5, delay: 0.5, ease: "circOut" }}
                                    className="h-full bg-primary"
                                />
                            </div>
                        </Card>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                        <Card className="rounded-[3rem] border-border shadow-soft overflow-hidden bg-card p-10 h-full">
                            <div className="flex justify-between items-start mb-10">
                                <div className="w-16 h-16 rounded-[1.5rem] bg-secondary/5 dark:bg-secondary/10 flex items-center justify-center text-secondary">
                                    <TrendingUp className="h-8 w-8" />
                                </div>
                                <div className="flex flex-col items-end">
                                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Market Status</span>
                                    <Badge className="bg-secondary text-secondary-foreground border-transparent font-black text-[9px] uppercase tracking-widest mt-1 hover:bg-secondary">High Vol</Badge>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest leading-none">Net Annual Yield</div>
                                <div className="text-5xl font-heading font-black text-secondary tracking-tightest leading-none">
                                    24.5<span className="text-xl font-bold tracking-tighter ml-0.5">%</span>
                                </div>
                            </div>
                            <div className="mt-8 flex items-center gap-2 text-xs font-medium text-muted-foreground">
                                <ShieldCheck className="h-4 w-4 text-secondary" />
                                Risk-Adjusted Baseline
                            </div>
                        </Card>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                        <Card className="rounded-[3rem] border-border shadow-soft overflow-hidden bg-foreground text-background p-10 relative h-full">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 blur-3xl rounded-full -mr-16 -mt-16" />
                            <div className="flex justify-between items-start mb-10 relative z-10">
                                <div className="w-16 h-16 rounded-[1.5rem] bg-white/10 flex items-center justify-center text-background">
                                    <Building2 className="h-8 w-8" />
                                </div>
                                <div className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center shadow-xl">
                                    <span className="text-[10px] font-black">{investments.length}</span>
                                </div>
                            </div>
                            <div className="space-y-1 relative z-10">
                                <div className="text-[11px] font-bold text-background/60 uppercase tracking-widest leading-none">Portfolio Diversity</div>
                                <div className="text-5xl font-heading font-black tracking-tightest leading-none">
                                    {investments.length} <span className="text-xl text-background/40 font-bold tracking-tighter ml-1">Assets</span>
                                </div>
                            </div>
                            <div className="mt-8 relative z-10">
                                <Button variant="link" className="p-0 h-auto text-primary font-bold uppercase tracking-[0.15em] text-[10px] flex items-center group decoration-0">
                                    Expand Holdings <ChevronRight className="ml-1 h-3 w-3 group-hover:translate-x-1 transition-transform" />
                                </Button>
                            </div>
                        </Card>
                    </motion.div>
                </div>

                {/* Main Content Area */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    {/* Assets Table */}
                    <div className="lg:col-span-2 space-y-8">
                        <div className="flex justify-between items-center">
                            <h2 className="text-2xl font-heading font-black text-foreground tracking-tight">Active Holdings</h2>
                            <Button variant="ghost" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground">View All</Button>
                        </div>

                        <div className="space-y-4">
                            {investments.length > 0 ? (
                                investments.map((inv, idx) => (
                                    <motion.div
                                        key={inv.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.1 * idx }}
                                        className="group p-6 bg-card border border-border rounded-[2.5rem] shadow-soft hover:shadow-2xl hover:border-primary/10 transition-all duration-500 cursor-pointer flex flex-col md:flex-row items-center gap-8"
                                    >
                                        <div className="w-20 h-20 rounded-[1.75rem] bg-muted flex items-center justify-center group-hover:scale-110 transition-all duration-500 flex-shrink-0">
                                            <Building2 className="h-8 w-8 text-muted-foreground group-hover:text-primary transition-colors" />
                                        </div>

                                        <div className="flex-grow space-y-1 text-center md:text-left">
                                            <h4 className="text-xl font-heading font-black text-foreground tracking-tightest italic">{inv.property.name}</h4>
                                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{inv.property.location}</p>
                                        </div>

                                        <div className="grid grid-cols-2 md:grid-cols-1 gap-8 md:gap-1 text-center md:text-right">
                                            <div>
                                                <div className="text-sm font-black text-foreground leading-none">
                                                    {(balances[Number(inv.id)] ? Number(balances[Number(inv.id)]) : Number(inv.tokens)).toLocaleString()} <span className="text-[10px] text-muted-foreground">UNIT</span>
                                                </div>
                                                <div className="text-[9px] font-black text-primary uppercase tracking-[0.2em] mt-1">Verified</div>
                                            </div>
                                            <div className="md:mt-4">
                                                <div className="text-sm font-black text-foreground leading-none">
                                                    {Number(inv.amount).toLocaleString()} <span className="text-[10px] text-muted-foreground uppercase tracking-widest">USDC</span>
                                                </div>
                                                <div className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] mt-1">Acquisition</div>
                                            </div>
                                        </div>

                                        <div className="flex-shrink-0">
                                            <Button variant="ghost" size="icon" className="rounded-2xl hover:bg-muted text-muted-foreground group-hover:text-foreground transition-colors">
                                                <MoreVertical className="h-5 w-5" />
                                            </Button>
                                        </div>
                                    </motion.div>
                                ))
                            ) : (
                                <div className="py-24 text-center bg-card rounded-[3rem] border border-border shadow-soft">
                                    <div className="w-20 h-20 bg-muted/30 rounded-3xl flex items-center justify-center mx-auto mb-6">
                                        <Building2 className="h-10 w-10 text-muted-foreground" />
                                    </div>
                                    <h3 className="text-2xl font-heading font-black text-foreground mb-2">No active holdings</h3>
                                    <p className="text-muted-foreground font-medium mb-10">Liquidity execution has not been initiated.</p>
                                    <Button size="lg" className="rounded-2xl px-10 h-16 font-black uppercase tracking-widest text-[10px] bg-primary text-primary-foreground hover:bg-primary/90" asChild>
                                        <a href="/marketplace">Execute Order</a>
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Projections Sidebar */}
                    <div className="space-y-12">
                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}>
                            <div className="flex justify-between items-center mb-8">
                                <h2 className="text-2xl font-heading font-black text-foreground tracking-tight">Projections</h2>
                                <Badge className="bg-foreground text-background border-transparent font-black text-[9px] uppercase tracking-widest">Live</Badge>
                            </div>

                            <Card className="rounded-[3rem] border-border shadow-soft bg-card p-8 space-y-10 group overflow-hidden relative">
                                <div className="absolute bottom-0 right-0 w-48 h-48 bg-secondary/5 dark:bg-secondary/10 rounded-full -mr-24 -mb-24 blur-3xl" />

                                <div className="space-y-1 text-center">
                                    <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest leading-none">Expected Distributed Yield</div>
                                    <div className="text-5xl font-heading font-black text-foreground tracking-tightest leading-none">
                                        12,450 <span className="text-xl text-muted-foreground font-bold tracking-tighter">USDC</span>
                                    </div>
                                </div>

                                <div className="flex gap-2.5 h-32 items-end px-2">
                                    {[0.3, 0.5, 0.4, 0.7, 0.6, 0.8, 1].map((h, i) => (
                                        <motion.div
                                            key={i}
                                            initial={{ height: 0 }}
                                            animate={{ height: `${h * 100}%` }}
                                            transition={{ delay: 0.6 + (i * 0.1), duration: 1, ease: "backOut" }}
                                            className={cn(
                                                "flex-1 rounded-t-lg transition-all duration-500",
                                                i === 6
                                                    ? "bg-primary shadow-xl shadow-primary/20"
                                                    : "bg-muted group-hover:bg-muted/80"
                                            )}
                                        />
                                    ))}
                                </div>

                                <div className="flex justify-between text-[9px] text-muted-foreground font-black tracking-widest px-1">
                                    <span>SEP</span>
                                    <span>OCT</span>
                                    <span>NOV</span>
                                    <span>DEC</span>
                                    <span>JAN</span>
                                    <span>FEB</span>
                                    <span>MAR</span>
                                </div>
                            </Card>
                        </motion.div>

                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}>
                            <div className="bg-foreground rounded-[3rem] p-10 text-background shadow-2xl shadow-foreground/20 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 blur-3xl rounded-full -mr-16 -mt-16 group-hover:bg-primary/40 transition-all duration-700" />
                                <h3 className="text-xl font-heading font-black mb-4 tracking-tight relative z-10 italic">Premium Support</h3>
                                <p className="text-background/50 text-sm font-medium mb-8 relative z-10 leading-relaxed">Dedicated account manager for all institutional mandates exceeding 1M USDC.</p>
                                <Button className="w-full h-14 rounded-2xl bg-background text-foreground hover:bg-background/90 font-black uppercase tracking-widest text-[10px] relative z-10">Contact Advisor</Button>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    )
}
