import { useState } from "react";
import { motion } from "framer-motion";
import { useOnboarding } from "@/context/OnboardingContext";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, FileText, Landmark, CreditCard, CheckCircle2, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

type SourceKey = 'jofotara' | 'cliq' | 'pos';

export function Step3Data() {
  const { state, updateState, setCurrentStep } = useOnboarding();
  const [activeModal, setActiveModal] = useState<SourceKey | null>(null);
  const [connectionState, setConnectionState] = useState<'idle' | 'connecting' | 'success'>('idle');

  const sources = [
    {
      id: 'jofotara' as SourceKey,
      name: 'JoFotara',
      description: 'Government-verified invoice data, synced automatically.',
      icon: FileText,
      color: 'bg-blue-500/10 text-blue-600',
      actionText: 'Connect JoFotara',
      successText: '124 invoices imported',
    },
    {
      id: 'cliq' as SourceKey,
      name: 'CliQ & Open Banking',
      description: 'Import CliQ payments and bank transactions via open banking.',
      icon: Landmark,
      color: 'bg-emerald-500/10 text-emerald-600',
      actionText: 'Connect Bank',
      successText: '847 transactions synced',
    },
    {
      id: 'pos' as SourceKey,
      name: 'POS Terminal',
      description: 'Sync your point-of-sale data directly.',
      icon: CreditCard,
      color: 'bg-purple-500/10 text-purple-600',
      actionText: 'Connect POS',
      successText: 'Terminal synced',
    },
  ];

  const handleConnect = (id: SourceKey) => { setActiveModal(id); setConnectionState('idle'); };

  const simulateConnection = () => {
    setConnectionState('connecting');
    setTimeout(() => {
      setConnectionState('success');
      setTimeout(() => {
        if (activeModal) updateState({ connectedSources: { ...state.connectedSources, [activeModal]: true } });
        setActiveModal(null);
      }, 1200);
    }, 2000);
  };

  const connectedCount = (['jofotara', 'cliq', 'pos'] as SourceKey[]).filter(k => state.connectedSources[k]).length;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="max-w-3xl mx-auto"
    >
      <div className="mb-8 text-center">
        <h2 className="text-3xl font-bold mb-2">Connect your data</h2>
        <p className="text-muted-foreground">Choose the sources that match your business. You can add more later.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {sources.map((source) => {
          const isConnected = state.connectedSources[source.id];
          const Icon = source.icon;
          return (
            <div
              key={source.id}
              className={`bg-card border rounded-3xl p-6 flex flex-col transition-all duration-300 ${
                isConnected ? 'border-primary/40 bg-primary/5 shadow-sm' : 'hover:border-primary/30'
              }`}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${source.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold">{source.name}</h3>
                  {isConnected ? (
                    <div className="flex items-center text-xs text-primary font-medium mt-0.5">
                      <CheckCircle2 className="w-3 h-3 mr-1" />{source.successText}
                    </div>
                  ) : (
                    <div className="text-xs text-muted-foreground mt-0.5">Not connected</div>
                  )}
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-5 flex-grow">{source.description}</p>
              <Button
                variant={isConnected ? 'outline' : 'secondary'}
                className="w-full rounded-xl"
                onClick={() => !isConnected && handleConnect(source.id)}
                disabled={isConnected}
              >
                {isConnected ? 'Connected' : source.actionText}
              </Button>
            </div>
          );
        })}
      </div>

      {connectedCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border rounded-2xl p-5 mb-6 flex items-center justify-between"
        >
          <p className="text-sm font-medium">{connectedCount} of 3 sources connected</p>
          <div className="flex items-center gap-3">
            <div className="w-28 h-1.5 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary transition-all duration-700" style={{ width: `${(connectedCount / 3) * 100}%` }} />
            </div>
            <span className="text-sm text-muted-foreground">{Math.round((connectedCount / 3) * 100)}%</span>
          </div>
        </motion.div>
      )}

      <div className="flex items-center justify-between pt-4 border-t">
        <Button variant="ghost" onClick={() => setCurrentStep(2)}>
          <ArrowLeft className="mr-2 w-4 h-4" /> Back
        </Button>
        <Button size="lg" className="rounded-full px-8" onClick={() => setCurrentStep(4)}>
          Continue <ArrowRight className="ml-2 w-4 h-4" />
        </Button>
      </div>

      <Dialog open={!!activeModal} onOpenChange={(open) => !open && setActiveModal(null)}>
        <DialogContent className="sm:max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl">
              {activeModal === 'jofotara' && 'Connect JoFotara'}
              {activeModal === 'cliq' && 'Connect Bank Account'}
              {activeModal === 'pos' && 'Connect POS Terminal'}
            </DialogTitle>
            <DialogDescription>
              {activeModal === 'cliq' && 'Select your bank to authenticate via open banking.'}
              {activeModal === 'pos' && 'Select your POS provider.'}
              {activeModal === 'jofotara' && 'Authenticate with your Ministry of Finance credentials.'}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            {connectionState === 'idle' && (
              <div className="space-y-3">
                {activeModal === 'cliq' && (
                  <div className="grid grid-cols-2 gap-3">
                    {['Arab Bank', 'Jordan Kuwait Bank', 'Cairo Amman Bank', 'Housing Bank'].map(bank => (
                      <Button key={bank} variant="outline" className="h-14 justify-start px-4 text-sm" onClick={simulateConnection}>
                        <Landmark className="w-4 h-4 mr-2 text-muted-foreground" />{bank}
                      </Button>
                    ))}
                  </div>
                )}
                {activeModal === 'pos' && (
                  <div className="space-y-2">
                    {['Network International', 'Areeba', 'Cashi'].map(pos => (
                      <Button key={pos} variant="outline" className="w-full h-12 justify-start px-4" onClick={simulateConnection}>
                        <CreditCard className="w-4 h-4 mr-2 text-muted-foreground" />{pos}
                      </Button>
                    ))}
                  </div>
                )}
                {activeModal === 'jofotara' && (
                  <Button className="w-full h-12" onClick={simulateConnection}>Authenticate via Sanad</Button>
                )}
              </div>
            )}
            {connectionState === 'connecting' && (
              <div className="flex flex-col items-center py-8 text-center">
                <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
                <p className="font-medium">Connecting...</p>
              </div>
            )}
            {connectionState === 'success' && (
              <div className="flex flex-col items-center py-8 text-center">
                <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle2 className="w-7 h-7 text-primary" />
                </div>
                <p className="font-medium mb-1">Connected</p>
                <p className="text-sm text-muted-foreground">{sources.find(s => s.id === activeModal)?.successText}</p>
              </div>
            )}
          </div>

          {connectionState === 'idle' && (
            <DialogFooter>
              <Button variant="ghost" onClick={() => setActiveModal(null)}>Cancel</Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
