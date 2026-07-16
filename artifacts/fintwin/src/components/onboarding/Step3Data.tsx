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
      description: 'Automatically import your invoice and billing data from Jordan\'s national e-invoicing system. Government-verified, instantly credible.',
      icon: FileText,
      color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
      actionText: 'Connect JoFotara',
      successText: '124 invoices imported',
    },
    {
      id: 'cliq' as SourceKey,
      name: 'CliQ & Open Banking',
      description: 'Connect your bank account to import your Cliq payment history and transaction records through Jordan\'s open banking network.',
      icon: Landmark,
      color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
      actionText: 'Connect Bank',
      successText: '847 transactions synced',
    },
    {
      id: 'pos' as SourceKey,
      name: 'POS Terminal',
      description: 'Sync your point-of-sale data directly. We support all major POS providers operating in Jordan.',
      icon: CreditCard,
      color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
      actionText: 'Connect POS',
      successText: 'Terminal synced',
    },
  ];

  const handleConnect = (id: SourceKey) => {
    setActiveModal(id);
    setConnectionState('idle');
  };

  const simulateConnection = () => {
    setConnectionState('connecting');
    setTimeout(() => {
      setConnectionState('success');
      setTimeout(() => {
        if (activeModal) {
          updateState({
            connectedSources: {
              ...state.connectedSources,
              [activeModal]: true,
            },
          });
        }
        setActiveModal(null);
      }, 1500);
    }, 2000);
  };

  const connectedCount = (['jofotara', 'cliq', 'pos'] as SourceKey[]).filter(
    (k) => state.connectedSources[k]
  ).length;
  const isAnyConnected = connectedCount > 0;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="max-w-3xl mx-auto"
    >
      <div className="mb-10 text-center">
        <h2 className="text-3xl font-bold mb-3">Build your financial picture</h2>
        <p className="text-muted-foreground text-lg max-w-xl mx-auto">
          Connect the data sources that match how your business operates. You can add more later.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
        {sources.map((source) => {
          const isConnected = state.connectedSources[source.id];
          const Icon = source.icon;

          return (
            <div
              key={source.id}
              className={`relative bg-card border rounded-3xl p-6 transition-all duration-300 flex flex-col h-full ${
                isConnected ? 'border-primary/50 shadow-md bg-primary/5' : 'hover:border-primary/30 hover:shadow-md'
              }`}
            >
              <div className="flex items-start gap-4 mb-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${source.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{source.name}</h3>
                  {isConnected ? (
                    <div className="flex items-center text-sm text-primary font-medium mt-1">
                      <CheckCircle2 className="w-4 h-4 mr-1" />
                      {source.successText}
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground mt-1">Not connected</div>
                  )}
                </div>
              </div>

              <p className="text-sm text-muted-foreground mb-6 flex-grow">{source.description}</p>

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

      {isAnyConnected && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border rounded-2xl p-6 mb-8 flex items-center justify-between"
        >
          <div>
            <h4 className="font-semibold">Your data picture</h4>
            <p className="text-sm text-muted-foreground">{connectedCount} of 3 sources connected</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-1000"
                style={{ width: `${(connectedCount / 3) * 100}%` }}
              />
            </div>
            <span className="text-sm font-medium">{Math.round((connectedCount / 3) * 100)}%</span>
          </div>
        </motion.div>
      )}

      <div className="flex items-center justify-between pt-4 border-t">
        <Button variant="ghost" onClick={() => setCurrentStep(2)}>
          <ArrowLeft className="mr-2 w-4 h-4" /> Back
        </Button>
        <div className="flex gap-4">
          <Button
            size="lg"
            className="rounded-full px-8"
            onClick={() => setCurrentStep(4)}
          >
            {isAnyConnected ? 'Continue' : 'Skip & Continue'} <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Connection Modal */}
      <Dialog open={!!activeModal} onOpenChange={(open) => !open && setActiveModal(null)}>
        <DialogContent className="sm:max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-2xl">
              {activeModal === 'jofotara' && 'Connect JoFotara'}
              {activeModal === 'cliq' && 'Connect Bank Account'}
              {activeModal === 'pos' && 'Connect POS Terminal'}
            </DialogTitle>
            <DialogDescription>
              {activeModal === 'cliq' && 'Select your bank to authenticate securely via open banking.'}
              {activeModal === 'pos' && 'Select your point-of-sale provider.'}
              {activeModal === 'jofotara' && 'Authenticate with your Ministry of Finance portal credentials.'}
            </DialogDescription>
          </DialogHeader>

          <div className="py-6">
            {connectionState === 'idle' && (
              <div className="space-y-4">
                {activeModal === 'cliq' && (
                  <div className="grid grid-cols-2 gap-3">
                    {['Arab Bank', 'Jordan Kuwait Bank', 'Cairo Amman Bank', 'Housing Bank'].map((bank) => (
                      <Button key={bank} variant="outline" className="h-16 justify-start px-4" onClick={simulateConnection}>
                        <Landmark className="w-5 h-5 mr-3 text-muted-foreground" /> {bank}
                      </Button>
                    ))}
                  </div>
                )}
                {activeModal === 'pos' && (
                  <div className="grid grid-cols-1 gap-3">
                    {['Network International', 'Areeba', 'Cashi'].map((pos) => (
                      <Button key={pos} variant="outline" className="h-14 justify-start px-4" onClick={simulateConnection}>
                        <CreditCard className="w-5 h-5 mr-3 text-muted-foreground" /> {pos}
                      </Button>
                    ))}
                  </div>
                )}
                {activeModal === 'jofotara' && (
                  <Button className="w-full h-14" onClick={simulateConnection}>
                    Authenticate via Sanad
                  </Button>
                )}
              </div>
            )}

            {connectionState === 'connecting' && (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <Loader2 className="w-12 h-12 text-primary animate-spin mb-6" />
                <h3 className="text-xl font-medium mb-2">Connecting securely...</h3>
                <p className="text-muted-foreground">This will just take a moment</p>
              </div>
            )}

            {connectionState === 'success' && (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                  <CheckCircle2 className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-medium mb-2">Connected Successfully!</h3>
                <p className="text-muted-foreground">
                  {sources.find((s) => s.id === activeModal)?.successText}
                </p>
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
