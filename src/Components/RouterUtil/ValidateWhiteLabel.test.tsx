import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import ValidateWhiteLabel from './ValidateWhiteLabel';
import { ALL_VALID_WHITE_LABELS } from '../../Types/WhiteLabel';

// Mock the useQueryString hook
jest.mock('../QuestionComponents/questionHooks', () => ({
  useQueryString: jest.fn(() => '?lang=es'),
}));

describe('ValidateWhiteLabel', () => {
  const ChildComponent = () => <div>Child Content</div>;

  it('should render child routes when white label is valid', () => {
    ALL_VALID_WHITE_LABELS.forEach((validWhiteLabel) => {
      const { unmount } = render(
        <MemoryRouter initialEntries={[`/${validWhiteLabel}/child`]}>
          <Routes>
            <Route path=":whiteLabel" element={<ValidateWhiteLabel />}>
              <Route path="child" element={<ChildComponent />} />
            </Route>
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByText('Child Content')).toBeInTheDocument();
      unmount();
    });
  });

  it('should redirect to /step-1 when white label is invalid', () => {
    const TestComponent = () => <div data-testid="step-1-page">Step 1</div>;

    render(
      <MemoryRouter initialEntries={['/invalid-white-label/child']}>
        <Routes>
          <Route path=":whiteLabel" element={<ValidateWhiteLabel />}>
            <Route path="child" element={<div>Child</div>} />
          </Route>
          <Route path="/step-1" element={<TestComponent />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByTestId('step-1-page')).toBeInTheDocument();
    expect(screen.queryByText('Child')).not.toBeInTheDocument();
  });

  it('should redirect when white label is undefined', () => {
    const TestComponent = () => <div data-testid="step-1-page">Step 1</div>;

    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<ValidateWhiteLabel />}>
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
      <MemoryRouter initialEntries={['/invalid-wl/child']}>
        <Routes>
          <Route path=":whiteLabel" element={<ValidateWhiteLabel />}>
            <Route path="child" element={<div>Child</div>} />
          </Route>
          <Route path="/step-1" element={<TestComponent />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByTestId('step-1-page')).toHaveTextContent('Lang: es');
  });

  it('should reject white labels that are close but not exact matches', () => {
    const TestComponent = () => <div data-testid="step-1-page">Step 1</div>;

    const invalidVariations = ['CO', 'Co', 'nc-invalid', 'ma-extra', 'co_energy'];

    invalidVariations.forEach((invalidWL) => {
      const { unmount } = render(
        <MemoryRouter initialEntries={[`/${invalidWL}/child`]}>
          <Routes>
            <Route path=":whiteLabel" element={<ValidateWhiteLabel />}>
              <Route path="child" element={<div>Child</div>} />
            </Route>
            <Route path="/step-1" element={<TestComponent />} />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByTestId('step-1-page')).toBeInTheDocument();
      expect(screen.queryByText('Child')).not.toBeInTheDocument();
      unmount();
    });
  });

  it('should allow nested routes with valid white labels', () => {
    render(
      <MemoryRouter initialEntries={['/co/550e8400-e29b-41d4-a716-446655440000/step-1']}>
        <Routes>
          <Route path=":whiteLabel" element={<ValidateWhiteLabel />}>
            <Route path=":uuid/step-1" element={<div data-testid="nested-route">Nested Step 1</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByTestId('nested-route')).toBeInTheDocument();
  });

  it('should validate all current white labels from the type definition', () => {
    // This test ensures that if white labels are added/removed, tests catch it
    const expectedWhiteLabels = ['co', 'nc', 'co_energy_calculator', 'ma', 'il', 'tx'];

    expect(ALL_VALID_WHITE_LABELS).toHaveLength(expectedWhiteLabels.length);
    expectedWhiteLabels.forEach((wl) => {
      expect(ALL_VALID_WHITE_LABELS).toContain(wl);
    });
  });

  it('should handle special energy calculator white label', () => {
    render(
      <MemoryRouter initialEntries={['/co_energy_calculator/landing-page']}>
        <Routes>
          <Route path=":whiteLabel" element={<ValidateWhiteLabel />}>
            <Route path="landing-page" element={<div data-testid="landing">Landing Page</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByTestId('landing')).toBeInTheDocument();
  });
});
