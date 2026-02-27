import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IntlProvider } from 'react-intl';
import { useForm } from 'react-hook-form';
import HealthInsuranceSection from './HealthInsuranceSection';

// Mock MultiSelectTiles since it has complex tile/icon rendering
jest.mock('../../../SelectTiles/MultiSelectTiles', () => ({
  __esModule: true,
  default: ({ options, values, onChange }: any) => (
    <div data-testid="multi-select-tiles">
      {options.map((opt: any) => (
        <button
          key={opt.value}
          data-testid={`tile-${opt.value}`}
          data-selected={String(values[opt.value] ?? false)}
          onClick={() => onChange({ ...values, [opt.value]: !values[opt.value] })}
        >
          {opt.value}
        </button>
      ))}
    </div>
  ),
}));

const makeInsuranceOptions = () => ({
  you: {
    none: { text: 'None', icon: null },
    employer: { text: 'Employer', icon: null },
    medicaid: { text: 'Medicaid', icon: null },
  },
  them: {
    none: { text: 'None (them)', icon: null },
    employer: { text: 'Employer (them)', icon: null },
    medicaid: { text: 'Medicaid (them)', icon: null },
  },
});

const defaultHealthInsurance = { none: false, employer: false, medicaid: false };

const Wrapper = ({
  pageNumber = 1,
  errors = {},
  healthInsurance = defaultHealthInsurance,
}: {
  pageNumber?: number;
  errors?: Record<string, any>;
  healthInsurance?: Record<string, boolean>;
}) => {
  const { setValue, clearErrors } = useForm({
    defaultValues: { healthInsurance },
  });

  return (
    <IntlProvider locale="en" messages={{}}>
      <HealthInsuranceSection
        errors={errors as any}
        healthInsurance={healthInsurance as any}
        setValue={setValue as any}
        clearErrors={clearErrors as any}
        options={makeInsuranceOptions() as any}
        pageNumber={pageNumber}
      />
    </IntlProvider>
  );
};

describe('HealthInsuranceSection', () => {
  describe('question header', () => {
    it('shows "you" question text for page 1', () => {
      render(<Wrapper pageNumber={1} />);
      expect(screen.getByText(/which type of health insurance do you have/i)).toBeInTheDocument();
    });

    it('shows "they" question text for page > 1', () => {
      render(<Wrapper pageNumber={2} />);
      expect(screen.getByText(/what type of health insurance do they have/i)).toBeInTheDocument();
    });
  });

  describe('description', () => {
    it('renders "choose all that apply" description', () => {
      render(<Wrapper />);
      expect(screen.getByText(/choose all that apply/i)).toBeInTheDocument();
    });
  });

  describe('insurance tiles', () => {
    it('renders tiles from "you" options for page 1', () => {
      render(<Wrapper pageNumber={1} />);
      expect(screen.getByTestId('tile-none')).toBeInTheDocument();
      expect(screen.getByTestId('tile-employer')).toBeInTheDocument();
      expect(screen.getByTestId('tile-medicaid')).toBeInTheDocument();
    });

    it('renders tiles from "them" options for page > 1', () => {
      render(<Wrapper pageNumber={2} />);
      expect(screen.getByTestId('tile-none')).toBeInTheDocument();
      expect(screen.getByTestId('tile-employer')).toBeInTheDocument();
    });

    it('reflects selected state on tiles', () => {
      render(<Wrapper healthInsurance={{ none: false, employer: true, medicaid: false }} />);
      expect(screen.getByTestId('tile-employer').getAttribute('data-selected')).toBe('true');
      expect(screen.getByTestId('tile-none').getAttribute('data-selected')).toBe('false');
    });
  });

  describe('error display', () => {
    it('shows error message when healthInsurance error is present', () => {
      const errors = { healthInsurance: { message: 'Please select at least one option' } };
      render(<Wrapper errors={errors} />);
      expect(screen.getByText('Please select at least one option')).toBeInTheDocument();
    });

    it('does not show error when no healthInsurance error', () => {
      render(<Wrapper errors={{}} />);
      expect(screen.queryByText(/please select/i)).not.toBeInTheDocument();
    });
  });

  describe('section id for scroll-to-error', () => {
    it('renders with id="health-insurance-section"', () => {
      const { container } = render(<Wrapper />);
      expect(container.querySelector('#health-insurance-section')).toBeInTheDocument();
    });
  });

  describe('onChange behavior', () => {
    it('calls setValue when a tile is clicked', () => {
      // Use a controlled version to verify setValue is called
      let capturedSetValue: any;
      const ControlledWrapper = () => {
        const { clearErrors } = useForm({
          defaultValues: { healthInsurance: defaultHealthInsurance },
        });
        capturedSetValue = jest.fn();
        return (
          <IntlProvider locale="en" messages={{}}>
            <HealthInsuranceSection
              errors={{} as any}
              healthInsurance={defaultHealthInsurance as any}
              setValue={capturedSetValue as any}
              clearErrors={clearErrors as any}
              options={makeInsuranceOptions() as any}
              pageNumber={1}
            />
          </IntlProvider>
        );
      };

      render(<ControlledWrapper />);
      userEvent.click(screen.getByTestId('tile-employer'));

      expect(capturedSetValue).toHaveBeenCalledWith(
        'healthInsurance',
        expect.objectContaining({ employer: true }),
        expect.objectContaining({ shouldValidate: false, shouldDirty: true }),
      );
    });
  });
});
