"use client"

import dynamic from "next/dynamic";

const PortfolioView = dynamic(() => import("@/components/portfolio/PortfolioView"), {
    ssr: false,
});

export default function PortfolioPage() {
    return <PortfolioView />;
}
