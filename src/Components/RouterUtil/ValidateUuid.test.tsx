// Mock the useQueryString hook BEFORE any imports
jest.mock('../QuestionComponents/questionHooks');

import { screen } from '@testing-library/react';
import { Route, Routes, useLocation } from 'react-router-dom';
import ValidateUuid, { isValidUuid } from './ValidateUuid';
import { useQueryString } from '../QuestionComponents/questionHooks';
import { renderWithRouter } from '../../test-utils/renderHelpers';

const mockUseQueryString = useQueryString as jest.MockedFunction<typeof useQueryString>;

describe('isValidUuid', () => {
  it('should return true for valid UUIDs', () => {
    expect(isValidUuid('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
    expect(isValidUuid('6ba7b810-9dad-11d1-80b4-00c04fd430c8')).toBe(true);
    expect(isValidUuid('12345678-1234-5678-1234-567812345678')).toBe(true);
  });

  it('should return false for invalid UUIDs', () => {
    expect(isValidUuid('not-a-uuid')).toBe(false);
    expect(isValidUuid('550e8400-e29b-41d4-a716')).toBe(false);
    expect(isValidUuid('550e8400-e29b-41d4-a716-446655440000-extra')).toBe(false);
    expect(isValidUuid('550e8400e29b41d4a716446655440000')).toBe(false); // missing dashes
    expect(isValidUuid('')).toBe(false);
  });

  it('should handle uppercase and lowercase UUIDs', () => {
    expect(isValidUuid('550E8400-E29B-41D4-A716-446655440000')).toBe(true);
    expect(isValidUuid('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
    expect(isValidUuid('550E8400-e29b-41D4-a716-446655440000')).toBe(true);
  });
});

describe('ValidateUuid', () => {
  const ChildComponent = () => <div>Child Content</div>;

  beforeEach(() => {
    mockUseQueryString.mockReturnValue('?lang=en');
  });

  it('should render child routes when UUID is valid', () => {
    renderWithRouter(
      <Routes>
        <Route path="/:whiteLabel/:uuid" element={<ValidateUuid />}>
          <Route path="step-1" element={<ChildComponent />} />
        </Route>
      </Routes>,
      { initialRoute: '/co/550e8400-e29b-41d4-a716-446655440000/step-1' }
    );

    expect(screen.getByText('Child Content')).toBeInTheDocument();
  });

  it('should redirect to /step-1 when UUID is invalid (no white label)', () => {
    const TestComponent = () => <div data-testid="step-1-page">Step 1</div>;

    renderWithRouter(
      <Routes>
        <Route path=":uuid" element={<ValidateUuid />}>
          <Route path="child" element={<div>Child</div>} />
        </Route>
        <Route path="/step-1" element={<TestComponent />} />
      </Routes>,
      { initialRoute: '/invalid-uuid/child' }
    );

    expect(screen.getByTestId('step-1-page')).toBeInTheDocument();
    expect(screen.queryByText('Child')).not.toBeInTheDocument();
  });

  it('should redirect to /:whiteLabel/step-1 when UUID is invalid (with white label)', () => {
    const TestComponent = () => <div data-testid="step-1-page">Step 1 with WL</div>;

    renderWithRouter(
      <Routes>
        <Route path="/:whiteLabel/:uuid" element={<ValidateUuid />}>
          <Route path="child" element={<div>Child</div>} />
        </Route>
        <Route path="/:whiteLabel/step-1" element={<TestComponent />} />
      </Routes>,
      { initialRoute: '/co/invalid-uuid' }
    );

    expect(screen.getByTestId('step-1-page')).toBeInTheDocument();
  });

  it('should redirect when UUID is undefined', () => {
    const TestComponent = () => <div data-testid="step-1-page">Step 1</div>;

    renderWithRouter(
      <Routes>
        <Route path="/" element={<ValidateUuid />}>
          <Route path="child" element={<div>Child</div>} />
        </Route>
        <Route path="/step-1" element={<TestComponent />} />
      </Routes>,
      { initialRoute: '/' }
    );

    expect(screen.getByTestId('step-1-page')).toBeInTheDocument();
  });

  it('should preserve query parameters in redirect', () => {
    mockUseQueryString.mockReturnValue('?lang=en&externalid=123');

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
        <Route path=":uuid" element={<ValidateUuid />}>
          <Route path="child" element={<div>Child</div>} />
        </Route>
        <Route path="/step-1" element={<LocationCapture />} />
      </Routes>,
      { initialRoute: '/invalid-uuid' }
    );

    expect(screen.getByTestId('step-1-page')).toBeInTheDocument();
    expect(mockUseQueryString).toHaveBeenCalled();
    expect(screen.getByTestId('pathname')).toHaveTextContent('/step-1');
    expect(screen.getByTestId('search')).toHaveTextContent('?lang=en&externalid=123');
  });

  it('should preserve white label in redirect with query parameters', () => {
    mockUseQueryString.mockReturnValue('?lang=en&test=true');

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
        <Route path="/:whiteLabel/:uuid" element={<ValidateUuid />}>
          <Route path="child" element={<div>Child</div>} />
        </Route>
        <Route path="/:whiteLabel/step-1" element={<LocationCapture />} />
      </Routes>,
      { initialRoute: '/nc/invalid-uuid' }
    );

    expect(screen.getByTestId('step-1-page')).toBeInTheDocument();
    expect(mockUseQueryString).toHaveBeenCalled();
    expect(screen.getByTestId('pathname')).toHaveTextContent('/nc/step-1');
    expect(screen.getByTestId('search')).toHaveTextContent('?lang=en&test=true');
  });

  it('should allow navigation through valid UUID routes', () => {
    renderWithRouter(
      <Routes>
        <Route path="/:whiteLabel/:uuid" element={<ValidateUuid />}>
          <Route path="confirm" element={<div data-testid="confirm-page">Confirm</div>} />
          <Route path="results" element={<div>Results</div>} />
        </Route>
      </Routes>,
      { initialRoute: '/ma/550e8400-e29b-41d4-a716-446655440000/confirm' }
    );

    expect(screen.getByTestId('confirm-page')).toBeInTheDocument();
  });
});
