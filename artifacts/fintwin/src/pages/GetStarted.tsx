import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
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
          className="max-w-xl w-full text-center"
        >
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
            Let's build your financial profile.
          </h1>
          <p className="text-lg text-muted-foreground mb-10">
            Five minutes. No paperwork. No accountant.
          </p>

          <Button size="lg" className="h-14 px-10 text-lg rounded-full" asChild>
            <Link href="/onboarding">
              Start <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
          </Button>

          <p className="mt-6 text-sm text-muted-foreground">
            Already have a profile?{" "}
            <Link href="/dashboard" className="text-primary hover:underline font-medium">
              Go to dashboard
            </Link>
          </p>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}
