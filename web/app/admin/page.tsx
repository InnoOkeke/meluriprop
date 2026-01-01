"use client"

import dynamic from "next/dynamic";

const AdminView = dynamic(() => import("@/components/admin/AdminView"), {
    ssr: false,
});

export default function AdminPage() {
    return <AdminView />;
}
