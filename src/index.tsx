import ReactDOM from 'react-dom/client';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { BrowserRouter } from 'react-router-dom';
import Wrapper from './Components/Wrapper/Wrapper';
import './index.css';
import { initializeGTM } from './Assets/analytics';
import { handleHttpsRedirect } from './utils/httpsRedirect';
import { handleCustomDomainRedirect } from './config/customDomains';

initializeGTM();
// CRITICAL: HTTPS redirect must run BEFORE custom domain redirect
// to avoid double redirects (http → https, then domain redirect)
handleHttpsRedirect();
handleCustomDomainRedirect();

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
  <Wrapper>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </Wrapper>,
);

type FplYear = 2024 | 2025;
// get a certain income limit as a monthly value
function fpl(size: number, percent: number = 100, year: FplYear = 2025) {
  const fpl: Record<FplYear, Record<number, number>> = {
    2024: {
      1: 15_060,
      2: 20_440,
      3: 25_820,
      4: 31_200,
      5: 36_580,
      6: 41_960,
      7: 47_340,
      8: 52_720,
    },
    2025: {
      1: 15_650,
      2: 21_150,
      3: 26_650,
      4: 32_150,
      5: 37_650,
      6: 43_150,
      7: 48_650,
      8: 54_150,
    },
  };

  return Math.floor((fpl[year][size] * (percent / 100)) / 12);
}

// @ts-ignore make fpl accessable in the dev console
window.fpl = fpl;

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
