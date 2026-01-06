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
    FileText,
    ExternalLink
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { createWalletClient, custom, createPublicClient, http, parseUnits } from 'viem';
import { PropertiesRegistryABI } from '@/lib/abis/PropertiesRegistry';
import { MarketplaceABI } from '@/lib/abis/Marketplace';
import { RealEstateTokenABI } from '@/lib/abis/RealEstateToken';
import { DistributionABI } from '@/lib/abis/Distribution';
import { USDCABI } from '@/lib/abis/USDC';
import { MeluriDAOABI } from '@/lib/abis/MeluriDAO';

// Detailed Progress State
type ProgressStep = 'IDLE' | 'UPLOADING' | 'SWITCHING_NETWORK' | 'PREPARING_TX' | 'WAITING_SIGNATURE' | 'MINTING' | 'APPROVING' | 'LISTING' | 'SAVING' | 'SUCCESS';

export default function AdminView() {
    const { ready, authenticated, user, getAccessToken, login } = usePrivy();
    const { wallets } = useWallets();
    const [activeTab, setActiveTab] = useState<'property' | 'proposal' | 'dividends'>('property');
    const [progressStep, setProgressStep] = useState<ProgressStep>('IDLE');
    const [statusMessage, setStatusMessage] = useState('');
    const [successDetails, setSuccessDetails] = useState<{ txHash: string, tokenId: number } | null>(null);
    const [isAdmin, setIsAdmin] = useState(false);

    // File Upload State
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string>('');
    const [documentFile, setDocumentFile] = useState<File | null>(null);

    // Dividend State
    const [dividendData, setDividendData] = useState({ tokenId: '', amount: '' });

    // Proposal State
    const [proposalData, setProposalData] = useState({
        description: '',
        permissionType: 0,
        targetTokenId: '',
        durationSeconds: 86400 // 24 hours default
    });

    // Property Form State
    const [propertyData, setPropertyData] = useState({
        name: '',
        location: '',
        valuation: '',
        targetRaise: '',
        minInvestment: '100',
        category: 'Residential',
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

    const handleDocumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setDocumentFile(e.target.files[0]);
        }
    };

    const handlePropertySubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setProgressStep('UPLOADING');
        setStatusMessage('Uploading files to server...');
        setSuccessDetails(null);

        try {
            const token = await getAccessToken();
            const wallet = wallets[0];
            if (!wallet) throw new Error("Wallet not connected");

            let imageUrl = '';
            let documentUrl = '';

            // 1. Upload Image
            if (imageFile) {
                const formData = new FormData();
                formData.append('file', imageFile);
                const uploadRes = await fetch(`${API_URL}/upload`, { method: 'POST', body: formData });
                if (!uploadRes.ok) throw new Error("Image upload failed");
                const uploadData = await uploadRes.json();
                imageUrl = uploadData.url;
            }

            // 2. Upload Document
            if (documentFile) {
                const formData = new FormData();
                formData.append('file', documentFile);
                const uploadRes = await fetch(`${API_URL}/upload`, { method: 'POST', body: formData });
                if (!uploadRes.ok) throw new Error("Document upload failed");
                const uploadData = await uploadRes.json();
                documentUrl = uploadData.url; // In production, this should be IPFS hash
            } else {
                throw new Error("Legal Document is required");
            }

            // 3. Network Switch
            setStatusMessage('Please switch wallet network...');
            setProgressStep('SWITCHING_NETWORK');
            await wallet.switchChain(circleArcTestnet.id);

            // 4. Setup Clients
            const publicClient = createPublicClient({ chain: circleArcTestnet, transport: http() });
            const provider = await wallet.getEthereumProvider();
            const walletClient = createWalletClient({ account: wallet.address as `0x${string}`, chain: circleArcTestnet, transport: custom(provider) });

            const valuationWei = parseUnits(propertyData.valuation, 18);
            const targetRaiseWei = parseUnits(propertyData.targetRaise, 18);
            const totalTokens = valuationWei; // 1 Token = $1 Valuation base

            // 5. Mint Property
            setStatusMessage('Minting Property Token...');
            setProgressStep('PREPARING_TX');
            console.log("Minting property:", propertyData.name);

            const { request: mintRequest } = await publicClient.simulateContract({
                account: wallet.address as `0x${string}`,
                address: CONTRACT_ADDRESSES.PropertiesRegistry as `0x${string}`,
                abi: PropertiesRegistryABI,
                functionName: 'registerProperty',
                args: [
                    propertyData.name,
                    propertyData.location,
                    documentUrl,
                    valuationWei,
                    targetRaiseWei,
                    totalTokens,
                    0 // Category Enum (needs mapping, assuming Residential=0 for simplicity or update mapping)
                    // Note: Registry ABI assumes enum is passed as int or matched. 0=Residential, 1=Comm, 2=Shortlet
                ]
            });

            setProgressStep('WAITING_SIGNATURE');
            setStatusMessage('Sign "Mint" transaction in wallet...');
            const mintHash = await walletClient.writeContract(mintRequest);

            setProgressStep('MINTING');
            setStatusMessage('Minting on blockchain...');
            const receipt = await publicClient.waitForTransactionReceipt({ hash: mintHash });

            // Extract TokenId
            let tokenId = 0;
            const log = receipt.logs.find(l => l.address.toLowerCase() === CONTRACT_ADDRESSES.PropertiesRegistry.toLowerCase());
            if (log && log.topics[1]) {
                tokenId = parseInt(log.topics[1], 16);
            } else {
                throw new Error("Could not detect Token ID from events");
            }
            console.log("Token ID:", tokenId);

            // 6. Approve Marketplace
            setStatusMessage('Approving Marketplace...');
            setProgressStep('APPROVING');

            const isApproved = await publicClient.readContract({
                address: CONTRACT_ADDRESSES.RealEstateToken as `0x${string}`,
                abi: RealEstateTokenABI,
                functionName: 'isApprovedForAll',
                args: [wallet.address as `0x${string}`, CONTRACT_ADDRESSES.Marketplace as `0x${string}`]
            });

            if (!isApproved) {
                setStatusMessage('Please approve Marketplace to sell tokens...');
                const { request: approveRequest } = await publicClient.simulateContract({
                    account: wallet.address as `0x${string}`,
                    address: CONTRACT_ADDRESSES.RealEstateToken as `0x${string}`,
                    abi: RealEstateTokenABI,
                    functionName: 'setApprovalForAll',
                    args: [CONTRACT_ADDRESSES.Marketplace as `0x${string}`, true]
                });
                const approveHash = await walletClient.writeContract(approveRequest);
                await publicClient.waitForTransactionReceipt({ hash: approveHash });
            }

            // 7. Create Listing
            setStatusMessage('Creating Marketplace Listing...');
            setProgressStep('LISTING');

            const pricePerShare = parseUnits("1", 18); // $1 per share par value
            const minInvestmentWei = parseUnits(propertyData.minInvestment, 18);
            // Amount to list = Target Raise (since 1 token = $1 val, amount = target raise value)
            const amountToList = targetRaiseWei;

            const { request: listRequest } = await publicClient.simulateContract({
                account: wallet.address as `0x${string}`,
                address: CONTRACT_ADDRESSES.Marketplace as `0x${string}`,
                abi: MarketplaceABI,
                functionName: 'createListing',
                args: [BigInt(tokenId), amountToList, pricePerShare, minInvestmentWei]
            });

            const listHash = await walletClient.writeContract(listRequest);
            await publicClient.waitForTransactionReceipt({ hash: listHash });

            // 8. Save to DB
            setProgressStep('SAVING');
            setStatusMessage('Saving to Application Database...');

            const response = await fetch(`${API_URL}/properties`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({
                    name: propertyData.name,
                    description: `Property located at ${propertyData.location}`,
                    location: propertyData.location,
                    valuation: Number(propertyData.valuation),
                    targetRaise: Number(propertyData.targetRaise),
                    minInvestment: Number(propertyData.minInvestment),
                    images: imageUrl ? [imageUrl] : [],
                    documents: [documentUrl],
                    category: propertyData.category,
                    tokenId: tokenId,
                    contractAddress: CONTRACT_ADDRESSES.PropertiesRegistry,
                })
            });

            if (response.ok) {
                setSuccessDetails({ txHash: listHash, tokenId });
                setProgressStep('SUCCESS');
                setStatusMessage('Property Live on Marketplace!');

                setTimeout(() => {
                    setPropertyData({ name: '', location: '', valuation: '', targetRaise: '', minInvestment: '100', category: 'Residential' });
                    setImageFile(null); setImagePreview(''); setDocumentFile(null);
                    setProgressStep('IDLE'); setStatusMessage(''); setSuccessDetails(null);
                }, 10000);
            } else {
                const error = await response.json();
                throw new Error(`DB Error: ${error.message} (Blockchain success)`);
            }
        } catch (err: any) {
            console.error(err);
            alert(`❌ Failed: ${err.message || err}`);
            setProgressStep('IDLE');
        }
    };

    const handleProposalSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const wallet = wallets[0];
            if (!wallet) throw new Error("Wallet not connected");

            const publicClient = createPublicClient({ chain: circleArcTestnet, transport: http() });
            const provider = await wallet.getEthereumProvider();
            const walletClient = createWalletClient({ account: wallet.address as `0x${string}`, chain: circleArcTestnet, transport: custom(provider) });

            // 1. Create Proposal
            setProgressStep('MINTING'); // Reusing step for generic "Saving/Processing"
            setStatusMessage('Creating Governance Proposal...');

            const { request: proposalReq } = await publicClient.simulateContract({
                account: wallet.address as `0x${string}`,
                address: CONTRACT_ADDRESSES.MeluriDAO as `0x${string}`,
                abi: MeluriDAOABI,
                functionName: 'createProposal',
                args: [
                    proposalData.description,
                    proposalData.permissionType,
                    BigInt(proposalData.targetTokenId || 0),
                    BigInt(proposalData.durationSeconds)
                ],
            });

            const txHash = await walletClient.writeContract(proposalReq);
            await publicClient.waitForTransactionReceipt({ hash: txHash });

            setProgressStep('SUCCESS');
            setStatusMessage('Proposal Created Successfully!');
            setSuccessDetails({ txHash, tokenId: 0 }); // TokenID 0 as irrelevant for proposal

        } catch (err: any) {
            console.error(err);
            alert(`Failed: ${err.message}`);
            setProgressStep('IDLE');
        }
    };

    const handleDividendSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const wallet = wallets[0];
            if (!wallet) throw new Error("Wallet not connected");

            const publicClient = createPublicClient({ chain: circleArcTestnet, transport: http() });
            const provider = await wallet.getEthereumProvider();
            const walletClient = createWalletClient({ account: wallet.address as `0x${string}`, chain: circleArcTestnet, transport: custom(provider) });

            const amountWei = parseUnits(dividendData.amount, 6); // USDC is 6 decimals

            // 1. Approve USDC
            setProgressStep('APPROVING');
            setStatusMessage('Approving USDC for Distribution...');

            const allowance = await publicClient.readContract({
                address: CONTRACT_ADDRESSES.USDC as `0x${string}`,
                abi: USDCABI,
                functionName: 'allowance',
                args: [wallet.address as `0x${string}`, CONTRACT_ADDRESSES.Distribution as `0x${string}`]
            }) as bigint;

            if (allowance < amountWei) {
                const { request: approveReq } = await publicClient.simulateContract({
                    account: wallet.address as `0x${string}`,
                    address: CONTRACT_ADDRESSES.USDC as `0x${string}`,
                    abi: USDCABI,
                    functionName: 'approve',
                    args: [CONTRACT_ADDRESSES.Distribution as `0x${string}`, amountWei],
                });
                const hash = await walletClient.writeContract(approveReq);
                await publicClient.waitForTransactionReceipt({ hash });
            }

            // 2. Deposit Rent
            setProgressStep('MINTING'); // Reusing step for generic "Saving/Processing"
            setStatusMessage('Depositing Rent on-chain...');

            const { request: depositReq } = await publicClient.simulateContract({
                account: wallet.address as `0x${string}`,
                address: CONTRACT_ADDRESSES.Distribution as `0x${string}`,
                abi: DistributionABI,
                functionName: 'depositRent',
                args: [BigInt(dividendData.tokenId), amountWei],
            });

            const txHash = await walletClient.writeContract(depositReq);
            await publicClient.waitForTransactionReceipt({ hash: txHash });

            setProgressStep('SUCCESS');
            setStatusMessage('Rent Deposited Successfully!');
            setSuccessDetails({ txHash, tokenId: parseInt(dividendData.tokenId) });

        } catch (err: any) {
            console.error(err);
            alert(`Failed: ${err.message}`);
            setProgressStep('IDLE');
        }
    };

    // category mapping helper could be added here to robustly handle Enum conversion

    // ... (Login Check Logic)
    if (!ready) return <div className="min-h-screen bg-slate-50 flex items-center justify-center"><Loader2 className="h-12 w-12 text-primary animate-spin" /></div>;
    if (!authenticated) return <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-center"><ShieldCheck className="h-16 w-16 text-primary mb-6" /><h1 className="text-4xl text-white font-black mb-4">Admin Portal</h1><Button onClick={login} size="lg" className="bg-primary text-white">Connect Wallet</Button></div>;
    if (!isAdmin) return <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-center"><AlertTriangle className="h-16 w-16 text-red-500 mb-6" /><h1 className="text-3xl text-white font-black mb-4">Access Denied</h1><p className="text-white/50">{user?.wallet?.address}</p></div>;

    return (
        <div className="min-h-screen bg-slate-50 font-sans">
            <main className="container mx-auto px-6 py-16">
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
                        <button onClick={() => setActiveTab('dividends')} className={cn("flex-1 lg:flex-none px-8 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all gap-2 flex items-center", activeTab === 'dividends' ? "bg-primary text-white" : "text-slate-400")}>
                            <ShieldCheck className="h-4 w-4" /> Dividends
                        </button>
                    </div>
                </div>

                <div className="max-w-4xl mx-auto">
                    <Card className="rounded-[3rem] border-slate-100 shadow-soft overflow-hidden bg-white p-10 lg:p-14 relative">
                        {progressStep !== 'IDLE' && progressStep !== 'SUCCESS' && (
                            <div className="absolute inset-0 bg-white/90 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-8 text-center">
                                <Loader2 className="h-16 w-16 text-primary animate-spin mb-6" />
                                <h3 className="text-2xl font-black text-slate-800 mb-2">{statusMessage}</h3>
                                <p className="text-slate-500 font-medium text-sm">Please follow wallet instructions.</p>
                            </div>
                        )}

                        {progressStep === 'SUCCESS' && (
                            <div className="absolute inset-0 bg-green-50/95 backdrop-blur-md z-50 flex flex-col items-center justify-center p-8 text-center">
                                <div className="h-20 w-20 bg-green-500 rounded-full flex items-center justify-center mb-6 shadow-xl shadow-green-500/30">
                                    <CheckCircle2 className="h-10 w-10 text-white" />
                                </div>
                                <h3 className="text-3xl font-black text-green-800 mb-2">Listing Live!</h3>
                                <p className="text-green-700 font-medium mb-8">Property is now tradeable on the Marketplace.</p>
                                <Button onClick={() => setProgressStep('IDLE')} className="bg-green-600 hover:bg-green-700 text-white rounded-full">Create Another</Button>
                            </div>
                        )}

                        {activeTab === 'property' ? (
                            <motion.form initial={{ opacity: 0 }} animate={{ opacity: 1 }} onSubmit={handlePropertySubmit} className="space-y-8">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary"><Building2 className="h-7 w-7" /></div>
                                    <h2 className="text-2xl font-heading font-black text-slate-950">New Property Listing</h2>
                                </div>

                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* Image Upload */}
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">Property Image</label>
                                            <div className="relative h-32 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 overflow-hidden flex items-center justify-center group">
                                                <Input type="file" accept="image/*" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                                                {imagePreview ? <img src={imagePreview} className="w-full h-full object-cover" /> : <div className="text-center text-slate-400"><ImageIcon className="h-8 w-8 mx-auto mb-2" /><span className="text-xs font-bold">Upload Image</span></div>}
                                            </div>
                                        </div>
                                        {/* Document Upload */}
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">Legal Document (PDF)</label>
                                            <div className="relative h-32 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 overflow-hidden flex items-center justify-center group">
                                                <Input type="file" accept=".pdf" onChange={handleDocumentChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                                                {documentFile ? <div className="text-center text-primary"><FileText className="h-8 w-8 mx-auto mb-2" /><span className="text-xs font-bold">{documentFile.name}</span></div> : <div className="text-center text-slate-400"><FileText className="h-8 w-8 mx-auto mb-2" /><span className="text-xs font-bold">Upload Deed/SPV</span></div>}
                                            </div>
                                        </div>
                                    </div>

                                    <div><label className="block text-[10px] font-black text-slate-400 uppercase">Property Name</label><Input className="h-14 rounded-xl bg-slate-50 font-bold" value={propertyData.name} onChange={e => setPropertyData({ ...propertyData, name: e.target.value })} required /></div>
                                    <div><label className="block text-[10px] font-black text-slate-400 uppercase">Location</label><Input className="h-14 rounded-xl bg-slate-50 font-bold" value={propertyData.location} onChange={e => setPropertyData({ ...propertyData, location: e.target.value })} required /></div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div><label className="block text-[10px] font-black text-slate-400 uppercase">Valuation (USD)</label><Input type="number" className="h-14 rounded-xl bg-slate-50 font-bold" value={propertyData.valuation} onChange={e => setPropertyData({ ...propertyData, valuation: e.target.value })} required /></div>
                                        <div><label className="block text-[10px] font-black text-slate-400 uppercase">Target Raise (USD)</label><Input type="number" className="h-14 rounded-xl bg-slate-50 font-bold" value={propertyData.targetRaise} onChange={e => setPropertyData({ ...propertyData, targetRaise: e.target.value })} required /></div>
                                    </div>
                                    <div><label className="block text-[10px] font-black text-slate-400 uppercase">Minimum Investment (USD)</label><Input type="number" className="h-14 rounded-xl bg-slate-50 font-bold" value={propertyData.minInvestment} onChange={e => setPropertyData({ ...propertyData, minInvestment: e.target.value })} required /></div>
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase">Category</label>
                                        <select className="w-full h-14 px-4 bg-slate-50 rounded-xl border border-slate-200 font-bold" value={propertyData.category} onChange={e => setPropertyData({ ...propertyData, category: e.target.value })}>
                                            <option value="Residential">Residential</option>
                                            <option value="Commercial">Commercial</option>
                                            <option value="Shortlet">Shortlet</option>
                                        </select>
                                    </div>
                                </div>

                                <Button type="submit" disabled={progressStep !== 'IDLE'} className="w-full h-16 rounded-2xl font-bold uppercase tracking-widest text-xs shadow-xl shadow-primary/20">
                                    <CheckCircle2 className="h-4 w-4 mr-2" />
                                    Mint & List Property
                                </Button>
                            </motion.form>
                        ) : activeTab === 'proposal' ? (
                            <motion.form initial={{ opacity: 0 }} animate={{ opacity: 1 }} onSubmit={handleProposalSubmit} className="space-y-8">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="h-14 w-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-600"><Vote className="h-7 w-7" /></div>
                                    <h2 className="text-2xl font-heading font-black text-slate-950">New Governance Proposal</h2>
                                </div>

                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase">Proposal Description</label>
                                        <Input className="h-14 rounded-xl bg-slate-50 font-bold" placeholder="e.g. Upgrade Marketplace Contract" value={proposalData.description} onChange={e => setProposalData({ ...proposalData, description: e.target.value })} required />
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase">Permission Type</label>
                                        <select className="w-full h-14 px-4 bg-slate-50 rounded-xl border border-slate-200 font-bold" value={proposalData.permissionType} onChange={e => setProposalData({ ...proposalData, permissionType: Number(e.target.value) })}>
                                            <option value={0}>General</option>
                                            <option value={1}>Pause Contract</option>
                                            <option value={2}>Upgrade Contract</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase">Target Token ID (Optional)</label>
                                        <Input type="number" className="h-14 rounded-xl bg-slate-50 font-bold" placeholder="e.g. 1" value={proposalData.targetTokenId} onChange={e => setProposalData({ ...proposalData, targetTokenId: e.target.value })} />
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase">Duration (Seconds)</label>
                                        <Input type="number" className="h-14 rounded-xl bg-slate-50 font-bold" value={proposalData.durationSeconds} onChange={e => setProposalData({ ...proposalData, durationSeconds: Number(e.target.value) })} required />
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2">{Math.floor(proposalData.durationSeconds / 3600)} Hours</p>
                                    </div>
                                </div>

                                <Button type="submit" disabled={progressStep !== 'IDLE'} className="w-full h-16 rounded-2xl font-bold uppercase tracking-widest text-xs shadow-xl shadow-indigo-500/20 bg-indigo-600 hover:bg-indigo-700 text-white">
                                    <Vote className="h-4 w-4 mr-2" />
                                    Create Proposal
                                </Button>
                            </motion.form>
                        ) : activeTab === 'dividends' ? (
                            <motion.form initial={{ opacity: 0 }} animate={{ opacity: 1 }} onSubmit={handleDividendSubmit} className="space-y-8">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="h-14 w-14 rounded-2xl bg-green-500/10 flex items-center justify-center text-green-600"><ShieldCheck className="h-7 w-7" /></div>
                                    <h2 className="text-2xl font-heading font-black text-slate-950">Distribute Dividends</h2>
                                </div>

                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase">Property Token ID</label>
                                        <Input type="number" className="h-14 rounded-xl bg-slate-50 font-bold" placeholder="e.g. 1" value={dividendData.tokenId} onChange={e => setDividendData({ ...dividendData, tokenId: e.target.value })} required />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase">Amount to Distribute (USDC)</label>
                                        <Input type="number" className="h-14 rounded-xl bg-slate-50 font-bold" placeholder="e.g. 5000" value={dividendData.amount} onChange={e => setDividendData({ ...dividendData, amount: e.target.value })} required />
                                    </div>
                                </div>

                                <Button type="submit" disabled={progressStep !== 'IDLE'} className="w-full h-16 rounded-2xl font-bold uppercase tracking-widest text-xs shadow-xl shadow-green-500/20 bg-green-600 hover:bg-green-700 text-white">
                                    <Vote className="h-4 w-4 mr-2" />
                                    Deposit Dividends
                                </Button>
                            </motion.form>
                        ) : (
                            <div className="text-center py-20 text-slate-400">Proposal Tab Placeholder</div>
                        )}
                    </Card>
                </div>
            </main>
        </div>
    );
}
