// Mock the useQueryString hook BEFORE any imports
jest.mock('../QuestionComponents/questionHooks');

import { screen } from '@testing-library/react';
import { Route, Routes, useLocation } from 'react-router-dom';
import ValidateWhiteLabel from './ValidateWhiteLabel';
import { ALL_VALID_WHITE_LABELS } from '../../Types/WhiteLabel';
import { useQueryString } from '../QuestionComponents/questionHooks';
import { renderWithRouter } from '../../test-utils/renderHelpers';

const mockUseQueryString = useQueryString as jest.MockedFunction<typeof useQueryString>;

describe('ValidateWhiteLabel', () => {
  const ChildComponent = () => <div>Child Content</div>;

  beforeEach(() => {
    mockUseQueryString.mockReturnValue('?lang=es');
  });

  it('should render child routes when white label is valid', () => {
    ALL_VALID_WHITE_LABELS.forEach((validWhiteLabel) => {
      const { unmount } = renderWithRouter(
        <Routes>
          <Route path=":whiteLabel" element={<ValidateWhiteLabel />}>
            <Route path="child" element={<ChildComponent />} />
          </Route>
        </Routes>,
        { initialRoute: `/${validWhiteLabel}/child` }
      );

      expect(screen.getByText('Child Content')).toBeInTheDocument();
      unmount();
    });
  });

  it('should redirect to /step-1 when white label is invalid', () => {
    const TestComponent = () => <div data-testid="step-1-page">Step 1</div>;

    renderWithRouter(
      <Routes>
        <Route path=":whiteLabel" element={<ValidateWhiteLabel />}>
          <Route path="child" element={<div>Child</div>} />
        </Route>
        <Route path="/step-1" element={<TestComponent />} />
      </Routes>,
      { initialRoute: '/invalid-white-label/child' }
    );

    expect(screen.getByTestId('step-1-page')).toBeInTheDocument();
    expect(screen.queryByText('Child')).not.toBeInTheDocument();
  });

  it('should redirect when white label is undefined', () => {
    const TestComponent = () => <div data-testid="step-1-page">Step 1</div>;

    renderWithRouter(
      <Routes>
        <Route path="/" element={<ValidateWhiteLabel />}>
          <Route path="child" element={<div>Child</div>} />
        </Route>
        <Route path="/step-1" element={<TestComponent />} />
      </Routes>,
      { initialRoute: '/' }
    );

    expect(screen.getByTestId('step-1-page')).toBeInTheDocument();
  });

  it('should preserve query parameters in redirect', () => {
    mockUseQueryString.mockReturnValue('?lang=es&test=true');

    const LocationCapture = () => {
      const location = useLocation();
      return (
        <div data-testid="step-1-page">
          Step 1
          <span data-testid="pathname">{location.pathname}</span>
          <span data-testid="search">{location.search}</span>
        </div>
      );
    };

    renderWithRouter(
      <Routes>
        <Route path=":whiteLabel" element={<ValidateWhiteLabel />}>
          <Route path="child" element={<div>Child</div>} />
        </Route>
        <Route path="/step-1" element={<LocationCapture />} />
      </Routes>,
      { initialRoute: '/invalid-wl/child' }
    );

    expect(screen.getByTestId('step-1-page')).toBeInTheDocument();
    expect(mockUseQueryString).toHaveBeenCalled();
    expect(screen.getByTestId('pathname')).toHaveTextContent('/step-1');
    expect(screen.getByTestId('search')).toHaveTextContent('?lang=es&test=true');
  });

  it('should reject white labels that are close but not exact matches', () => {
    const TestComponent = () => <div data-testid="step-1-page">Step 1</div>;

    const invalidVariations = ['CO', 'Co', 'nc-invalid', 'ma-extra', 'co_energy'];

    invalidVariations.forEach((invalidWL) => {
      const { unmount } = renderWithRouter(
        <Routes>
          <Route path=":whiteLabel" element={<ValidateWhiteLabel />}>
            <Route path="child" element={<div>Child</div>} />
          </Route>
          <Route path="/step-1" element={<TestComponent />} />
        </Routes>,
        { initialRoute: `/${invalidWL}/child` }
      );

      expect(screen.getByTestId('step-1-page')).toBeInTheDocument();
      expect(screen.queryByText('Child')).not.toBeInTheDocument();
      unmount();
    });
  });

  it('should allow nested routes with valid white labels', () => {
    renderWithRouter(
      <Routes>
        <Route path=":whiteLabel" element={<ValidateWhiteLabel />}>
          <Route path=":uuid/step-1" element={<div data-testid="nested-route">Nested Step 1</div>} />
        </Route>
      </Routes>,
      { initialRoute: '/co/550e8400-e29b-41d4-a716-446655440000/step-1' }
    );

    expect(screen.getByTestId('nested-route')).toBeInTheDocument();
  });

  it('should validate all current white labels from the type definition', () => {
    // This test ensures that if white labels are added/removed, tests catch it
    // Check that we have a reasonable number of white labels (at least the core ones)
    expect(ALL_VALID_WHITE_LABELS.length).toBeGreaterThanOrEqual(4);

    // Spot-check that key white labels are present
    expect(ALL_VALID_WHITE_LABELS).toContain('co');
    expect(ALL_VALID_WHITE_LABELS).toContain('nc');
    expect(ALL_VALID_WHITE_LABELS).toContain('cesn');

    // Ensure all white labels are strings with valid format
    ALL_VALID_WHITE_LABELS.forEach((wl) => {
      expect(typeof wl).toBe('string');
      expect(wl.length).toBeGreaterThan(0);
    });
  });

  it('should handle special energy calculator white label', () => {
    renderWithRouter(
      <Routes>
        <Route path=":whiteLabel" element={<ValidateWhiteLabel />}>
          <Route path="landing-page" element={<div data-testid="landing">Landing Page</div>} />
        </Route>
      </Routes>,
      { initialRoute: '/cesn/landing-page' }
    );

    expect(screen.getByTestId('landing')).toBeInTheDocument();
  });
});
