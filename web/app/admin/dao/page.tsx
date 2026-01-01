"use client"

import dynamic from "next/dynamic";

const AdminDaoView = dynamic(() => import("@/components/admin/AdminDaoView"), {
    ssr: false,
});

export default function AdminDaoPage() {
    return <AdminDaoView />;
}
