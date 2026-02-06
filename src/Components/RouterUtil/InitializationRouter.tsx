import { ReactElement } from 'react';
import { Routes, Route } from 'react-router-dom';
import SessionInitializer from './SessionInitializer';
import SessionRestoration from './SessionRestoration';
import RedirectToWhiteLabel from './RedirectToWhiteLabel';
import languageOptions from '../../Assets/languageOptions';

/**
 * Paths that should redirect to white-labeled versions during initialization.
 * These are legacy/shorthand URLs that map to the Colorado white label.
 */
const CO_REDIRECT_PATHS = ['jeffcohs', 'jeffcohscm', 'ccig', 'current-benefits'];

/**
 * Defines routes active during app initialization phase.
 * Handles legacy redirects, session initialization, and UUID-based session restoration.
 */
const buildInitializationRouteElements = (): ReactElement[] => {
  const routes: ReactElement[] = [];

  // Legacy CO shorthand paths redirect to full white label URL
  CO_REDIRECT_PATHS.forEach((path) => {
    routes.push(
      <Route key={path} path={path} element={<RedirectToWhiteLabel whiteLabel="co" />} />
    );
  });

  // step-1: Redirect to white label, then initialize session
  routes.push(
    <Route
      key="step-1"
      path="step-1"
      element={
        <RedirectToWhiteLabel>
          <SessionInitializer />
        </RedirectToWhiteLabel>
      }
    />
  );

  // White-labeled current-benefits: Set white label from URL
  routes.push(
    <Route key="current-benefits" path=":whiteLabel/current-benefits" element={<SessionInitializer />} />
  );

  // UUID routes: Restore session data from API
  routes.push(
    <Route key="uuid-wl" path=":whiteLabel/:uuid">
      <Route path="" element={<SessionRestoration />} />
      <Route path="*" element={<SessionRestoration />} />
    </Route>
  );

  routes.push(
    <Route key="uuid" path=":uuid">
      <Route path="" element={<SessionRestoration />} />
      <Route path="*" element={<SessionRestoration />} />
    </Route>
  );

  // Catch-all: Initialize with no specific white label
  routes.push(<Route key="catch-all" path="*" element={<SessionInitializer />} />);

  return routes;
};

/**
 * Wraps routes with language prefix variants (e.g., /es/*, /en/*).
 * Returns both language-prefixed and non-prefixed routes.
 */
const buildLanguagePrefixedRoutes = (baseRoutes: ReactElement[]): ReactElement[] => {
  const languages = Object.keys(languageOptions);
  const languageRoutes: ReactElement[] = [];

  // Add language-prefixed versions
  languages.forEach((language) => {
    languageRoutes.push(
      <Route key={`lang-${language}`} path={`${language}/*`}>
        {baseRoutes}
      </Route>
    );
  });

  // Add non-prefixed versions
  baseRoutes.forEach((route) => {
    languageRoutes.push(route);
  });

  return languageRoutes;
};

/**
 * Router active during app initialization (while config/translations are being fetched).
 *
 * Handles three types of routes:
 * 1. REDIRECT: Legacy/shorthand URLs → Full white label URLs (e.g., /jeffcohs → /co/jeffcohs)
 * 2. INITIALIZATION: Set white label from URL params (SessionInitializer)
 * 3. RESTORATION: Restore session data from UUID via API (SessionRestoration)
 *
 * Once initialization completes, App.tsx switches to AppRoutes (the main application router).
 */
const InitializationRouter = () => {
  const baseRoutes = buildInitializationRouteElements();
  const allRoutes = buildLanguagePrefixedRoutes(baseRoutes);

  return <Routes>{allRoutes}</Routes>;
};

export default InitializationRouter;
