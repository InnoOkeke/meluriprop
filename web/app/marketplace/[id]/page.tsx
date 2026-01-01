"use client"

import dynamic from "next/dynamic";

const PropertyDetailView = dynamic(() => import("@/components/marketplace/PropertyDetailView"), {
    ssr: false,
});

export default function PropertyDetailPage() {
    return <PropertyDetailView />;
}
