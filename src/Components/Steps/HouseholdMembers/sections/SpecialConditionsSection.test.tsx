import { render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { useForm } from 'react-hook-form';
import SpecialConditionsSection from './SpecialConditionsSection';

// Mock MultiSelectTiles since it has complex tile/icon rendering
jest.mock('../../../SelectTiles/MultiSelectTiles', () => ({
  __esModule: true,
  default: ({ options, values, onChange }: any) => (
    <div data-testid="multi-select-tiles">
      {options.map((opt: any) => (
        <button
          key={opt.value}
          data-testid={`tile-${opt.value}`}
          data-selected={values[opt.value]}
          onClick={() => onChange({ ...values, [opt.value]: !values[opt.value] })}
        >
          {opt.value}
        </button>
      ))}
    </div>
  ),
}));

const makeConditionOptions = () => ({
  you: {
    student: { text: 'Student', icon: null },
    pregnant: { text: 'Pregnant', icon: null },
    disabled: { text: 'Disabled', icon: null },
  },
  them: {
    student: { text: 'Student (them)', icon: null },
    pregnant: { text: 'Pregnant (them)', icon: null },
    disabled: { text: 'Disabled (them)', icon: null },
  },
});

const Wrapper = ({
  pageNumber = 1,
  showReceivesSsi = false,
  errors = {},
  conditions = { student: false, pregnant: false, disabled: false },
  formValues = {},
}: {
  pageNumber?: number;
  showReceivesSsi?: boolean;
  errors?: Record<string, any>;
  conditions?: Record<string, boolean>;
  formValues?: Record<string, any>;
}) => {
  const { control, setValue, clearErrors, getValues } = useForm({
    defaultValues: {
      conditions,
      receivesSsi: 'false',
      ...formValues,
    },
  });

  return (
    <IntlProvider locale="en" messages={{}}>
      <SpecialConditionsSection
        control={control as any}
        errors={errors}
        conditions={conditions}
        setValue={setValue as any}
        clearErrors={clearErrors}
        options={makeConditionOptions() as any}
        pageNumber={pageNumber}
        showReceivesSsi={showReceivesSsi}
      />
    </IntlProvider>
  );
};

describe('SpecialConditionsSection', () => {
  describe('question header', () => {
    it('shows "Do any of these apply to you?" for page 1', () => {
      render(<Wrapper pageNumber={1} />);
      expect(screen.getByText(/do any of these apply to you/i)).toBeInTheDocument();
    });

    it('shows "Do any of these apply to them?" for page > 1', () => {
      render(<Wrapper pageNumber={2} />);
      expect(screen.getByText(/do any of these apply to them/i)).toBeInTheDocument();
    });
  });

  describe('description text', () => {
    it('renders "if none apply, skip" description', () => {
      render(<Wrapper />);
      expect(screen.getByText(/if none apply, skip this question/i)).toBeInTheDocument();
    });
  });

  describe('condition tiles', () => {
    it('renders tiles from "you" options for page 1', () => {
      render(<Wrapper pageNumber={1} />);
      expect(screen.getByTestId('tile-student')).toBeInTheDocument();
      expect(screen.getByTestId('tile-pregnant')).toBeInTheDocument();
      expect(screen.getByTestId('tile-disabled')).toBeInTheDocument();
    });

    it('renders tiles from "them" options for page > 1', () => {
      render(<Wrapper pageNumber={2} />);
      // MultiSelectTiles still gets keys from the options object
      expect(screen.getByTestId('tile-student')).toBeInTheDocument();
    });

    it('does not require any tile to be selected', () => {
      render(<Wrapper conditions={{ student: false, pregnant: false, disabled: false }} />);
      // No validation error displayed
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });

  describe('error display', () => {
    it('shows conditions-level error message when present', () => {
      const errors = { conditions: { message: 'Please select at least one condition' } };
      render(<Wrapper errors={errors} />);
      expect(screen.getByText('Please select at least one condition')).toBeInTheDocument();
    });

    it('does not show error when no conditions error', () => {
      render(<Wrapper errors={{}} />);
      expect(screen.queryByText(/please select/i)).not.toBeInTheDocument();
    });
  });

  describe('SSI question', () => {
    it('hides SSI question when showReceivesSsi is false', () => {
      render(<Wrapper showReceivesSsi={false} />);
      expect(screen.queryByRole('radiogroup')).not.toBeInTheDocument();
    });

    it('hides SSI question when disabled is false even if showReceivesSsi is true', () => {
      render(<Wrapper showReceivesSsi={true} conditions={{ student: false, pregnant: false, disabled: false }} formValues={{ 'conditions.disabled': false }} />);
      expect(screen.queryByRole('radiogroup')).not.toBeInTheDocument();
    });

    it('shows SSI question when showReceivesSsi=true and disabled=true', () => {
      render(
        <Wrapper
          showReceivesSsi={true}
          conditions={{ student: false, pregnant: false, disabled: true }}
          formValues={{ 'conditions.disabled': true }}
        />
      );
      expect(screen.getByRole('radiogroup')).toBeInTheDocument();
      expect(screen.getByRole('radio', { name: /yes/i })).toBeInTheDocument();
      expect(screen.getByRole('radio', { name: /no/i })).toBeInTheDocument();
    });

    it('shows page-1 SSI question text for page 1', () => {
      render(
        <Wrapper
          pageNumber={1}
          showReceivesSsi={true}
          conditions={{ student: false, pregnant: false, disabled: true }}
          formValues={{ 'conditions.disabled': true }}
        />
      );
      expect(screen.getByText(/did you receive full benefits/i)).toBeInTheDocument();
    });

    it('shows page-2 SSI question text for page > 1', () => {
      render(
        <Wrapper
          pageNumber={2}
          showReceivesSsi={true}
          conditions={{ student: false, pregnant: false, disabled: true }}
          formValues={{ 'conditions.disabled': true }}
        />
      );
      expect(screen.getByText(/do they receive full benefits/i)).toBeInTheDocument();
    });
  });

  describe('section id for scroll-to-error', () => {
    it('renders with id="conditions-section"', () => {
      const { container } = render(<Wrapper />);
      expect(container.querySelector('#conditions-section')).toBeInTheDocument();
    });
  });
});
