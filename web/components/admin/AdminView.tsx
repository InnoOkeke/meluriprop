"use client"

import { usePrivy, useWallets } from '@privy-io/react-auth';
import { useState, useEffect } from 'react';
import { API_URL, ADMIN_WALLETS, CONTRACT_ADDRESSES, circleArcTestnet } from '@/config';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import {
    Building2,
    Vote,
    CheckCircle2,
    Wallet,
    ShieldCheck,
    AlertTriangle,
    Loader2,
    Upload,
    X,
    Image as ImageIcon,
    RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { createWalletClient, custom, createPublicClient, http, parseUnits } from 'viem';
import { PropertiesRegistryABI } from '@/lib/abis/PropertiesRegistry';

// Detailed Progress State
type ProgressStep = 'IDLE' | 'UPLOADING' | 'SWITCHING_NETWORK' | 'PREPARING_TX' | 'WAITING_SIGNATURE' | 'MINTING' | 'SAVING' | 'SUCCESS';

export default function AdminView() {
    const { ready, authenticated, user, getAccessToken, login } = usePrivy();
    const { wallets } = useWallets();
    const [activeTab, setActiveTab] = useState<'property' | 'proposal'>('property');
    const [progressStep, setProgressStep] = useState<ProgressStep>('IDLE');
    const [statusMessage, setStatusMessage] = useState('');
    const [successDetails, setSuccessDetails] = useState<{ txHash: string, tokenId: number } | null>(null);
    const [isAdmin, setIsAdmin] = useState(false);

    // File Upload State
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string>('');

    // Property Form State
    const [propertyData, setPropertyData] = useState({
        name: '',
        location: '',
        valuation: '',
        targetRaise: '',
        category: 'Residential',
    });

    // Proposal Form State
    const [proposalData, setProposalData] = useState({
        description: '',
        permissionType: 'Global',
        targetTokenId: '',
        durationSeconds: '604800',
    });

    // Check if connected wallet is admin
    useEffect(() => {
        if (authenticated && user?.wallet?.address) {
            const walletAddress = user.wallet.address.toLowerCase();
            const isAuthorized = ADMIN_WALLETS.includes(walletAddress);
            setIsAdmin(isAuthorized);
        } else {
            setIsAdmin(false);
        }
    }, [authenticated, user]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handlePropertySubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setProgressStep('UPLOADING');
        setStatusMessage('Uploading image to server...');
        setSuccessDetails(null);

        try {
            const token = await getAccessToken();
            const wallet = wallets[0];
            if (!wallet) throw new Error("Wallet not connected");

            let imageUrl = '';

            // 1. Upload Image
            if (imageFile) {
                const formData = new FormData();
                formData.append('file', imageFile);

                const uploadRes = await fetch(`${API_URL}/upload`, {
                    method: 'POST',
                    body: formData,
                });

                if (!uploadRes.ok) throw new Error("Image upload failed");
                const uploadData = await uploadRes.json();
                imageUrl = uploadData.url;
            }

            // 2. Network Switch
            setStatusMessage('Please switch wallet network...');
            setProgressStep('SWITCHING_NETWORK');
            await wallet.switchChain(circleArcTestnet.id);

            // 3. Prepare Mint
            setStatusMessage('Preparing transaction...');
            setProgressStep('PREPARING_TX');

            const publicClient = createPublicClient({
                chain: circleArcTestnet,
                transport: http(),
            });

            const provider = await wallet.getEthereumProvider();
            const walletClient = createWalletClient({
                account: wallet.address as `0x${string}`,
                chain: circleArcTestnet,
                transport: custom(provider),
            });

            const valuationWei = parseUnits(propertyData.valuation, 18);
            const targetRaiseWei = parseUnits(propertyData.targetRaise, 18);
            const totalTokens = valuationWei;

            // Hardcode IPFS/Document hash for demo
            const documentHash = "QmHashPlaceholder";

            console.log("Minting property:", propertyData.name);

            const { request } = await publicClient.simulateContract({
                account: wallet.address as `0x${string}`,
                address: CONTRACT_ADDRESSES.PropertiesRegistry as `0x${string}`,
                abi: PropertiesRegistryABI,
                functionName: 'registerProperty',
                args: [
                    propertyData.name,
                    propertyData.location,
                    documentHash,
                    valuationWei,
                    targetRaiseWei,
                    totalTokens
                ]
            });

            setProgressStep('WAITING_SIGNATURE');
            setStatusMessage('Check your wallet to sign transaction...');

            const hash = await walletClient.writeContract(request);
            console.log("Mint Tx:", hash);

            setProgressStep('MINTING');
            setStatusMessage('Transaction sent. Waiting for block confirmation...');

            // Wait for receipt
            const receipt = await publicClient.waitForTransactionReceipt({ hash });

            // Extract TokenId logic
            let tokenId = 0;
            try {
                const log = receipt.logs.find(l => l.address.toLowerCase() === CONTRACT_ADDRESSES.PropertiesRegistry.toLowerCase());
                if (log && log.topics[1]) {
                    tokenId = parseInt(log.topics[1], 16);
                    console.log("Detected Token ID:", tokenId);
                }
            } catch (e) {
                console.error("Failed to parse logs", e);
            }

            // 3. Save to DB
            setProgressStep('SAVING');
            setStatusMessage('Saving property details to database...');

            const response = await fetch(`${API_URL}/properties`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    name: propertyData.name,
                    description: `Property located at ${propertyData.location}`,
                    location: propertyData.location,
                    valuation: Number(propertyData.valuation),
                    targetRaise: Number(propertyData.targetRaise),
                    minInvestment: 100, // Default
                    images: imageUrl ? [imageUrl] : [],
                    category: propertyData.category,
                    tokenId: tokenId || undefined,
                    contractAddress: CONTRACT_ADDRESSES.PropertiesRegistry,
                })
            });

            if (response.ok) {
                setSuccessDetails({ txHash: hash, tokenId });
                setProgressStep('SUCCESS');
                setStatusMessage('Property created successfully!');

                // Clear form after delay
                setTimeout(() => {
                    setPropertyData({ name: '', location: '', valuation: '', targetRaise: '', category: 'Residential' });
                    setImageFile(null);
                    setImagePreview('');
                    setProgressStep('IDLE');
                    setStatusMessage('');
                    setSuccessDetails(null);
                }, 10000); // 10s to see success message
            } else {
                const error = await response.json();
                throw new Error(`DB Error: ${error.message} (Minting succeeded: ${hash})`);
            }
        } catch (err: any) {
            console.error(err);
            alert(`❌ Failed: ${err.message || err}`);
            setProgressStep('IDLE');
        }
    };

    const handleProposalSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setProgressStep('SAVING');
        try {
            const token = await getAccessToken();
            const response = await fetch(`${API_URL}/dao/proposals`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    description: proposalData.description,
                    permissionType: proposalData.permissionType,
                    targetTokenId: proposalData.targetTokenId ? Number(proposalData.targetTokenId) : undefined,
                    durationSeconds: Number(proposalData.durationSeconds),
                })
            });

            if (response.ok) {
                alert('✅ Proposal created successfully!');
                setProposalData({ description: '', permissionType: 'Global', targetTokenId: '', durationSeconds: '604800' });
            } else {
                const error = await response.json();
                alert(`❌ Error: ${error.message}`);
            }
        } catch (err) {
            console.error(err);
            alert('❌ Failed to create proposal');
        } finally {
            setProgressStep('IDLE');
        }
    };

    // ... (Login Logic same as before)
    if (!ready) return <div className="min-h-screen bg-slate-50 flex items-center justify-center"><Loader2 className="h-12 w-12 text-primary animate-spin" /></div>;
    if (!authenticated) {
        return (
            <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-center">
                <ShieldCheck className="h-16 w-16 text-primary mb-6" />
                <h1 className="text-4xl text-white font-black mb-4">Admin Portal</h1>
                <Button onClick={login} size="lg" className="bg-primary text-white">Connect Wallet</Button>
            </div>
        );
    }
    if (!isAdmin) {
        return (
            <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-center">
                <AlertTriangle className="h-16 w-16 text-red-500 mb-6" />
                <h1 className="text-3xl text-white font-black mb-4">Access Denied</h1>
                <p className="text-white/50">{user?.wallet?.address}</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 font-sans">
            <main className="container mx-auto px-6 py-16">
                {/* Header Section */}
                <div className="flex flex-col lg:flex-row justify-between items-end mb-16 gap-8">
                    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                        <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary">Administrative Panel</span>
                        <div className="flex items-center gap-2 pt-2">
                            <span className="text-slate-400 font-medium">Admin:</span>
                            <code className="text-slate-950 font-mono text-sm font-bold bg-slate-100 px-3 py-1 rounded-lg">{user?.wallet?.address?.slice(0, 6) + '...' + user?.wallet?.address?.slice(-4)}</code>
                            <Badge className="bg-green-500/10 text-green-700 font-bold">Authorized</Badge>
                        </div>
                    </motion.div>
                    <div className="flex p-1.5 bg-white rounded-2xl border border-slate-200 shadow-soft w-full lg:w-auto">
                        <button onClick={() => setActiveTab('property')} className={cn("flex-1 lg:flex-none px-8 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all gap-2 flex items-center", activeTab === 'property' ? "bg-primary text-white" : "text-slate-400")}>
                            <Building2 className="h-4 w-4" /> Properties
                        </button>
                        <button onClick={() => setActiveTab('proposal')} className={cn("flex-1 lg:flex-none px-8 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all gap-2 flex items-center", activeTab === 'proposal' ? "bg-primary text-white" : "text-slate-400")}>
                            <Vote className="h-4 w-4" /> Proposals
                        </button>
                    </div>
                </div>

                {/* Forms Section */}
                <div className="max-w-4xl mx-auto">
                    <Card className="rounded-[3rem] border-slate-100 shadow-soft overflow-hidden bg-white p-10 lg:p-14 relative">
                        {/* Progress Overlay */}
                        {progressStep !== 'IDLE' && progressStep !== 'SUCCESS' && (
                            <div className="absolute inset-0 bg-white/90 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-8 text-center">
                                <Loader2 className="h-16 w-16 text-primary animate-spin mb-6" />
                                <h3 className="text-2xl font-black text-slate-800 mb-2">{statusMessage}</h3>
                                <p className="text-slate-500 font-medium text-sm">Do not close this window.</p>
                            </div>
                        )}

                        {/* Success Overlay */}
                        {progressStep === 'SUCCESS' && (
                            <div className="absolute inset-0 bg-green-50/95 backdrop-blur-md z-50 flex flex-col items-center justify-center p-8 text-center">
                                <div className="h-20 w-20 bg-green-500 rounded-full flex items-center justify-center mb-6 shadow-xl shadow-green-500/30">
                                    <CheckCircle2 className="h-10 w-10 text-white" />
                                </div>
                                <h3 className="text-3xl font-black text-green-800 mb-2">Property Created!</h3>
                                <div className="space-y-1 mb-8">
                                    <p className="text-green-700 font-medium">Successfully minted and listed.</p>
                                    {successDetails && (
                                        <div className="mt-4 bg-white/50 p-4 rounded-xl border border-green-200 inline-block text-left text-xs font-mono text-green-900">
                                            <p>Token ID: {successDetails.tokenId}</p>
                                            <p>Tx Hash: {successDetails.txHash.slice(0, 10)}...{successDetails.txHash.slice(-8)}</p>
                                        </div>
                                    )}
                                </div>
                                <Button onClick={() => setProgressStep('IDLE')} className="bg-green-600 hover:bg-green-700 text-white rounded-full">Create Another</Button>
                            </div>
                        )}

                        {activeTab === 'property' ? (
                            <motion.form initial={{ opacity: 0 }} animate={{ opacity: 1 }} onSubmit={handlePropertySubmit} className="space-y-8">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary"><Building2 className="h-7 w-7" /></div>
                                    <div>
                                        <h2 className="text-2xl font-heading font-black text-slate-950">New Property Listing</h2>
                                    </div>
                                </div>

                                {/* Form Fields (Same as before but cleaner) */}
                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">Property Image</label>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="relative h-24">
                                                <Input type="file" accept="image/*" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                                                <div className="h-full w-full rounded-xl border-2 border-dashed border-slate-100 bg-slate-50 flex flex-col items-center justify-center text-slate-400">
                                                    <Upload className="h-5 w-5 mb-2" />
                                                    <span className="text-xs font-bold">{imageFile ? "Change Image" : "Upload Image"}</span>
                                                </div>
                                            </div>
                                            <div className="h-24 rounded-xl bg-slate-50 flex items-center justify-center overflow-hidden border border-slate-100">
                                                {imagePreview ? <img src={imagePreview} className="w-full h-full object-cover" /> : <ImageIcon className="h-6 w-6 text-slate-200" />}
                                            </div>
                                        </div>
                                        {imageFile && <p className="text-xs font-medium text-slate-500 mt-2">{imageFile.name}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Property Name</label>
                                        <Input className="h-14 rounded-xl bg-slate-50" value={propertyData.name} onChange={e => setPropertyData({ ...propertyData, name: e.target.value })} required />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Location</label>
                                        <Input className="h-14 rounded-xl bg-slate-50" value={propertyData.location} onChange={e => setPropertyData({ ...propertyData, location: e.target.value })} required />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Valuation</label>
                                            <Input type="number" className="h-14 rounded-xl bg-slate-50" value={propertyData.valuation} onChange={e => setPropertyData({ ...propertyData, valuation: e.target.value })} required />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Target Raise</label>
                                            <Input type="number" className="h-14 rounded-xl bg-slate-50" value={propertyData.targetRaise} onChange={e => setPropertyData({ ...propertyData, targetRaise: e.target.value })} required />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Category</label>
                                        <select className="w-full h-14 px-4 bg-slate-50 rounded-xl border border-slate-200" value={propertyData.category} onChange={e => setPropertyData({ ...propertyData, category: e.target.value })}>
                                            <option value="Residential">Residential</option>
                                            <option value="Commercial">Commercial</option>
                                            <option value="Shortlet">Shortlet</option>
                                        </select>
                                    </div>
                                </div>

                                <Button type="submit" disabled={progressStep !== 'IDLE'} className="w-full h-16 rounded-2xl font-bold uppercase tracking-widest text-xs shadow-xl shadow-primary/20">
                                    <CheckCircle2 className="h-4 w-4 mr-2" />
                                    Mint Property
                                </Button>
                            </motion.form>
                        ) : (
                            // Keeping Proposal Form Simple for now as focus is on Property
                            <motion.form initial={{ opacity: 0 }} animate={{ opacity: 1 }} onSubmit={handleProposalSubmit} className="space-y-6">
                                <h2 className="text-2xl font-black">Create Proposal</h2>
                                <Input placeholder="Description" value={proposalData.description} onChange={e => setProposalData({ ...proposalData, description: e.target.value })} />
                                <Button type="submit" className="w-full h-14">Submit Proposal</Button>
                            </motion.form>
                        )}
                    </Card>
                </div>
            </main>
        </div>
    );
}
