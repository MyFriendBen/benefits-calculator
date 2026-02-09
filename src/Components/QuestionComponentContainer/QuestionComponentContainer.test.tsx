import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import QuestionComponentContainer from './QuestionComponentContainer';
import { Context } from '../Wrapper/Wrapper';
import { WrapperContext } from '../../Types/WrapperContext';

// Mock all the step components to avoid needing full context
jest.mock('../Steps/Zipcode', () => ({
  Zipcode: () => <div data-testid="zipcode-component">Zipcode Step</div>,
}));
jest.mock('../Steps/HouseholdSize/HouseholdSize', () => ({
  __esModule: true,
  default: () => <div data-testid="household-size-component">Household Size Step</div>,
}));
jest.mock('../Steps/Expenses/Expenses', () => ({
  __esModule: true,
  default: () => <div data-testid="expenses-component">Expenses Step</div>,
}));
jest.mock('../Common/usePageTitle', () => ({
  usePageTitle: jest.fn(),
}));

// Create a minimal mock context
const createMockContext = (stepDirectory: string[] = []): Partial<WrapperContext> => ({
  getReferrer: jest.fn((key: string, defaultValue: any) => {
    if (key === 'stepDirectory') {
      return stepDirectory;
    }
    return defaultValue;
  }),
  formData: {
    path: 'default',
  } as any,
});

const renderWithRouter = (
  stepId: string,
  stepDirectory: string[] = ['zipcode', 'householdSize', 'hasExpenses'],
) => {
  const mockContext = createMockContext(stepDirectory);

  return render(
    <Context.Provider value={mockContext as WrapperContext}>
      <MemoryRouter initialEntries={[`/co/test-uuid/step-${stepId}`]}>
        <Routes>
          <Route path="/co/:uuid">
            {/* Specific routes must come before parameterized routes */}
            <Route path="step-1" element={<div>Redirected to Step 1</div>} />
            <Route path="step-:id" element={<QuestionComponentContainer />} />
          </Route>
        </Routes>
      </MemoryRouter>
    </Context.Provider>,
  );
};

describe('QuestionComponentContainer - Step Number Validation', () => {
  describe('Invalid step numbers - redirect to step-1', () => {
    it('should redirect when step number is too high (step-99)', () => {
      renderWithRouter('99');
      expect(screen.getByText('Redirected to Step 1')).toBeInTheDocument();
    });

    it('should redirect when step number is way too high (step-999)', () => {
      renderWithRouter('999');
      expect(screen.getByText('Redirected to Step 1')).toBeInTheDocument();
    });

    it('should redirect when step number is 0', () => {
      renderWithRouter('0');
      expect(screen.getByText('Redirected to Step 1')).toBeInTheDocument();
    });

    it('should redirect when step number is negative', () => {
      renderWithRouter('-1');
      expect(screen.getByText('Redirected to Step 1')).toBeInTheDocument();
    });

    it('should redirect when step number is not a number', () => {
      renderWithRouter('abc');
      expect(screen.getByText('Redirected to Step 1')).toBeInTheDocument();
    });

    it('should redirect when step number is a decimal', () => {
      renderWithRouter('3.5');
      expect(screen.getByText('Redirected to Step 1')).toBeInTheDocument();
    });

    it('should redirect when step exceeds directory (step-6 with 3 questions)', () => {
      // With 3 questions and STARTING_QUESTION_NUMBER=3, max valid is 5
      renderWithRouter('6', ['zipcode', 'householdSize', 'hasExpenses']);
      expect(screen.getByText('Redirected to Step 1')).toBeInTheDocument();
    });
  });

  describe('Edge cases', () => {
    it('should redirect when step directory is empty and step > 2', () => {
      // Empty directory means only hardcoded steps 1 and 2 are valid
      renderWithRouter('3', []);
      expect(screen.getByText('Redirected to Step 1')).toBeInTheDocument();
    });

    it('should redirect when step exceeds large directory', () => {
      const largeDirectory = Array.from({ length: 20 }, (_, i) => `question${i}`);
      // Max step would be 20 + 3 (STARTING_QUESTION_NUMBER) = 23
      // Step 24 should redirect
      renderWithRouter('24', largeDirectory);
      expect(screen.getByText('Redirected to Step 1')).toBeInTheDocument();
    });
  });

  describe('Valid step numbers should render (basic smoke test)', () => {
    it('should not redirect for valid step-3', () => {
      const { container } = renderWithRouter('3', ['zipcode', 'householdSize']);
      // Should render the component, not the redirect message
      expect(screen.queryByText('Redirected to Step 1')).not.toBeInTheDocument();
      expect(container.querySelector('.benefits-form')).toBeInTheDocument();
    });
  });
});
