"use client"

import React from "react"
import Link from "next/link"

export function Footer() {
    return (
        <footer className="py-20 border-t border-border px-6 bg-card">
            <div className="container mx-auto max-w-7xl">
                <div className="flex flex-col lg:flex-row justify-between items-center gap-12 text-center lg:text-left">
                    <div className="space-y-4">
                        <Link href="/" className="flex items-center justify-center lg:justify-start space-x-3">
                            <div className="h-8 w-8 relative flex items-center justify-center">
                                <img src="/img/logo.png" alt="Meluri Capital Logo" className="h-8 w-8 object-contain" />
                            </div>
                            <span className="font-heading font-black text-2xl tracking-tighter text-foreground">
                                Meluri Capital
                            </span>
                        </Link>
                        <p className="text-muted-foreground text-sm font-medium">© 2025 Meluri Capital. All rights reserved.</p>
                    </div>

                    <div className="flex gap-12">
                        <div className="space-y-4">
                            <h5 className="text-[10px] font-black uppercase tracking-widest text-foreground leading-none">Platform</h5>
                            <div className="flex flex-col gap-2 text-sm text-muted-foreground font-medium">
                                <Link href="/marketplace" className="hover:text-primary transition-colors">Marketplace</Link>
                                <Link href="/portfolio" className="hover:text-primary transition-colors">Portfolio</Link>
                                <Link href="/dao" className="hover:text-primary transition-colors">Governance</Link>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <h5 className="text-[10px] font-black uppercase tracking-widest text-foreground leading-none">Legal</h5>
                            <div className="flex flex-col gap-2 text-sm text-muted-foreground font-medium">
                                <Link href="#" className="hover:text-primary transition-colors">Terms</Link>
                                <Link href="#" className="hover:text-primary transition-colors">Privacy</Link>
                                <Link href="#" className="hover:text-primary transition-colors">Security</Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    )
}
