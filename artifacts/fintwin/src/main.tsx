import { createRoot } from 'react-dom/client';

import App from './App';
import './i18n';
import './index.css';
import { hydrateQueryCacheFromStorage } from '@/lib/queryClient';

// Rehydrate cached balances/transactions/scores from localStorage *before*
// the app renders, so a hard refresh shows the last-known-good numbers
// instantly instead of re-calling the API.
hydrateQueryCacheFromStorage();

createRoot(document.getElementById('root')!).render(<App />);
