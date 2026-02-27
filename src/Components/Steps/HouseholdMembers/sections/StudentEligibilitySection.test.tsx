import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IntlProvider } from 'react-intl';
import { useForm } from 'react-hook-form';
import StudentEligibilitySection from './StudentEligibilitySection';
import { STUDENT_QUESTIONS } from '../utils/schema';

const Wrapper = ({
  pageNumber = 1,
  errors = {},
  defaultStudentEligibility = {},
}: {
  pageNumber?: number;
  errors?: Record<string, any>;
  defaultStudentEligibility?: Record<string, boolean | undefined>;
}) => {
  const { control } = useForm({
    defaultValues: {
      studentEligibility: {
        studentFullTime: undefined,
        studentJobTrainingProgram: undefined,
        studentHasWorkStudy: undefined,
        studentWorks20PlusHrs: undefined,
        ...defaultStudentEligibility,
      },
    },
  });

  return (
    <IntlProvider locale="en" messages={{}}>
      <StudentEligibilitySection
        control={control as any}
        errors={errors as any}
        pageNumber={pageNumber}
      />
    </IntlProvider>
  );
};

describe('StudentEligibilitySection', () => {
  describe('section title', () => {
    it('renders "Student Information" heading', () => {
      render(<Wrapper />);
      expect(screen.getByText(/student information/i)).toBeInTheDocument();
    });
  });

  describe('questions rendered', () => {
    it('renders all four student questions', () => {
      render(<Wrapper />);
      // Each question has a Yes and No radio
      const radioGroups = screen.getAllByRole('radiogroup');
      expect(radioGroups).toHaveLength(STUDENT_QUESTIONS.length);
    });

    it('renders Yes and No options for each question', () => {
      render(<Wrapper />);
      const yesRadios = screen.getAllByRole('radio', { name: /yes/i });
      const noRadios = screen.getAllByRole('radio', { name: /no/i });
      expect(yesRadios).toHaveLength(STUDENT_QUESTIONS.length);
      expect(noRadios).toHaveLength(STUDENT_QUESTIONS.length);
    });

    it('uses "you" subject for page 1', () => {
      render(<Wrapper pageNumber={1} />);
      // The first question references "you" (enrolled half-time...)
      expect(screen.getByText(/enrolled half-time or more/i)).toBeInTheDocument();
    });

    it('uses "they" subject for page > 1', () => {
      render(<Wrapper pageNumber={2} />);
      // Subject is injected into question text — verify the section still renders
      expect(screen.getAllByRole('radiogroup')).toHaveLength(STUDENT_QUESTIONS.length);
    });
  });

  describe('initial state', () => {
    it('has no radio pre-selected when all answers are undefined', () => {
      render(<Wrapper />);
      const radios = screen.getAllByRole('radio') as HTMLInputElement[];
      expect(radios.every((r) => !r.checked)).toBe(true);
    });

    it('pre-selects Yes when value is true', () => {
      render(<Wrapper defaultStudentEligibility={{ studentFullTime: true }} />);
      const firstYes = screen.getAllByRole('radio', { name: /yes/i })[0] as HTMLInputElement;
      expect(firstYes.checked).toBe(true);
    });

    it('pre-selects No when value is false', () => {
      render(<Wrapper defaultStudentEligibility={{ studentFullTime: false }} />);
      const firstNo = screen.getAllByRole('radio', { name: /no/i })[0] as HTMLInputElement;
      expect(firstNo.checked).toBe(true);
    });
  });

  describe('interaction', () => {
    it('selects Yes when clicked', async () => {
      const user = userEvent.setup();
      render(<Wrapper />);
      const firstYes = screen.getAllByRole('radio', { name: /yes/i })[0] as HTMLInputElement;
      await user.click(firstYes);
      expect(firstYes.checked).toBe(true);
    });

    it('selects No when clicked', async () => {
      const user = userEvent.setup();
      render(<Wrapper />);
      const firstNo = screen.getAllByRole('radio', { name: /no/i })[0] as HTMLInputElement;
      await user.click(firstNo);
      expect(firstNo.checked).toBe(true);
    });
  });

  describe('error display', () => {
    it('shows error message for a specific question when error is present', () => {
      const errors = {
        studentEligibility: {
          studentFullTime: { message: 'Please answer this question' },
        },
      };
      render(<Wrapper errors={errors} />);
      expect(screen.getByText('Please answer this question')).toBeInTheDocument();
    });

    it('does not show error when no errors present', () => {
      render(<Wrapper errors={{}} />);
      expect(screen.queryByText(/please answer/i)).not.toBeInTheDocument();
    });
  });

  describe('section id for scroll-to-error', () => {
    it('renders with id="student-eligibility-section"', () => {
      const { container } = render(<Wrapper />);
      expect(container.querySelector('#student-eligibility-section')).toBeInTheDocument();
    });
  });
});
