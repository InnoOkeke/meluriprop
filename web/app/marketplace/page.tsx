"use client"

import dynamic from "next/dynamic";

const MarketplaceView = dynamic(() => import("@/components/marketplace/MarketplaceView"), {
    ssr: false,
});

export default function MarketplacePage() {
    return <MarketplaceView />;
}
