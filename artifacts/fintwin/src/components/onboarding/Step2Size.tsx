import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useOnboarding, EnterpriseCategory } from "@/context/OnboardingContext";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, ArrowRight, Building2, CheckCircle2 } from "lucide-react";

export function Step2Size() {
  const { state, updateState, setCurrentStep } = useOnboarding();
  const [showReveal, setShowReveal] = useState(false);

  const employeesOptions = [
    { value: "1-4", label: "1 to 4 employees" },
    { value: "5-19", label: "5 to 19 employees" },
    { value: "20+", label: "20 or more employees" },
  ];

  const revenueOptions = [
    { value: "<100k", label: "Under 100,000 JOD" },
    { value: "100k-1M", label: "100,000 - 1,000,000 JOD" },
    { value: ">1M", label: "Over 1,000,000 JOD" },
  ];

  const yearsOptions = [
    { value: "<1", label: "Less than 1 year" },
    { value: "1-3", label: "1 to 3 years" },
    { value: "3-5", label: "3 to 5 years" },
    { value: ">5", label: "More than 5 years" },
  ];

  const isFormComplete = state.employees && state.annualRevenue && state.yearsInOperation;

  const determineCategory = (): EnterpriseCategory => {
    if (state.employees === "20+" || state.annualRevenue === ">1M") return "Medium Enterprise";
    if (state.employees === "5-19" || state.annualRevenue === "100k-1M") return "Small Enterprise";
    return "Micro Enterprise";
  };

  const handleReveal = () => {
    const category = determineCategory();
    updateState({ category });
    setShowReveal(true);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="max-w-xl mx-auto"
    >
      <div className="mb-10 text-center">
        <h2 className="text-3xl font-bold mb-3">Understanding your scale</h2>
        <p className="text-muted-foreground">This helps us match you with the right financing tier.</p>
      </div>

      <AnimatePresence mode="wait">
        {!showReveal ? (
          <motion.div 
            key="form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-8 bg-card border p-8 rounded-3xl shadow-sm"
          >
            <div className="space-y-3">
              <Label className="text-base font-medium">Number of Employees</Label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {employeesOptions.map((opt) => (
                  <div
                    key={opt.value}
                    onClick={() => updateState({ employees: opt.value })}
                    className={`cursor-pointer rounded-xl border-2 p-4 text-center transition-all ${
                      state.employees === opt.value 
                        ? 'border-primary bg-primary/5 text-primary' 
                        : 'border-transparent bg-muted hover:bg-muted/80'
                    }`}
                  >
                    <div className="font-medium">{opt.label.split(' ')[0]} {opt.label.split(' ')[1]}</div>
                    <div className="text-xs mt-1 opacity-70">employees</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-base font-medium">Years in Operation</Label>
              <Select 
                value={state.yearsInOperation} 
                onValueChange={(val) => updateState({ yearsInOperation: val })}
              >
                <SelectTrigger className="h-12 text-lg">
                  <SelectValue placeholder="Select years active" />
                </SelectTrigger>
                <SelectContent>
                  {yearsOptions.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label className="text-base font-medium">Annual Revenue (JOD)</Label>
              <div className="grid grid-cols-1 gap-3">
                {revenueOptions.map((opt) => (
                  <div
                    key={opt.value}
                    onClick={() => updateState({ annualRevenue: opt.value })}
                    className={`cursor-pointer rounded-xl border-2 p-4 transition-all flex items-center justify-between ${
                      state.annualRevenue === opt.value 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border bg-transparent hover:border-primary/30'
                    }`}
                  >
                    <span className="font-medium">{opt.label}</span>
                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${state.annualRevenue === opt.value ? 'border-primary' : 'border-muted-foreground'}`}>
                      {state.annualRevenue === opt.value && <div className="w-3 h-3 rounded-full bg-primary" />}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-6 flex justify-between">
              <Button variant="ghost" onClick={() => setCurrentStep(1)}>
                <ArrowLeft className="mr-2 w-4 h-4" /> Back
              </Button>
              <Button 
                size="lg" 
                className="rounded-full px-8 h-12" 
                disabled={!isFormComplete}
                onClick={handleReveal}
              >
                Calculate Tier <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="reveal"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card border-2 border-primary/20 p-10 rounded-3xl shadow-lg text-center relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl" />
            
            <div className="relative z-10">
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", bounce: 0.5, delay: 0.2 }}
                className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6"
              >
                <Building2 className="w-10 h-10 text-primary" />
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <h3 className="text-sm font-semibold text-primary uppercase tracking-wider mb-2">Business Classification</h3>
                <h2 className="text-4xl font-bold mb-4">{state.category}</h2>
                <p className="text-muted-foreground mb-10 max-w-sm mx-auto">
                  Based on Central Bank of Jordan guidelines. This unlocks specific financing tiers suited for your size.
                </p>
                
                <div className="flex justify-center gap-4">
                  <Button variant="outline" className="rounded-full" onClick={() => setShowReveal(false)}>
                    Change Details
                  </Button>
                  <Button size="lg" className="rounded-full px-8" onClick={() => setCurrentStep(3)}>
                    <CheckCircle2 className="mr-2 w-5 h-5" /> This looks right
                  </Button>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
