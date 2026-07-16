import { motion } from "framer-motion";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight, BarChart3, Leaf, Landmark, FileText } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import heroDataImage from "@assets/Pasted--svg-viewBox-0-0-1200-720-fill-none-xmlns-http-www-w3-o_1784229700790.svg";

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 }
};

const stagger = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col font-sans">
      <Navbar />
      
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="relative pt-24 pb-32 overflow-hidden bg-background">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-background to-background pointer-events-none" />
          <div className="container mx-auto px-4 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <motion.div 
                initial="initial" 
                animate="animate" 
                variants={stagger}
                className="max-w-2xl"
              >
                <motion.div variants={fadeIn} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary font-medium text-sm mb-6 border border-primary/20">
                  <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse"></span>
                  The Digital Twin for MSMEs
                </motion.div>
                <motion.h1 variants={fadeIn} className="text-5xl lg:text-7xl font-bold text-foreground leading-[1.1] tracking-tight mb-6">
                  Turn your <span className="text-muted-foreground italic">invisible</span> business into a <span className="text-primary">fundable</span> one.
                </motion.h1>
                <motion.p variants={fadeIn} className="text-xl text-muted-foreground mb-8 leading-relaxed">
                  FinTwin builds a live digital twin of your Jordanian small business from real transaction data. No accountant needed. Get ready for formal loans and green financing in minutes.
                </motion.p>
                <motion.div variants={fadeIn} className="flex flex-wrap items-center gap-4">
                  <Button size="lg" className="h-14 px-8 text-lg rounded-full" asChild>
                    <Link href="/get-started">
                      Build Your FinTwin <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                  </Button>
                </motion.div>
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="relative"
              >
                <div className="absolute -inset-4 bg-primary/5 rounded-[2.5rem] blur-2xl z-0" />
                <img 
                  src={heroDataImage} 
                  alt="Abstract data visualization" 
                  className="relative z-10 rounded-[2rem] shadow-2xl border border-white/20 w-full object-cover"
                />
              </motion.div>
            </div>
          </div>
        </section>

        {/* The Problem Section */}
        <section className="py-24 bg-foreground text-background">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center mb-16">
              <h2 className="text-3xl lg:text-5xl font-bold mb-6">99.5% of Jordan's businesses are MSMEs. Most can't access formal finance.</h2>
              <p className="text-xl text-muted/80">Traditional banks require years of audited financials. We use the data you already generate every day.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="p-8 rounded-2xl bg-card/5 border border-white/10">
                <BarChart3 className="h-10 w-10 text-primary mb-6" />
                <h3 className="text-xl font-semibold mb-3">Live Connection</h3>
                <p className="text-muted/70">Connect JoFotara, CliQ, Open Banking, or simply upload receipts. We handle the rest.</p>
              </div>
              <div className="p-8 rounded-2xl bg-card/5 border border-white/10">
                <Landmark className="h-10 w-10 text-primary mb-6" />
                <h3 className="text-xl font-semibold mb-3">Instant Credibility</h3>
                <p className="text-muted/70">Generate a verified financial profile that banks and lenders actually trust and understand.</p>
              </div>
              <div className="p-8 rounded-2xl bg-card/5 border border-white/10">
                <Leaf className="h-10 w-10 text-primary mb-6" />
                <h3 className="text-xl font-semibold mb-3">Green Financing</h3>
                <p className="text-muted/70">Unlock CBJ-backed green loans at 2.5%-3.5% through our automated taxonomy matching.</p>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-24 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl lg:text-5xl font-bold mb-6">How FinTwin Works</h2>
              <p className="text-xl text-muted-foreground">From data scattered everywhere to a cohesive financial profile ready for the bank.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="relative p-6 bg-card rounded-3xl border shadow-sm flex flex-col h-full">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold mb-6">1</div>
                <h4 className="text-xl font-semibold mb-3">Register</h4>
                <p className="text-muted-foreground flex-grow">Provide basic business details. No complex forms or accounting jargon.</p>
              </div>
              <div className="relative p-6 bg-card rounded-3xl border shadow-sm flex flex-col h-full">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold mb-6">2</div>
                <h4 className="text-xl font-semibold mb-3">Connect Data</h4>
                <p className="text-muted-foreground flex-grow">Link your JoFotara, bank account, or POS. Cash business? Just upload receipt photos.</p>
              </div>
              <div className="relative p-6 bg-card rounded-3xl border shadow-sm flex flex-col h-full">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold mb-6">3</div>
                <h4 className="text-xl font-semibold mb-3">Twin Generates</h4>
                <p className="text-muted-foreground flex-grow">Our engine processes thousands of transactions into a unified financial twin.</p>
              </div>
              <div className="relative p-6 bg-card rounded-3xl border shadow-sm flex flex-col h-full bg-primary/5 border-primary/20">
                <div className="w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold mb-6">4</div>
                <h4 className="text-xl font-semibold mb-3 text-primary">Get Funded</h4>
                <p className="text-muted-foreground flex-grow">Match with lenders who accept your FinTwin profile and apply with one click.</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 bg-primary text-primary-foreground relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
          <div className="container mx-auto px-4 relative z-10 text-center">
            <h2 className="text-4xl lg:text-6xl font-bold mb-6">Stop being invisible.</h2>
            <p className="text-xl lg:text-2xl mb-10 max-w-2xl mx-auto opacity-90">
              Join thousands of Jordanian MSMEs building their financial future today. Takes 5 minutes, completely free to start.
            </p>
            <Button size="lg" variant="secondary" className="h-16 px-10 text-xl rounded-full text-foreground hover:bg-background/90" asChild>
              <Link href="/get-started">
                Build Your FinTwin
              </Link>
            </Button>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
}
