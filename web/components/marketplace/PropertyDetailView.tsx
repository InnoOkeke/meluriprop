"use client"

import React, { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Navbar } from "@/components/layout/navbar"
import { Footer } from "@/components/layout/footer"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import {
    MapPin,
    TrendingUp,
    ShieldCheck,
    Calendar,
    Building2,
    ArrowUpRight,
    Info,
    CheckCircle2,
    ArrowRight,
    Calculator,
    Share2,
    Heart,
    Loader2,
    ChevronRight,
    Target,
    Zap,
    Users
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { usePrivy } from "@privy-io/react-auth"
import { useMarketplace } from "@/hooks/useMarketplace"

export default function PropertyDetailView() {
    const { id } = useParams()
    const { authenticated, login } = usePrivy()
    const { getListing, getProperty, buyProperty, approveUSDC, loading: contractLoading } = useMarketplace()
    const [propertyData, setPropertyData] = useState<any>(null)
    const [listingData, setListingData] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [isInvesting, setIsInvesting] = useState(false)
    const [investmentAmount, setInvestmentAmount] = useState("500")

    useEffect(() => {
        const loadData = async () => {
            if (!id) return;
            try {
                setLoading(true);
                // 1. Get Listing from Marketplace
                const listing = await getListing(Number(id));
                setListingData(listing);

                // 2. Get Property Details from Registry (using tokenId from listing)
                const property = await getProperty(Number(listing.tokenId));

                // 3. (Optional) Fetch IPFS Metadata for Description/Category
                // For now, we use the on-chain data and derive what we can
                let metadata = { category: "Real Estate", description: "No description available." };
                if (property.documentIPFS && property.documentIPFS.startsWith("Qm")) {
                    // In a real app, fetch(https://ipfs.io/ipfs/${property.documentIPFS})
                    // Since we seeded dummy hashes, we will leave defaults or infer from name
                    if (property.name.includes("Commercial")) metadata.category = "Commercial";
                    if (property.name.includes("Shortlet")) metadata.category = "Shortlet";
                    if (property.name.includes("Residential") || property.name.includes("Apartment") || property.name.includes("Villa")) metadata.category = "Residential";
                }

                setPropertyData({ ...property, ...metadata });
            } catch (err) {
                console.error("Failed to load property:", err);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [id]);

    if (loading || !propertyData || !listingData) {
        return (
            <div className="min-h-screen bg-slate-50 font-sans">
                <Navbar />
                <main className="container mx-auto px-6 pt-32">
                    <div className="flex items-center justify-center h-[60vh]">
                        <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    </div>
                </main>
            </div>
        )
    }

    // Derived Values from Live Data
    const pricePerShare = Number(listingData.pricePerShare) / 1e6; // USDC 6 decimals
    const valuation = Number(propertyData.valuation) / 1e6;
    const targetRaise = Number(propertyData.targetRaise) / 1e6;
    const totalTokens = Number(propertyData.totalTokens);

    // Calculate progress (Listing Amount vs Total Tokens is not quite right for funding progress)
    // Funding progress = (Tokens Sold / Total Tokens) * 100
    // But Listing tracks *remaining* amount.
    // So Sold = Total - Remaining.
    const tokensRemaining = Number(listingData.amount);
    const tokensSold = totalTokens - tokensRemaining;
    const fundedPercent = Math.round((tokensSold / totalTokens) * 100);

    return (
        <div className="min-h-screen bg-background font-sans transition-colors duration-500">
            <Navbar />

            <main className="container mx-auto max-w-7xl px-4 md:px-6 pt-24 lg:pt-32 pb-16 lg:pb-24">
                {/* Navigation Breadcrumb */}
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-10">
                    <a href="/marketplace" className="hover:text-primary transition-colors">Marketplace</a>
                    <ChevronRight className="h-3 w-3" />
                    <span className="text-slate-900">{propertyData.name}</span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
                    {/* Main Content (Left) */}
                    <div className="lg:col-span-2 space-y-16">
                        {/* Hero Section */}
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="relative h-[550px] rounded-[4rem] overflow-hidden group shadow-3xl shadow-slate-200/50"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950" />
                            {/* Dynamic Image Mapping */}
                            {(() => {
                                let imagePath = "/images/property_vi_waterfront.png"; // Default
                                const name = propertyData.name.toLowerCase();
                                if (name.includes("lagos tech")) imagePath = "/images/property_vi_commercial_1767224722088.png";
                                else if (name.includes("eko atlantic")) imagePath = "/images/property_vi_waterfront.png";
                                else if (name.includes("banana island")) imagePath = "/images/property_ikoyi_luxury.png";
                                else if (name.includes("mainland")) imagePath = "/images/property_ikeja_retail_1767224752311.png";
                                else if (name.includes("surulere")) imagePath = "/images/property_lekki_shortlet_1767224780085.png";

                                return (
                                    <div className="absolute inset-0 bg-cover bg-center mix-blend-overlay opacity-60 group-hover:scale-105 transition-transform duration-[2000ms]"
                                        style={{ backgroundImage: `url('${imagePath}')` }}
                                    />
                                );
                            })()}
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80" />

                            <div className="absolute bottom-16 left-16 right-16 flex flex-col md:flex-row items-end justify-between gap-12">
                                <div className="space-y-6 max-w-2xl">
                                    <div className="flex items-center gap-3">
                                        <Badge className="bg-primary hover:bg-primary text-white border-0 shadow-2xl shadow-primary/40 font-black px-5 py-2 uppercase tracking-widest text-[10px] rounded-full">
                                            Live on Chain
                                        </Badge>
                                        <Badge variant="outline" className="border-white/20 text-white font-black px-5 py-2 uppercase tracking-widest text-[10px] rounded-full backdrop-blur-md">
                                            {propertyData.category}
                                        </Badge>
                                    </div>
                                    <h1 className="text-5xl md:text-7xl font-heading font-black text-white tracking-tightest leading-[0.9] italic">
                                        {propertyData.name}
                                    </h1>
                                    <div className="flex items-center text-white/60 font-medium text-lg">
                                        <MapPin className="h-5 w-5 mr-3 text-primary" />
                                        {propertyData.location}
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        {/* Executive Stats Hierarchy */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                            {[
                                { label: "Valuation", value: `$${valuation.toLocaleString()}`, icon: Building2 },
                                { label: "Unit Price", value: `$${pricePerShare}`, icon: ShieldCheck },
                                { label: "Target Raise", value: `$${targetRaise.toLocaleString()}`, icon: TrendingUp, primary: true },
                                { label: "Total Tokens", value: totalTokens.toLocaleString(), icon: Calendar },
                            ].map((stat, i) => (
                                <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                                    <Card className="rounded-[2.5rem] border-slate-100 shadow-soft p-8 group hover:border-primary/20 transition-all bg-white">
                                        <div className={cn(
                                            "w-12 h-12 rounded-2xl flex items-center justify-center mb-6",
                                            stat.primary ? "bg-primary/5 text-primary" : "bg-slate-50 text-slate-400"
                                        )}>
                                            <stat.icon className="h-6 w-6" />
                                        </div>
                                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">{stat.label}</div>
                                        <div className={cn("text-2xl font-heading font-black tracking-tighter", stat.primary ? "text-primary" : "text-slate-950")}>
                                            {stat.value}
                                        </div>
                                    </Card>
                                </motion.div>
                            ))}
                        </div>

                        {/* Detail Content */}
                        <div className="bg-white rounded-[3.5rem] border border-slate-100 shadow-soft p-12 lg:p-16">
                            <h2 className="text-3xl font-heading font-black text-slate-950 tracking-tighter italic mb-8">Asset Details</h2>
                            <p className="text-slate-500 text-xl font-medium leading-relaxed mb-12">
                                {propertyData.description}
                                <br /><br />
                                <span className="text-sm text-slate-400 uppercase tracking-widest">Metadata Hash: {propertyData.documentIPFS}</span>
                            </p>
                        </div>
                    </div>

                    {/* Investment Portal (Right) */}
                    {/* ... (Keep the execution card but map to real data) ... */}
                    <div className="space-y-10">
                        {/* Re-implementing the right sidebar with live data mapping */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="sticky top-32"
                        >
                            <Card className="rounded-[4rem] border-slate-100 shadow-3xl shadow-slate-200/50 overflow-hidden bg-white">
                                <CardHeader className="p-12 text-center border-b border-slate-50">
                                    <div className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-4">Capital Deployment</div>
                                    <CardTitle className="text-3xl font-heading font-black text-slate-950 italic leading-none">Execute Stake</CardTitle>
                                </CardHeader>
                                <CardContent className="p-12 space-y-12">
                                    {/* Progress */}
                                    <div className="space-y-6">
                                        <div className="flex justify-between items-end">
                                            <div className="space-y-1">
                                                <div className="text-xs font-black text-slate-300 uppercase tracking-widest">Progress</div>
                                                <div className="text-5xl font-heading font-black text-slate-950 tracking-tighter">{fundedPercent}%</div>
                                            </div>
                                            <div className="text-right space-y-1">
                                                <div className="text-xs font-black text-slate-300 uppercase tracking-widest">Available</div>
                                                <div className="text-lg font-black text-slate-950 uppercase tracking-tight">{Number(tokensRemaining).toLocaleString()} Units</div>
                                            </div>
                                        </div>
                                        <div className="h-6 w-full bg-slate-50 rounded-full overflow-hidden p-1.5 border border-slate-100">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${fundedPercent}%` }}
                                                className="h-full bg-primary rounded-full relative"
                                            />
                                        </div>
                                    </div>

                                    {/* Input */}
                                    <div className="space-y-8">
                                        <div className="space-y-4">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-2">Investment Amount (USDC)</label>
                                            <div className="relative group">
                                                <Input
                                                    type="number"
                                                    value={investmentAmount}
                                                    onChange={(e) => setInvestmentAmount(e.target.value)}
                                                    className="h-24 px-10 rounded-[2.5rem] border-2 border-slate-50 bg-slate-50 focus:bg-white focus:border-primary transition-all text-4xl font-heading font-black tracking-tightest text-slate-950"
                                                />
                                                <div className="absolute right-10 top-1/2 -translate-y-1/2 text-sm font-black text-slate-300 uppercase tracking-widest">USDC</div>
                                            </div>
                                        </div>

                                        <div className="bg-slate-50 p-8 rounded-[2.5rem] space-y-5 border border-slate-100">
                                            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                                                <span className="text-slate-400">Tokens to Mint</span>
                                                <span className="text-slate-950">{Math.floor(Number(investmentAmount) / pricePerShare).toLocaleString()} PROPS</span>
                                            </div>
                                        </div>
                                    </div>

                                    <Button
                                        disabled={isInvesting || tokensRemaining === 0}
                                        onClick={async () => {
                                            if (!authenticated) {
                                                login();
                                                return;
                                            }
                                            try {
                                                setIsInvesting(true);
                                                const shares = Math.floor(Number(investmentAmount) / pricePerShare);
                                                if (shares <= 0) {
                                                    alert("Investment too small");
                                                    return;
                                                }
                                                // 1. Approve
                                                await approveUSDC(investmentAmount);
                                                // 2. Buy
                                                await buyProperty(Number(id), shares);
                                                alert("Investment Successful!");
                                                window.location.reload();
                                            } catch (err: any) {
                                                console.error(err);
                                                alert("Failed: " + err.message);
                                            } finally {
                                                setIsInvesting(false);
                                            }
                                        }}
                                        className="w-full h-24 rounded-[2.5rem] text-xl font-black uppercase tracking-widest shadow-2xl shadow-primary/30 hover:shadow-primary/50 transition-all group/btn"
                                    >
                                        {isInvesting ? <Loader2 className="animate-spin" /> : "Purchase Tokens"}
                                    </Button>

                                </CardContent>
                            </Card>
                        </motion.div>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    )
}
