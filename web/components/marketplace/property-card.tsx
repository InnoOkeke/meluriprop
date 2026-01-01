import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { ArrowUpRight, Building2, TrendingUp, Users } from "lucide-react"
import Image from "next/image"

interface PropertyCardProps {
    id: number
    name: string
    location: string
    price: number
    roi: string
    investors: number
    status: "active" | "funded" | "coming-soon"
    imageUrl: string
    onBuyClick: () => void
}

export function PropertyCard({
    id,
    name,
    location,
    price,
    roi,
    investors,
    status,
    imageUrl,
    onBuyClick
}: PropertyCardProps) {
    return (
        <Card className="group overflow-hidden rounded-[2rem] border-border bg-card shadow-soft hover:shadow-2xl hover:border-primary/20 transition-all duration-500 flex flex-col h-full">
            <div className="relative h-64 overflow-hidden">
                <div className="absolute inset-0 bg-muted animate-pulse" />
                <Image
                    src={imageUrl}
                    alt={name}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent opacity-60" />

                <div className="absolute top-4 left-4">
                    <Badge variant={status === "active" ? "default" : "secondary"} className={cn(
                        "uppercase tracking-widest text-[10px] font-black px-3 py-1",
                        status === "active" ? "bg-green-500 hover:bg-green-600 border-transparent text-white" : "bg-muted hover:bg-muted/80 text-muted-foreground border-transparent"
                    )}>
                        {status === "active" ? "Live Deal" : "Coming Soon"}
                    </Badge>
                </div>
            </div>

            <CardHeader className="p-6 pb-2">
                <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2 text-primary text-xs font-black uppercase tracking-widest">
                        <Building2 className="h-3 w-3" />
                        <span>Real Estate</span>
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground text-xs font-bold">
                        <Users className="h-3 w-3" />
                        <span>{investors}</span>
                    </div>
                </div>
                <h3 className="text-xl font-heading font-black text-foreground leading-tight line-clamp-2 min-h-[3rem]">
                    {name}
                </h3>
                <p className="text-muted-foreground text-xs font-bold uppercase tracking-wide">
                    {location}
                </p>
            </CardHeader>

            <CardContent className="p-6 pt-4 flex-grow">
                <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-muted/30 border border-border">
                    <div>
                        <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold mb-1">Target ROI</div>
                        <div className="text-lg font-black text-secondary flex items-center gap-1">
                            {roi} <TrendingUp className="h-3 w-3" />
                        </div>
                    </div>
                    <div>
                        <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold mb-1">Min Entry</div>
                        <div className="text-lg font-black text-foreground">
                            ${price.toLocaleString()}
                        </div>
                    </div>
                </div>
            </CardContent>

            <CardFooter className="p-6 pt-0">
                <Button
                    className="w-full h-12 rounded-xl font-bold uppercase tracking-widest text-xs transform group-hover:translate-y-0 transition-all bg-primary text-primary-foreground hover:bg-primary/90"
                    onClick={onBuyClick}
                >
                    View Opportunity <ArrowUpRight className="ml-2 h-4 w-4" />
                </Button>
            </CardFooter>
        </Card>
    )
}
