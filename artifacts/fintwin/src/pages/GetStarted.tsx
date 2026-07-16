import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowRight, Clock, Shield, FileText, CheckCircle2 } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export default function GetStarted() {
  return (
    <div className="min-h-screen flex flex-col font-sans bg-background">
      <Navbar />
      
      <main className="flex-grow flex items-center justify-center py-20 px-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-3xl w-full"
        >
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground mb-6">
              Let's build your financial profile
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              In just a few steps, we'll create a digital twin of your business that lenders can trust. No paperwork required.
            </p>
          </div>

          <div className="bg-card border shadow-sm rounded-3xl p-8 md:p-12 mb-10">
            <h3 className="text-xl font-semibold mb-8 text-center">What you'll need to get the most accurate score:</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-4">
                  <Clock className="w-6 h-6" />
                </div>
                <h4 className="font-medium text-foreground mb-2">5 Minutes</h4>
                <p className="text-sm text-muted-foreground">That's all it takes to set up your profile and connect your data sources.</p>
              </div>
              
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-4">
                  <FileText className="w-6 h-6" />
                </div>
                <h4 className="font-medium text-foreground mb-2">Basic Info</h4>
                <p className="text-sm text-muted-foreground">Your business name, sector, and basic operational details.</p>
              </div>
              
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-4">
                  <Shield className="w-6 h-6" />
                </div>
                <h4 className="font-medium text-foreground mb-2">Data Sources</h4>
                <p className="text-sm text-muted-foreground">Optional but recommended: Connect JoFotara, CliQ, or upload receipts.</p>
              </div>
            </div>
            
            <div className="mt-12 bg-muted/50 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-3 text-muted-foreground text-sm">
                <CheckCircle2 className="text-green-500 w-5 h-5 flex-shrink-0" />
                <p>Your data is securely encrypted. We never share your raw transactions with lenders without your explicit permission.</p>
              </div>
            </div>
          </div>

          <div className="text-center">
            <Button size="lg" className="h-16 px-12 text-xl rounded-full shadow-lg" asChild>
              <Link href="/onboarding">
                Start Building Your Profile <ArrowRight className="ml-2 w-6 h-6" />
              </Link>
            </Button>
            <p className="mt-6 text-sm text-muted-foreground">
              Already have an account? <Link href="/dashboard" className="text-primary hover:underline font-medium">Sign in instead</Link>
            </p>
          </div>
        </motion.div>
      </main>
      
      <Footer />
    </div>
  );
}
