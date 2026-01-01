"use client"

import React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import LoginButton from "@/components/login-button"
import { ThemeToggle } from "@/components/theme-toggle"
import { cn } from "@/lib/utils"
import { LayoutDashboard, ShoppingBag, Vote, PieChart, Menu, Search } from "lucide-react"

const NAV_LINKS = [
    { name: "Marketplace", href: "/marketplace", icon: ShoppingBag },
    { name: "Portfolio", href: "/portfolio", icon: PieChart },
    { name: "Governance", href: "/dao", icon: Vote },
]

export function Navbar() {
    const pathname = usePathname()
    const [scrolled, setScrolled] = React.useState(false)

    React.useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 10)
        window.addEventListener("scroll", handleScroll)
        return () => window.removeEventListener("scroll", handleScroll)
    }, [])

    return (
        <header className={cn(
            "fixed top-0 z-[100] w-full transition-all duration-500",
            scrolled
                ? "bg-card/70 backdrop-blur-xl border-b border-border py-3 shadow-soft"
                : "bg-transparent py-5"
        )}>
            <div className="container mx-auto px-6 flex items-center justify-between">
                <div className="flex items-center gap-12">
                    <Link href="/" className="flex items-center space-x-3 group">
                        {/* Reduced Logo Size for elegance */}
                        <div className="h-8 w-8 relative overflow-hidden rounded-lg group-hover:scale-110 transition-transform duration-300">
                            <img src="/img/logo.png" alt="Meluri Capital Logo" className="h-full w-full object-contain" />
                        </div>
                        <span className="hidden sm:inline-block font-heading font-black text-xl tracking-tighter text-foreground">
                            Meluri Capital
                        </span>
                    </Link>

                    <nav className="hidden md:flex items-center space-x-1">
                        {NAV_LINKS.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={cn(
                                    "px-5 py-2 text-[11px] font-bold uppercase tracking-[0.15em] transition-all duration-300 rounded-full",
                                    pathname === link.href
                                        ? "bg-primary text-primary-foreground shadow-lg"
                                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                                )}
                            >
                                {link.name}
                            </Link>
                        ))}
                    </nav>
                </div>

                <div className="flex items-center gap-4">
                    <div className="hidden lg:flex items-center">
                        <div className="relative group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                            <input
                                type="text"
                                placeholder="Search assets..."
                                className="pl-10 pr-4 py-2 bg-muted/50 border border-transparent rounded-full text-xs font-medium focus:bg-card focus:border-border focus:ring-4 focus:ring-primary/5 w-40 transition-all focus:w-56 outline-none text-foreground placeholder:text-muted-foreground"
                            />
                        </div>
                    </div>
                    <ThemeToggle />
                    <LoginButton />
                    <button className="md:hidden p-2 rounded-xl bg-muted text-foreground hover:bg-muted/80 transition-colors">
                        <Menu className="h-5 w-5" />
                    </button>
                </div>
            </div>
        </header>
    )
}
