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
    Image as ImageIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { createWalletClient, custom, createPublicClient, http, parseUnits } from 'viem';
import { PropertiesRegistryABI } from '@/lib/abis/PropertiesRegistry';

export default function AdminView() {
    const { ready, authenticated, user, getAccessToken, login } = usePrivy();
    const { wallets } = useWallets();
    const [activeTab, setActiveTab] = useState<'property' | 'proposal'>('property');
    const [loading, setLoading] = useState(false);
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
        setLoading(true);
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
                    body: formData, // No auth needed for upload for now, or check backend
                });

                if (!uploadRes.ok) throw new Error("Image upload failed");
                const uploadData = await uploadRes.json();
                imageUrl = uploadData.url;
            }

            // 2. Mint on Blockchain
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

            const hash = await walletClient.writeContract(request);
            console.log("Mint Tx:", hash);

            // Wait for receipt
            const receipt = await publicClient.waitForTransactionReceipt({ hash });

            // Extract TokenId logic
            let tokenId = 0;
            try {
                // PropertyRegistered(uint256,address,string,...)
                // Event signature hash: 0x...
                // Simpler: Just grab the first topic of the log from the registry address
                const log = receipt.logs.find(l => l.address.toLowerCase() === CONTRACT_ADDRESSES.PropertiesRegistry.toLowerCase());
                if (log && log.topics[1]) {
                    tokenId = parseInt(log.topics[1], 16);
                    console.log("Detected Token ID:", tokenId);
                }
            } catch (e) {
                console.error("Failed to parse logs", e);
            }

            // 3. Save to DB
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
                alert('✅ Property created & Minted successfully!');
                setPropertyData({ name: '', location: '', valuation: '', targetRaise: '', category: 'Residential' });
                setImageFile(null);
                setImagePreview('');
            } else {
                const error = await response.json();
                alert(`❌ DB Error: ${error.message} (Minting succeeded: ${hash})`);
            }
        } catch (err: any) {
            console.error(err);
            alert(`❌ Failed: ${err.message || err}`);
        } finally {
            setLoading(false);
        }
    };

    const handleProposalSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
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
            setLoading(false);
        }
    };


    if (!ready) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <Loader2 className="h-12 w-12 text-primary animate-spin" />
            </div>
        );
    }

    if (!authenticated) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col items-center justify-center p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px] -mr-64 -mt-64" />
                <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-secondary/20 rounded-full blur-[120px] -ml-64 -mb-64" />

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative z-10 text-center max-w-md"
                >
                    <div className="w-24 h-24 bg-white/10 backdrop-blur-md border border-white/20 rounded-[2.5rem] flex items-center justify-center mb-10 shadow-2xl mx-auto">
                        <ShieldCheck className="h-12 w-12 text-primary" />
                    </div>
                    <h1 className="text-5xl font-heading font-black text-white mb-4 tracking-tight">Admin Portal</h1>
                    <p className="text-white/60 font-medium mb-12 text-lg leading-relaxed">
                        Connect your authorized admin wallet to access the management dashboard.
                    </p>
                    <Button
                        size="lg"
                        className="h-16 px-12 rounded-full font-bold uppercase tracking-widest text-xs shadow-2xl shadow-primary/30 bg-primary hover:bg-primary/90"
                        onClick={login}
                    >
                        <Wallet className="h-5 w-5 mr-3" />
                        Connect Wallet
                    </Button>
                </motion.div>
            </div>
        );
    }

    if (!isAdmin) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-red-900 via-red-800 to-slate-900 flex flex-col items-center justify-center p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-red-500/20 rounded-full blur-[120px] -mr-64 -mt-64" />

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative z-10 text-center max-w-md bg-white/10 backdrop-blur-md border border-white/20 rounded-[3rem] p-12"
                >
                    <div className="w-20 h-20 bg-red-500/20 backdrop-blur-md border border-red-500/30 rounded-full flex items-center justify-center mb-8 mx-auto">
                        <AlertTriangle className="h-10 w-10 text-red-400" />
                    </div>
                    <h2 className="text-3xl font-heading font-black text-white mb-4 tracking-tight">Access Denied</h2>
                    <div className="p-4 bg-black/20 rounded-2xl border border-white/10 mb-8">
                        <p className="text-xs font-mono text-white/50 break-all">{user?.wallet?.address}</p>
                    </div>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 font-sans">
            <main className="container mx-auto px-6 py-16">
                {/* Header Section */}
                <div className="flex flex-col lg:flex-row justify-between items-end mb-16 gap-8">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="space-y-4"
                    >
                        <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary">Administrative Panel</span>

                        <div className="flex items-center gap-2 pt-2">
                            <span className="text-slate-400 font-medium">Admin Wallet:</span>
                            <code className="text-slate-950 font-mono text-sm font-bold bg-slate-100 px-3 py-1 rounded-lg">{user?.wallet?.address?.slice(0, 6) + '...' + user?.wallet?.address?.slice(-4)}</code>
                            <Badge className="bg-green-500/10 text-green-700 border-green-200 font-black text-[9px] uppercase tracking-widest ml-1 px-3 py-1">Authorized</Badge>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex p-1.5 bg-white rounded-2xl border border-slate-200 shadow-soft w-full lg:w-auto"
                    >
                        <button
                            onClick={() => setActiveTab('property')}
                            className={cn(
                                "flex-1 lg:flex-none px-8 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all flex items-center gap-2",
                                activeTab === 'property' ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-slate-400 hover:text-slate-600"
                            )}
                        >
                            <Building2 className="h-4 w-4" />
                            Properties
                        </button>
                        <button
                            onClick={() => setActiveTab('proposal')}
                            className={cn(
                                "flex-1 lg:flex-none px-8 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all flex items-center gap-2",
                                activeTab === 'proposal' ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-slate-400 hover:text-slate-600"
                            )}
                        >
                            <Vote className="h-4 w-4" />
                            Proposals
                        </button>
                    </motion.div>
                </div>

                {/* Forms Section */}
                <div className="max-w-4xl mx-auto">
                    <Card className="rounded-[3rem] border-slate-100 shadow-soft overflow-hidden bg-white p-10 lg:p-14">
                        {activeTab === 'property' ? (
                            <motion.form
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                onSubmit={handlePropertySubmit}
                                className="space-y-8"
                            >
                                <div className="flex items-center gap-4 mb-8">
                                    <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                                        <Building2 className="h-7 w-7" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-heading font-black text-slate-950 tracking-tight">New Property Listing</h2>
                                        <p className="text-slate-400 text-sm font-medium">Add a new real estate asset to the marketplace</p>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    {/* Image Upload Section */}
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">Property Image</label>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <div className="relative h-14 cursor-pointer">
                                                    <Input
                                                        type="file"
                                                        accept="image/*"
                                                        onChange={handleFileChange}
                                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                                    />
                                                    <div className="h-full w-full rounded-xl border-slate-100 bg-slate-50/50 flex items-center px-4 border text-slate-500 font-medium">
                                                        <Upload className="h-4 w-4 mr-2" />
                                                        {imageFile ? imageFile.name : "Choose Image File..."}
                                                    </div>
                                                </div>
                                                <p className="text-[9px] font-medium text-slate-400 mt-1.5 px-1">Upload JPEG, PNG or WEBP (Max 5MB)</p>
                                            </div>
                                            <div className="h-32 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50 overflow-hidden flex items-center justify-center">
                                                {imagePreview ? (
                                                    <div className="relative w-full h-full group">
                                                        <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                                                        <button
                                                            type="button"
                                                            onClick={() => { setImageFile(null); setImagePreview(''); }}
                                                            className="absolute top-2 right-2 h-8 w-8 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                                        >
                                                            <X className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="text-center">
                                                        <ImageIcon className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                                                        <p className="text-[10px] font-medium text-slate-400">Preview</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Property Name</label>
                                        <Input
                                            type="text"
                                            className="h-14 rounded-xl border-slate-100 bg-slate-50/50 font-bold text-slate-900"
                                            value={propertyData.name}
                                            onChange={e => setPropertyData({ ...propertyData, name: e.target.value })}
                                            required
                                            placeholder="e.g. Victorian Villa in Lekki"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Location</label>
                                        <Input
                                            type="text"
                                            className="h-14 rounded-xl border-slate-100 bg-slate-50/50 font-bold text-slate-900"
                                            value={propertyData.location}
                                            onChange={e => setPropertyData({ ...propertyData, location: e.target.value })}
                                            required
                                            placeholder="e.g. Lagos, Nigeria"
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Valuation (USD)</label>
                                            <Input
                                                type="number"
                                                className="h-14 rounded-xl border-slate-100 bg-slate-50/50 font-bold text-slate-900"
                                                value={propertyData.valuation}
                                                onChange={e => setPropertyData({ ...propertyData, valuation: e.target.value })}
                                                required
                                                placeholder="1000000"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Target Raise (USD)</label>
                                            <Input
                                                type="number"
                                                className="h-14 rounded-xl border-slate-100 bg-slate-50/50 font-bold text-slate-900"
                                                value={propertyData.targetRaise}
                                                onChange={e => setPropertyData({ ...propertyData, targetRaise: e.target.value })}
                                                required
                                                placeholder="500000"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Category</label>
                                        <select
                                            className="w-full h-14 px-4 border border-slate-100 bg-slate-50/50 rounded-xl focus:ring-4 focus:ring-primary/5 focus:border-primary/20 outline-none transition-all font-bold text-slate-900"
                                            value={propertyData.category}
                                            onChange={e => setPropertyData({ ...propertyData, category: e.target.value })}
                                        >
                                            <option value="Residential">Residential</option>
                                            <option value="Commercial">Commercial</option>
                                            <option value="Shortlet">Shortlet</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="pt-6">
                                    <Button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full h-16 rounded-2xl font-bold uppercase tracking-widest text-xs shadow-xl shadow-primary/20"
                                    >
                                        {loading ? (
                                            <>
                                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                Minting & Creating...
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle2 className="h-4 w-4 mr-2" />
                                                Mint Property & Create Listing
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </motion.form>
                        ) : (
                            <motion.form
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                onSubmit={handleProposalSubmit}
                                className="space-y-8"
                            >
                                <div className="flex items-center gap-4 mb-8">
                                    <div className="h-14 w-14 rounded-2xl bg-secondary/10 flex items-center justify-center text-secondary">
                                        <Vote className="h-7 w-7" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-heading font-black text-slate-950 tracking-tight">New DAO Proposal</h2>
                                        <p className="text-slate-400 text-sm font-medium">Submit a governance proposal for community voting</p>
                                    </div>
                                </div>

                                {/* Proposal Inputs (Same as before) */}
                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Proposal Description / Question</label>
                                        <textarea
                                            className="w-full p-4 border border-slate-100 bg-slate-50/50 rounded-xl focus:ring-4 focus:ring-primary/5 focus:border-primary/20 outline-none transition-all h-32 font-medium text-slate-900 resize-none"
                                            value={proposalData.description}
                                            onChange={e => setProposalData({ ...proposalData, description: e.target.value })}
                                            required
                                            placeholder="What should the DAO vote on? e.g., Should we acquire property X in Abuja?"
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Permission Type</label>
                                            <select
                                                className="w-full h-14 px-4 border border-slate-100 bg-slate-50/50 rounded-xl focus:ring-4 focus:ring-primary/5 focus:border-primary/20 outline-none transition-all font-bold text-slate-900"
                                                value={proposalData.permissionType}
                                                onChange={e => setProposalData({ ...proposalData, permissionType: e.target.value })}
                                            >
                                                <option value="Global">Global (All Verified Users)</option>
                                                <option value="AnyInvestor">Any Investor (Must hold any token)</option>
                                                <option value="SpecificHolders">Specific Holders (Property specific)</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Duration (Seconds)</label>
                                            <Input
                                                type="number"
                                                className="h-14 rounded-xl border-slate-100 bg-slate-50/50 font-bold text-slate-900"
                                                value={proposalData.durationSeconds}
                                                onChange={e => setProposalData({ ...proposalData, durationSeconds: e.target.value })}
                                                required
                                            />
                                            <p className="text-[9px] font-medium text-slate-400 mt-1.5 px-1">Default: 1 week (604800 seconds)</p>
                                        </div>
                                    </div>

                                    {proposalData.permissionType === 'SpecificHolders' && (
                                        <div className="p-6 bg-amber-50 border border-amber-100 rounded-2xl">
                                            <div className="flex items-start gap-3 mb-4">
                                                <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                                                <div>
                                                    <h4 className="text-xs font-black uppercase tracking-widest text-amber-900 mb-1">Specific Holders Required</h4>
                                                    <p className="text-xs font-medium text-amber-700">Only holders of the specified property token can vote on this proposal.</p>
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Target Property Token ID</label>
                                                <Input
                                                    type="number"
                                                    className="h-14 rounded-xl border-amber-200 bg-white font-bold text-slate-900"
                                                    value={proposalData.targetTokenId}
                                                    onChange={e => setProposalData({ ...proposalData, targetTokenId: e.target.value })}
                                                    required
                                                    placeholder="e.g. 1"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="pt-6">
                                    <Button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full h-16 rounded-2xl font-bold uppercase tracking-widest text-xs shadow-xl shadow-primary/20"
                                    >
                                        {loading ? (
                                            <>
                                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                Submitting Proposal...
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle2 className="h-4 w-4 mr-2" />
                                                Submit DAO Proposal
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </motion.form>
                        )}
                    </Card>
                </div>
            </main>
        </div>
    );
}
