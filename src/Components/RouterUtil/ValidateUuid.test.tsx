import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import ValidateUuid, { isValidUuid } from './ValidateUuid';

// Mock the useQueryString hook
jest.mock('../QuestionComponents/questionHooks', () => ({
  useQueryString: jest.fn(() => '?lang=en'),
}));

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

  it('should render child routes when UUID is valid', () => {
    render(
      <MemoryRouter initialEntries={['/co/550e8400-e29b-41d4-a716-446655440000/step-1']}>
        <Routes>
          <Route path="/:whiteLabel" element={<div>White Label</div>}>
            <Route path=":uuid" element={<ValidateUuid />}>
              <Route path="step-1" element={<ChildComponent />} />
            </Route>
          </Route>
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Child Content')).toBeInTheDocument();
  });

  it('should redirect to /step-1 when UUID is invalid (no white label)', () => {
    const TestComponent = () => <div data-testid="step-1-page">Step 1</div>;

    render(
      <MemoryRouter initialEntries={['/invalid-uuid/child']}>
        <Routes>
          <Route path=":uuid" element={<ValidateUuid />}>
            <Route path="child" element={<div>Child</div>} />
          </Route>
          <Route path="/step-1" element={<TestComponent />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByTestId('step-1-page')).toBeInTheDocument();
    expect(screen.queryByText('Child')).not.toBeInTheDocument();
  });

  it('should redirect to /:whiteLabel/step-1 when UUID is invalid (with white label)', () => {
    const TestComponent = () => <div data-testid="step-1-page">Step 1 with WL</div>;

    render(
      <MemoryRouter initialEntries={['/co/invalid-uuid/child']}>
        <Routes>
          <Route path="/:whiteLabel" element={<div>White Label Wrapper</div>}>
            <Route path=":uuid" element={<ValidateUuid />}>
              <Route path="child" element={<div>Child</div>} />
            </Route>
            <Route path="step-1" element={<TestComponent />} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByTestId('step-1-page')).toBeInTheDocument();
    expect(screen.queryByText('Child')).not.toBeInTheDocument();
  });

  it('should redirect when UUID is undefined', () => {
    const TestComponent = () => <div data-testid="step-1-page">Step 1</div>;

    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<ValidateUuid />}>
            <Route path="child" element={<div>Child</div>} />
          </Route>
          <Route path="/step-1" element={<TestComponent />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByTestId('step-1-page')).toBeInTheDocument();
  });

  it('should preserve query parameters in redirect', () => {
    const TestComponent = () => {
      const urlParams = new URLSearchParams(window.location.search);
      return <div data-testid="step-1-page">Lang: {urlParams.get('lang')}</div>;
    };

    render(
      <MemoryRouter initialEntries={['/invalid-uuid']}>
        <Routes>
          <Route path=":uuid" element={<ValidateUuid />}>
            <Route path="child" element={<div>Child</div>} />
          </Route>
          <Route path="/step-1" element={<TestComponent />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByTestId('step-1-page')).toHaveTextContent('Lang: en');
  });

  it('should preserve white label in redirect with query parameters', () => {
    const TestComponent = () => {
      const urlParams = new URLSearchParams(window.location.search);
      return <div data-testid="step-1-page">Lang: {urlParams.get('lang')}</div>;
    };

    render(
      <MemoryRouter initialEntries={['/nc/invalid-uuid']}>
        <Routes>
          <Route path="/:whiteLabel" element={<div>White Label</div>}>
            <Route path=":uuid" element={<ValidateUuid />}>
              <Route path="child" element={<div>Child</div>} />
            </Route>
            <Route path="step-1" element={<TestComponent />} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByTestId('step-1-page')).toHaveTextContent('Lang: en');
  });

  it('should allow navigation through valid UUID routes', () => {
    render(
      <MemoryRouter initialEntries={['/ma/550e8400-e29b-41d4-a716-446655440000/confirm']}>
        <Routes>
          <Route path="/:whiteLabel" element={<div>White Label</div>}>
            <Route path=":uuid" element={<ValidateUuid />}>
              <Route path="confirm" element={<div data-testid="confirm-page">Confirm</div>} />
              <Route path="results" element={<div>Results</div>} />
            </Route>
          </Route>
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByTestId('confirm-page')).toBeInTheDocument();
  });
});
