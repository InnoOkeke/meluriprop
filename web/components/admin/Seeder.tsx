import { useState } from 'react';
import { useAdmin } from '@/hooks/useAdmin';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, CheckCircle2, XCircle, Database } from 'lucide-react';

const DEMO_PROPERTIES = [
    {
        name: "Ikoyi Luxury Apartment",
        location: "Ikoyi, Lagos",
        documentIPFS: "QmX7yP8j5e6k3o9q4t2u1v0w5x8y7z",
        valuation: "150000",
        targetRaise: "150000",
        totalTokens: "3000" // $50/token
    },
    {
        name: "Victoria Island Commercial Hub",
        location: "Victoria Island, Lagos",
        documentIPFS: "QmA1b2c3d4e5f6g7h8i9j0k1l2m3n",
        valuation: "450000",
        targetRaise: "450000",
        totalTokens: "4500" // $100/token
    },
    {
        name: "Lekki Shortlet Haven",
        location: "Lekki Phase 1, Lagos",
        documentIPFS: "QmO9p8q7r6s5t4u3v2w1x0y9z8a7b",
        valuation: "850000",
        targetRaise: "850000",
        totalTokens: "17000" // $50/token (Corrected Math: 850,000 / 50 = 17,000)
    },
    {
        name: "Ikeja Retail Plaza",
        location: "Ikeja, Lagos",
        documentIPFS: "QmZ1y2x3w4v5u6t7s8r9q0p1o2n3m",
        valuation: "200000",
        targetRaise: "200000",
        totalTokens: "4000" // $50/token
    },
    {
        name: "Waterfront Condo VI",
        location: "Victoria Island, Lagos",
        documentIPFS: "QmK1l2m3n4o5p6q7r8s9t0u1v2w",
        valuation: "320000",
        targetRaise: "320000",
        totalTokens: "3200" // $100/token
    },
    {
        name: "Lekki Commercial Complex",
        location: "Lekki, Lagos",
        documentIPFS: "QmV3w4x5y6z7a8b9c0d1e2f3g4h",
        valuation: "600000",
        targetRaise: "600000",
        totalTokens: "6000" // $100/token
    },
    {
        name: "Ikoyi Residential Estate",
        location: "Ikoyi, Lagos",
        documentIPFS: "QmJ5k6l7m8n9o0p1q2r3s4t5u6v",
        valuation: "950000",
        targetRaise: "950000",
        totalTokens: "9500" // $100/token
    }
];

export function Seeder() {
    const { registerProperty, isAdmin } = useAdmin();
    const [seeding, setSeeding] = useState(false);
    const [logs, setLogs] = useState<{ msg: string, type: 'info' | 'success' | 'error' }[]>([]);
    const [progress, setProgress] = useState(0);

    const log = (msg: string, type: 'info' | 'success' | 'error' = 'info') => {
        setLogs(prev => [...prev, { msg, type }]);
    };

    const handleSeed = async () => {
        if (!isAdmin) {
            log("You must be an admin to seed properties.", "error");
            return;
        }

        if (!confirm("This will trigger server-side seeding of 7 properties. Continue?")) return;

        setSeeding(true);
        setLogs([]);
        setProgress(10);
        log("Initiating server-side seeding...", "info");

        try {
            const response = await fetch('/api/admin/seed', { method: 'POST' });
            const data = await response.json();

            if (!response.ok) throw new Error(data.error || "Seeding failed");

            data.results.forEach((res: any) => {
                if (res.status === 'success') {
                    log(`✓ ${res.name} created. Hash: ${res.hash.slice(0, 10)}...`, 'success');
                } else {
                    log(`✗ Failed ${res.name}: ${res.error}`, 'error');
                }
            });

            log(`Seeding complete. ${data.seeded} properties created.`, 'info');
            setProgress(100);

        } catch (err: any) {
            console.error(err);
            log(`Seeding failed: ${err.message}`, 'error');
        } finally {
            setSeeding(false);
        }
    };

    if (!isAdmin) return null;

    return (
        <Card className="max-w-xl">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    Demo Data Seeder
                </CardTitle>
                <CardDescription>
                    Create {DEMO_PROPERTIES.length} demo real estate properties on the blockchain.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <Button
                    onClick={handleSeed}
                    disabled={seeding}
                    className="w-full bg-indigo-600 hover:bg-indigo-700"
                >
                    {seeding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    {seeding ? `Seeding... ${Math.round(progress)}%` : "Seed Properties on Chain"}
                </Button>

                <ScrollArea className="h-[200px] w-full rounded-md border p-4 bg-muted/50">
                    <div className="space-y-2 font-mono text-xs">
                        {logs.length === 0 && <span className="text-muted-foreground">Ready to seed...</span>}
                        {logs.map((log, i) => (
                            <div key={i} className={`flex items-start gap-2 ${log.type === 'error' ? 'text-red-500' :
                                log.type === 'success' ? 'text-green-600' : 'text-foreground'
                                }`}>
                                {log.type === 'success' ? <CheckCircle2 className="h-3 w-3 mt-0.5" /> :
                                    log.type === 'error' ? <XCircle className="h-3 w-3 mt-0.5" /> :
                                        <div className="w-3 h-3" />}
                                <span>{log.msg}</span>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    );
}
