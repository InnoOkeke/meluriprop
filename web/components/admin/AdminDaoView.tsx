"use client"

import { useState } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import Link from 'next/link';
import { API_URL } from '@/config';

export default function AdminDaoView() {
    const { getAccessToken } = usePrivy();
    const [description, setDescription] = useState('');
    const [permissionType, setPermissionType] = useState('Global');
    const [targetTokenId, setTargetTokenId] = useState('');
    const [duration, setDuration] = useState('86400'); // 1 day
    const [status, setStatus] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('Creating...');

        try {
            const token = await getAccessToken();
            const res = await fetch(`${API_URL}/dao/proposals`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    description,
                    permissionType,
                    targetTokenId: permissionType === 'SpecificHolders' ? Number(targetTokenId) : undefined,
                    durationSeconds: Number(duration)
                })
            });

            if (res.ok) {
                setStatus('Proposal Created!');
                setDescription('');
            } else {
                const err = await res.json();
                setStatus(`Error: ${err.message}`);
            }
        } catch (err) {
            console.error(err);
            setStatus('Failed to connect.');
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 p-8">
            <div className="max-w-2xl mx-auto bg-white p-6 rounded-xl shadow-sm">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-slate-900">Create DAO Proposal</h1>
                    <Link href="/admin" className="text-blue-600 hover:underline">Back to Admin</Link>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700">Question / Proposal</label>
                        <textarea
                            required
                            className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                            rows={3}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700">Voting Permission</label>
                        <select
                            className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                            value={permissionType}
                            onChange={(e) => setPermissionType(e.target.value)}
                        >
                            <option value="Global">Global (All Verified Users)</option>
                            <option value="AnyInvestor">Any Investor (Must own at least 1 token)</option>
                            <option value="SpecificHolders">Specific Property Holders</option>
                        </select>
                    </div>

                    {permissionType === 'SpecificHolders' && (
                        <div>
                            <label className="block text-sm font-medium text-slate-700">Target Property ID</label>
                            <input
                                type="number"
                                className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                                value={targetTokenId}
                                onChange={(e) => setTargetTokenId(e.target.value)}
                            />
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-slate-700">Duration (Seconds)</label>
                        <input
                            type="number"
                            className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                            value={duration}
                            onChange={(e) => setDuration(e.target.value)}
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        Create Proposal
                    </button>
                </form>

                {status && (
                    <div className={`mt-4 p-4 rounded-md ${status.includes('Error') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                        {status}
                    </div>
                )}
            </div>
        </div>
    );
}

