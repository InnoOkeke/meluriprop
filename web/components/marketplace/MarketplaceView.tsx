"use client"

import React, { useState, useEffect } from "react"
import { usePrivy } from "@privy-io/react-auth"
import { useRouter } from "next/navigation"
import { Navbar } from "@/components/layout/navbar"
import { Footer } from "@/components/layout/footer"
import { PropertyCard } from "@/components/marketplace/property-card"
import { Property } from "@/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Filter, ArrowUpRight, Building2, Wallet } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useMarketplace } from "@/hooks/useMarketplace"
import { API_URL } from "@/config"
import { Badge } from "@/components/ui/badge"

export default function MarketplaceView() {
    const { authenticated } = usePrivy()
    const { buyProperty, approveUSDC, getActiveListings, loading: contractLoading } = useMarketplace()

    const [properties, setProperties] = useState<Property[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [selectedCategory, setSelectedCategory] = useState("All")
    const [activeTab, setActiveTab] = useState<"primary" | "secondary">("primary")

    useEffect(() => {
        fetchProperties()
    }, [])

    const router = useRouter()

    const handleBuy = (propertyId: number) => {
        router.push(`/marketplace/${propertyId}`)
    }


    // ...

    const fetchProperties = async () => {
        try {
            setLoading(true);
            const listings = await getActiveListings();

            // Map listings to Property interface
            const mappedProperties = listings.map(listing => {
                const categoryMap = ["Residential", "Commercial", "Shortlet"]; // Enum mapping
                const catIndex = Number(listing.property.category);

                // Image Mapping
                let imagePath = "/images/property_vi_waterfront.png"; // Default
                const name = listing.property.name.toLowerCase();
                if (name.includes("lagos tech")) imagePath = "/images/property_vi_commercial_1767224722088.png";
                else if (name.includes("eko atlantic")) imagePath = "/images/property_vi_waterfront.png";
                else if (name.includes("banana island")) imagePath = "/images/property_ikoyi_luxury.png";
                else if (name.includes("mainland")) imagePath = "/images/property_ikeja_retail_1767224752311.png";
                else if (name.includes("surulere")) imagePath = "/images/property_lekki_shortlet_1767224780085.png";

                return {
                    id: listing.listingId,
                    name: listing.property.name,
                    location: listing.property.location,
                    price: Number(listing.pricePerShare), // Assuming price is per token/share
                    image: imagePath,
                    category: categoryMap[catIndex] || "Residential",
                    roi: 12.5, // Mock or calc
                    available: Number(listing.amount),
                    totalValue: Number(listing.property.valuation),
                    funded: 0 // Mock
                } as any;
            });

            setProperties(mappedProperties);
        } catch (err) {
            console.error("Failed to fetch blockchain listings:", err);
        } finally {
            setLoading(false);
        }
    }

    const filteredProperties = properties.filter(property => {
        const matchesSearch = property.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            property.location.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesCategory = selectedCategory === "All" || property.category === selectedCategory
        return matchesSearch && matchesCategory;
    })



    return (
        <div className="min-h-screen bg-background font-sans transition-colors duration-500">
            <Navbar />

            <main className="container mx-auto max-w-7xl px-4 md:px-6 pt-24 lg:pt-32 pb-16 lg:pb-24">
                {/* Header Section */}
                <div className="flex flex-col lg:flex-row justify-between items-end mb-12 lg:mb-16 gap-8">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="space-y-3 lg:space-y-4 w-full lg:w-auto"
                    >
                        <Badge variant="outline" className="border-accent/40 bg-accent/10 text-accent tracking-widest uppercase font-black px-4 py-1.5 rounded-full text-[10px]">
                            Verified Assets
                        </Badge>
                        <h1 className="text-4xl md:text-5xl lg:text-7xl font-heading font-black text-foreground tracking-tightest leading-none">
                            Premium <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">Real Estate.</span>
                        </h1>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto"
                    >
                        <div className="h-14 bg-card border border-border rounded-2xl flex p-1.5 items-center w-full sm:w-auto overflow-x-auto">
                            {["primary", "secondary"].map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab as any)}
                                    className={`px-6 md:px-8 flex-1 sm:flex-none h-full rounded-xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === tab
                                        ? "bg-primary text-primary-foreground shadow-lg"
                                        : "text-muted-foreground hover:text-foreground"
                                        }`}
                                >
                                    {tab === "primary" ? "Primary Offerings" : "Secondary Market"}
                                </button>
                            ))}
                        </div>
                    </motion.div>
                </div>

                {/* Filters */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="flex flex-col md:flex-row gap-4 mb-8 lg:mb-12 bg-card p-3 lg:p-4 rounded-[2rem] border border-border shadow-soft"
                >
                    <div className="relative flex-grow">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input
                            placeholder="Search by location or name..."
                            className="h-14 pl-14 rounded-2xl border-border bg-input/50 focus:bg-background transition-colors text-base"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-4">
                        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                            <SelectTrigger className="w-[180px] h-14 rounded-2xl border-border bg-card">
                                <SelectValue placeholder="Category" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl border-border bg-card text-card-foreground">
                                {["All", "Residential", "Commercial", "Shortlet"].map((cat) => (
                                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Button variant="outline" className="h-14 w-14 rounded-2xl border-border p-0 bg-card hover:bg-muted" size="icon">
                            <Filter className="h-5 w-5 text-foreground" />
                        </Button>
                    </div>
                </motion.div>

                {/* Grid */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div key={i} className="h-[400px] md:h-[500px] rounded-[2.5rem] bg-muted animate-pulse" />
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                        <AnimatePresence>
                            {filteredProperties.map((property, idx) => (
                                <motion.div
                                    key={property.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ delay: idx * 0.1 }}
                                >
                                    <PropertyCard
                                        {...property}
                                        onBuyClick={() => handleBuy(property.id)}
                                    />
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </main>
            <Footer />
        </div>
    )
}
