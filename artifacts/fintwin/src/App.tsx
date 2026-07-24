import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import Home from '@/pages/Home';
import GetStarted from '@/pages/GetStarted';
import Onboarding from '@/pages/Onboarding';
import Dashboard from '@/pages/Dashboard';
import Simulation from '@/pages/Simulation';
import LoanPrescreening from '@/pages/LoanPrescreening';
import Login from '@/pages/Login';
import Profile from '@/pages/Profile';
import GreenAssessment from '@/pages/GreenAssessment';
import GreenScore from '@/pages/GreenScore';
import Transactions from '@/pages/Transactions';
import MyLoans from '@/pages/MyLoans';
import { Route, Switch, Router as WouterRouter } from 'wouter';
import { OnboardingProvider } from '@/context/OnboardingContext';
import { SimulationProvider } from '@/context/SimulationContext';
import { PrescreeningProvider } from '@/context/PrescreeningContext';
import { LanguageProvider } from '@/context/LanguageContext';
import { SubscriptionProvider } from '@/context/SubscriptionContext';
import { UpgradeModal } from '@/components/UpgradeModal';

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/get-started" component={GetStarted} />
      <Route path="/onboarding" component={Onboarding} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/transactions" component={Transactions} />
      <Route path="/simulation" component={Simulation} />
      <Route path="/loan-prescreening" component={LoanPrescreening} />
      <Route path="/my-loans" component={MyLoans} />
      <Route path="/login" component={Login} />
      <Route path="/profile" component={Profile} />
      <Route path="/green-assessment" component={GreenAssessment} />
      <Route path="/green-score" component={GreenScore} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <LanguageProvider>
        <OnboardingProvider>
          <SubscriptionProvider>
            <SimulationProvider>
              <PrescreeningProvider>
                <WouterRouter base={import.meta.env.BASE_URL?.replace(/\/$/, '') || ''}>
                  <Router />
                  <UpgradeModal />
                </WouterRouter>
              </PrescreeningProvider>
            </SimulationProvider>
          </SubscriptionProvider>
        </OnboardingProvider>
        </LanguageProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
