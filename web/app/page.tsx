"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowRight, BarChart3, ShieldCheck, Globe, TrendingUp, Building2, Sparkles, Zap, Lock, Award, ChevronRight, Users, DollarSign, Calendar, Star, Mail, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { motion, useAnimation } from "framer-motion"
import { Navbar } from "@/components/layout/navbar"
import { Footer } from "@/components/layout/footer"

export default function LandingPage() {
  const [email, setEmail] = useState("")
  const [newsletterSubmitted, setNewsletterSubmitted] = useState(false)
  const [currentPropertyIndex, setCurrentPropertyIndex] = useState(0)

  const featuredProperties = [
    {
      name: "Ikoyi Premium Towers",
      location: "Ikoyi, Lagos",
      image: "/images/property_ikoyi_luxury.png",
      apy: "15.2%",
      price: "$250",
      totalValue: "$2.4M",
    },
    {
      name: "Victoria Island Waterfront",
      location: "Victoria Island, Lagos",
      image: "/images/property_vi_waterfront.png",
      apy: "14.8%",
      price: "$150",
      totalValue: "$1.8M",
    },
    {
      name: "Lekki Commercial Hub",
      location: "Lekki Phase 1, Lagos",
      image: "/images/property_lekki_commercial.png",
      apy: "16.5%",
      price: "$200",
      totalValue: "$3.2M",
    },
  ]

  const platformFeatures = [
    {
      icon: Lock,
      title: "Blockchain Security",
      description: "Smart contracts ensure transparent, tamper-proof ownership records on Circle Arc.",
      color: "from-blue-500 to-cyan-500"
    },
    {
      icon: Building2,
      title: "Fractional Ownership",
      description: "Own premium real estate starting from just $100. No large capital required.",
      color: "from-purple-500 to-pink-500"
    },
    {
      icon: DollarSign,
      title: "Monthly Returns",
      description: "Receive rental income directly to your wallet every month in USDC.",
      color: "from-green-500 to-emerald-500"
    },
    {
      icon: TrendingUp,
      title: "Instant Liquidity",
      description: "Trade your tokens anytime on our marketplace. No lock-in periods.",
      color: "from-orange-500 to-amber-500"
    },
  ]

  const testimonials = [
    {
      name: "Chinedu Okafor",
      role: "Software Engineer",
      avatar: "CO",
      investment: "$5,000 invested",
      return: "14.2% APY",
      comment: "Finally, a way to invest in Lagos real estate without buying an entire property. The monthly USDC payments are seamless."
    },
    {
      name: "Amara Williams",
      role: "Business Owner",
      avatar: "AW",
      investment: "$12,000 invested",
      return: "15.8% APY",
      comment: "Transparent, secure, and incredibly easy to use. I've diversified across 3 properties in just a few clicks."
    },
    {
      name: "David Adeyemi",
      role: "Financial Analyst",
      avatar: "DA",
      investment: "$8,500 invested",
      return: "13.9% APY",
      comment: "The blockchain verification gives me peace of mind. This is the future of real estate investment in Africa."
    },
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPropertyIndex((prev) => (prev + 1) % featuredProperties.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setNewsletterSubmitted(true)
    setTimeout(() => {
      setEmail("")
      setNewsletterSubmitted(false)
    }, 3000)
  }

  return (
    <main className="min-h-screen bg-background overflow-hidden">
      <Navbar />

      {/* Hero Section - Enhanced */}
      <section className="relative min-h-screen flex items-center px-6 pt-24 overflow-hidden bg-gradient-to-br from-primary/5 via-background to-accent/5 dark:from-card dark:via-background dark:to-primary/5">
        {/* Large Background Image with Overlay */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/95 to-transparent dark:from-background dark:via-background/90 dark:to-transparent z-10" />
          <img
            src="/images/hero_lagos_skyline_1767224707153.png"
            alt="Lagos Skyline"
            className="w-full h-full object-cover opacity-30 dark:opacity-20"
          />
        </div>

        {/* Enhanced Animated Floating Shapes */}
        <div className="absolute inset-0 -z-5 overflow-hidden">
          <motion.div
            animate={{
              y: [0, -30, 0],
              x: [0, 20, 0],
              rotate: [0, 10, 0],
              scale: [1, 1.1, 1],
            }}
            transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-20 right-20 w-96 h-96 bg-accent/20 dark:bg-accent/10 rounded-full blur-3xl"
          />
          <motion.div
            animate={{
              y: [0, 40, 0],
              x: [0, -30, 0],
              scale: [1, 1.15, 1],
            }}
            transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
            className="absolute bottom-20 left-20 w-80 h-80 bg-primary/20 dark:bg-primary/10 rounded-full blur-3xl"
          />
          <motion.div
            animate={{
              y: [0, -20, 0],
              x: [0, 15, 0],
              rotate: [0, -5, 0],
            }}
            transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-1/2 left-1/3 w-64 h-64 bg-secondary/15 dark:bg-secondary/10 rounded-full blur-3xl"
          />
        </div>

        {/* Enhanced Dot Pattern Overlay */}
        <div className="absolute inset-0 -z-5" style={{
          backgroundImage: `radial-gradient(circle, rgba(200, 155, 60, 0.1) 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }} />

        <div className="container mx-auto max-w-7xl relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left Content */}
            <div className="space-y-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full glass border border-accent/30"
              >
                <Sparkles className="h-4 w-4 text-accent" />
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-foreground">
                  Built on Circle Arc
                </span>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="space-y-6"
              >
                <h1 className="text-6xl lg:text-8xl font-heading font-black text-foreground leading-[0.95] tracking-tighter">
                  Own Premium
                  <br />
                  <span className="bg-gradient-to-r from-accent via-primary to-secondary bg-clip-text text-transparent animate-gradient">
                    Lagos Real Estate
                  </span>
                </h1>

                <p className="text-xl lg:text-2xl text-muted-foreground max-w-lg leading-relaxed">
                  Start investing from just{' '}
                  <span className="font-bold text-accent">$100</span>.
                  Earn{' '}
                  <span className="font-bold text-primary">12-18% annual returns</span>{' '}
                  through blockchain-powered fractional ownership.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="flex flex-col sm:flex-row gap-4"
              >
                <Link href="/marketplace">
                  <Button size="lg" className="h-14 px-8 rounded-2xl font-bold text-sm uppercase tracking-wide shadow-premium hover:shadow-glow-primary transition-all-slow hover:scale-105 group bg-accent text-accent-foreground dark:bg-primary dark:text-primary-foreground">
                    Start Investing
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Link href="#how-it-works">
                  <Button variant="outline" size="lg" className="h-14 px-8 rounded-2xl font-bold text-sm uppercase tracking-wide border-2 border-primary-foreground/20 dark:border-border bg-primary-foreground/5 dark:bg-card/50 backdrop-blur-lg text-primary-foreground dark:text-foreground hover:bg-primary-foreground/10 dark:hover:bg-card transition-all-slow">
                    How It Works
                  </Button>
                </Link>
              </motion.div>

              {/* Trust Indicators */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.5 }}
                className="flex items-center gap-8 pt-4"
              >
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-green-400" />
                  <span className="text-sm text-primary-foreground/70 dark:text-muted-foreground">SEC Compliant</span>
                </div>
                <div className="flex items-center gap-2">
                  <Lock className="h-5 w-5 text-blue-400 dark:text-accent" />
                  <span className="text-sm text-primary-foreground/70 dark:text-muted-foreground">Blockchain Secured</span>
                </div>
              </motion.div>
            </div>

            {/* Right Content - Stats Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="relative"
            >
              <div className="glass-strong rounded-3xl p-8 lg:p-10 shadow-premium border border-primary-foreground/10 dark:border-accent/10">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-primary-foreground dark:text-foreground uppercase tracking-widest">Platform Stats</h3>
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/20 border border-green-500/30">
                      <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
                      <span className="text-xs font-bold text-green-300 dark:text-green-400">Live</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    {[
                      { label: "Total Value", value: "$12.5M", icon: BarChart3, color: "text-blue-400" },
                      { label: "Active Investors", value: "2,418", icon: Globe, color: "text-purple-400 dark:text-purple-300" },
                      { label: "Properties", value: "24", icon: Building2, color: "text-green-400" },
                      { label: "Avg Yield", value: "14.2%", icon: TrendingUp, color: "text-orange-400 dark:text-accent" },
                    ].map((stat, i) => (
                      <div key={i} className="space-y-2">
                        <stat.icon className={`h-8 w-8 ${stat.color}`} />
                        <div className="text-3xl font-black text-primary-foreground dark:text-foreground tracking-tight">{stat.value}</div>
                        <div className="text-xs text-primary-foreground/60 dark:text-muted-foreground uppercase tracking-wider font-bold">{stat.label}</div>
                      </div>
                    ))}
                  </div>

                  <div className="pt-4 border-t border-primary-foreground/10 dark:border-border">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-primary-foreground/60 dark:text-muted-foreground">Last 30 days volume</span>
                      <span className="text-primary-foreground dark:text-foreground font-bold">$420,000</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating Element */}
              <div className="absolute -top-6 -right-6 w-32 h-32 bg-accent/20 dark:bg-accent/10 rounded-full blur-3xl animate-pulse-slow" />
            </motion.div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 1 }}
          className="absolute bottom-12 left-1/2 -translate-x-1/2"
        >
          <div className="flex flex-col items-center gap-2 text-primary-foreground/60 dark:text-muted-foreground">
            <span className="text-xs uppercase tracking-widest">Scroll to explore</span>
            <ChevronRight className="h-5 w-5 rotate-90 animate-bounce" />
          </div>
        </motion.div>
      </section>

      {/* Featured Properties Carousel */}
      <section className="py-32 px-6 bg-gradient-to-b from-background to-muted/20 dark:from-background dark:to-card/20 relative overflow-hidden">
        <div className="container mx-auto max-w-7xl relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20 mb-6">
              <Building2 className="h-4 w-4 text-accent" />
              <span className="text-xs font-bold uppercase tracking-widest text-accent">Featured Properties</span>
            </div>
            <h2 className="text-5xl lg:text-6xl font-heading font-black text-foreground tracking-tighter mb-6">
              Premium Investment Opportunities
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Handpicked properties with verified returns and institutional-grade management
            </p>
          </motion.div>

          {/* Properties Grid */}
          <div className="grid md:grid-cols-3 gap-8">
            {featuredProperties.map((property, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                className="group relative"
              >
                <div className="relative h-full rounded-3xl overflow-hidden bg-card border border-border hover:border-accent/50 transition-all-slow hover-lift">
                  {/* Property Image */}
                  <div className="relative h-64 overflow-hidden">
                    <img
                      src={property.image}
                      alt={property.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform-slow"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute top-4 right-4 px-3 py-1.5 rounded-full glass-strong border border-white/20">
                      <span className="text-xs font-bold text-white">{property.apy} APY</span>
                    </div>
                  </div>

                  {/* Property Details */}
                  <div className="p-6 space-y-4">
                    <div>
                      <h3 className="text-2xl font-bold text-foreground mb-2">{property.name}</h3>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Globe className="h-4 w-4" />
                        {property.location}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-border">
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">Min. Investment</div>
                        <div className="text-xl font-bold text-foreground">{property.price}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-muted-foreground mb-1">Total Value</div>
                        <div className="text-xl font-bold text-foreground">{property.totalValue}</div>
                      </div>
                    </div>

                    <Link href="/marketplace">
                      <Button className="w-full rounded-xl group/btn bg-accent hover:bg-accent/90 text-accent-foreground">
                        View Details
                        <ArrowRight className="ml-2 h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-center mt-12"
          >
            <Link href="/marketplace">
              <Button size="lg" variant="outline" className="h-14 px-8 rounded-2xl font-bold text-sm uppercase tracking-wide border-2">
                View All Properties
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Platform Features Section */}
      <section className="py-32 px-6 bg-background relative overflow-hidden">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute inset-0 gradient-mesh" />
        </div>

        <div className="container mx-auto max-w-7xl relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-20"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
              <Award className="h-4 w-4 text-primary" />
              <span className="text-xs font-bold uppercase tracking-widest text-primary">Why Choose Meluri</span>
            </div>
            <h2 className="text-5xl lg:text-6xl font-heading font-black text-foreground tracking-tighter mb-6">
              Built for Modern Investors
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Combining traditional real estate returns with cutting-edge blockchain technology
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {platformFeatures.map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                className="group relative"
              >
                <div className="relative h-full p-8 rounded-3xl glass border border-border hover:border-transparent hover:shadow-premium transition-all-slow">
                  {/* Gradient Border on Hover */}
                  <div className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-100 transition-opacity -z-10 blur-sm`} />

                  <div className="space-y-4">
                    <div className={`inline-flex p-4 rounded-2xl bg-gradient-to-br ${feature.color}`}>
                      <feature.icon className="h-8 w-8 text-white" />
                    </div>

                    <h3 className="text-2xl font-bold text-foreground tracking-tight">
                      {feature.title}
                    </h3>

                    <p className="text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-32 px-6 bg-muted/20 dark:bg-card/20 relative overflow-hidden">
        <div className="container mx-auto max-w-7xl relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-20"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
              <Zap className="h-4 w-4 text-primary" />
              <span className="text-xs font-bold uppercase tracking-widest text-primary">Simple Process</span>
            </div>
            <h2 className="text-5xl lg:text-6xl font-heading font-black text-foreground tracking-tighter mb-6">
              Invest in 3 Simple Steps
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              From wallet to earning rental income in minutes
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-3 gap-8 relative">
            {/* Connecting Lines */}
            <div className="hidden lg:block absolute top-1/4 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-border to-transparent -z-10" />

            {[
              {
                step: "01",
                title: "Connect Wallet",
                description: "Link your crypto wallet securely. No minimum balance required to start exploring properties.",
                icon: Sparkles,
                color: "from-blue-500 to-purple-500"
              },
              {
                step: "02",
                title: "Buy Property Tokens",
                description: "Choose from verified Lagos properties. Start with as little as $100 and own a fraction of premium real estate.",
                icon: Building2,
                color: "from-purple-500 to-pink-500"
              },
              {
                step: "03",
                title: "Earn Monthly Income",
                description: "Receive rental payments in USDC every month. Sell your tokens anytime on our marketplace.",
                icon: TrendingUp,
                color: "from-pink-500 to-orange-500"
              }
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.2 }}
                className="group relative"
              >
                <div className="relative h-full p-8 rounded-3xl bg-card border-2 border-border hover:border-transparent hover:shadow-premium transition-all-slow">
                  {/* Gradient Border on Hover */}
                  <div className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${item.color} opacity-0 group-hover:opacity-100 transition-opacity -z-10 blur-sm`} />

                  {/* Step Number */}
                  <div className="text-8xl font-black text-muted/30 group-hover:text-muted/40 transition-colors absolute top-4 right-6 leading-none">
                    {item.step}
                  </div>

                  <div className="relative space-y-4">
                    <div className={`inline-flex p-4 rounded-2xl bg-gradient-to-br ${item.color}`}>
                      <item.icon className="h-8 w-8 text-white" />
                    </div>

                    <h3 className="text-2xl font-bold text-foreground tracking-tight">
                      {item.title}
                    </h3>

                    <p className="text-muted-foreground leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-32 px-6 bg-background relative overflow-hidden">
        <div className="container mx-auto max-w-7xl relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-20"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20 mb-6">
              <Users className="h-4 w-4 text-accent" />
              <span className="text-xs font-bold uppercase tracking-widest text-accent">Investor Stories</span>
            </div>
            <h2 className="text-5xl lg:text-6xl font-heading font-black text-foreground tracking-tighter mb-6">
              Trusted by Thousands
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              See what our investors are saying about their experience
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                className="group"
              >
                <div className="h-full p-8 rounded-3xl glass-strong border border-border hover:border-accent/50 hover:shadow-premium transition-all-slow">
                  <div className="space-y-6">
                    {/* Stars */}
                    <div className="flex gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-5 w-5 fill-accent text-accent" />
                      ))}
                    </div>

                    {/* Comment */}
                    <p className="text-foreground leading-relaxed italic">
                      "{testimonial.comment}"
                    </p>

                    {/* User Info */}
                    <div className="flex items-center gap-4 pt-4 border-t border-border">
                      <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-accent to-primary flex items-center justify-center">
                        <span className="text-white font-bold">{testimonial.avatar}</span>
                      </div>
                      <div className="flex-1">
                        <div className="font-bold text-foreground">{testimonial.name}</div>
                        <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center justify-between pt-4 border-t border-border">
                      <div className="text-sm">
                        <div className="text-muted-foreground">Invested</div>
                        <div className="font-bold text-foreground">{testimonial.investment}</div>
                      </div>
                      <div className="text-sm text-right">
                        <div className="text-muted-foreground">Returns</div>
                        <div className="font-bold text-green-400">{testimonial.return}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-32 px-6 bg-gradient-to-br from-primary/10 via-background to-accent/10 dark:from-card/50 dark:via-background dark:to-primary/10 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle, rgba(200, 155, 60, 0.15) 1px, transparent 1px)`,
            backgroundSize: '40px 40px'
          }} />
        </div>

        <div className="container mx-auto max-w-3xl relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20 mb-6">
              <Mail className="h-4 w-4 text-accent" />
              <span className="text-xs font-bold uppercase tracking-widest text-accent">Stay Updated</span>
            </div>
            <h2 className="text-4xl lg:text-5xl font-heading font-black text-foreground tracking-tighter mb-6">
              Get Early Access to New Properties
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Join our newsletter and be the first to know about new premium listings and exclusive investment opportunities.
            </p>

            {!newsletterSubmitted ? (
              <form onSubmit={handleNewsletterSubmit} className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-14 px-6 rounded-2xl border-2 border-border focus:border-accent text-base"
                />
                <Button type="submit" size="lg" className="h-14 px-8 rounded-2xl font-bold uppercase tracking-wide bg-accent hover:bg-accent/90 text-accent-foreground whitespace-nowrap">
                  Subscribe
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </form>
            ) : (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex items-center justify-center gap-3 p-6 rounded-2xl glass-strong border border-green-500/30 max-w-md mx-auto"
              >
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                  <Check className="h-6 w-6 text-green-400" />
                </div>
                <div className="text-left">
                  <div className="font-bold text-foreground">Successfully Subscribed!</div>
                  <div className="text-sm text-muted-foreground">Check your inbox for confirmation.</div>
                </div>
              </motion.div>
            )}

            <p className="text-xs text-muted-foreground mt-4">
              We respect your privacy. Unsubscribe at any time.
            </p>
          </motion.div>
        </div>
      </section>

      {/* CTA Section - Enhanced */}
      <section className="py-32 px-6 bg-primary dark:bg-card relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 20% 50%, rgba(214, 185, 140, 0.4) 0%, transparent 50%),
                              radial-gradient(circle at 80% 50%, rgba(166, 138, 100, 0.3) 0%, transparent 50%)`
          }} />
        </div>

        {/* Animated Floating Elements */}
        <motion.div
          animate={{
            y: [0, -20, 0],
            rotate: [0, 5, 0],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-20 right-20 w-64 h-64 bg-accent/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            y: [0, 20, 0],
            rotate: [0, -5, 0],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-20 left-20 w-80 h-80 bg-primary-foreground/10 rounded-full blur-3xl"
        />

        <div className="container mx-auto max-w-5xl relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="space-y-8"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-foreground/10 dark:bg-accent/10 border border-primary-foreground/20 dark:border-accent/20">
              <Award className="h-4 w-4 text-accent" />
              <span className="text-xs font-bold uppercase tracking-widest text-primary-foreground dark:text-foreground">Start Building Wealth</span>
            </div>

            <h2 className="text-5xl lg:text-6xl font-heading font-black text-primary-foreground dark:text-foreground tracking-tighter">
              Ready to Own a Piece of
              <br />
              Lagos Real Estate?
            </h2>

            <p className="text-xl text-primary-foreground/80 dark:text-muted-foreground max-w-2xl mx-auto">
              Join thousands earning passive income from premium properties. No minimums, no hassle.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Link href="/marketplace">
                <Button size="lg" className="h-16 px-10 rounded-full font-bold text-sm uppercase tracking-widest shadow-premium hover:shadow-glow-primary transition-all-slow hover:scale-105 group bg-accent text-accent-foreground dark:bg-primary dark:text-primary-foreground">
                  Browse Properties
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="/dao">
                <Button variant="outline" size="lg" className="h-16 px-10 rounded-full font-bold text-sm uppercase tracking-widest border-2 border-primary-foreground/20 dark:border-border bg-primary-foreground/5 dark:bg-background/50 backdrop-blur-lg text-primary-foreground dark:text-foreground hover:bg-primary-foreground/10 dark:hover:bg-background transition-all-slow">
                  Learn More
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
