"use client"

import dynamic from "next/dynamic";

const DaoView = dynamic(() => import("@/components/dao/DaoView"), {
    ssr: false,
});

export default function DaoPage() {
    return <DaoView />;
}
