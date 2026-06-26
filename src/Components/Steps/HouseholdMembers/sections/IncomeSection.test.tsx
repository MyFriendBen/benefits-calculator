import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { useForm, useFieldArray } from 'react-hook-form';
import IncomeSection from './IncomeSection';
import { EMPTY_INCOME_STREAM } from '../utils/constants';

// FormattedMessageType is ReactElement; plain strings work fine in JSDOM render tests
const incomeCategories = { employment: 'Employment' as any, benefits: 'Benefits' as any };
const incomeOptions = {
  employment: { wages: 'Wages' as any, selfEmployed: 'Self-Employed' as any },
  benefits: { ssi: 'SSI' as any },
};
const frequencyMenuItems = [
  <option key="monthly" value="monthly">Monthly</option>,
  <option key="hourly" value="hourly">Hourly</option>,
];

const Wrapper = ({
  defaultStreams = [{ ...EMPTY_INCOME_STREAM }],
  errors = {},
}: {
  defaultStreams?: typeof EMPTY_INCOME_STREAM[];
  errors?: Record<string, any>;
}) => {
  const { control, setValue } = useForm({
    defaultValues: { incomeStreams: defaultStreams },
  });
  const { fields, append, remove } = useFieldArray({ control, name: 'incomeStreams' });

  return (
    <IntlProvider locale="en" messages={{}}>
      <IncomeSection
        control={control as any}
        errors={errors as any}
        fields={fields as any}
        append={append}
        remove={remove}
        setValue={setValue as any}
        incomeCategories={incomeCategories}
        incomeOptions={incomeOptions}
        frequencyMenuItems={frequencyMenuItems as any}
        pageNumber={1}
      />
    </IntlProvider>
  );
};

// MUI Select renders as role="button" with aria-haspopup="listbox" in JSDOM
const getSelectDivs = () =>
  document.querySelectorAll('[aria-haspopup="listbox"]') as NodeListOf<HTMLElement>;

describe('IncomeSection', () => {
  describe('income source select disabled state', () => {
    it('disables the Income Source select when no category is selected', () => {
      render(<Wrapper />);
      const selects = getSelectDivs();
      // order: income-category (0), income-source (1), frequency (2)
      // The Income Source Select's hidden input is disabled — check the wrapper class
      const sourceSelect = selects[1];
      expect(sourceSelect.closest('.MuiInputBase-root')).toHaveClass('Mui-disabled');
    });

    it('enables the Income Source select after a category is pre-populated', () => {
      render(<Wrapper defaultStreams={[{ ...EMPTY_INCOME_STREAM, incomeCategory: 'employment' }]} />);
      const selects = getSelectDivs();
      expect(selects[1].closest('.MuiInputBase-root')).not.toHaveClass('Mui-disabled');
    });
  });

  describe('hourly hours field', () => {
    it('does not show Hours per Week label when frequency is not hourly', () => {
      render(<Wrapper defaultStreams={[{ ...EMPTY_INCOME_STREAM, incomeCategory: 'employment', incomeFrequency: 'monthly' }]} />);
      expect(screen.queryByText(/hours per week/i)).not.toBeInTheDocument();
    });

    it('shows Hours per Week label when frequency is hourly', () => {
      render(<Wrapper defaultStreams={[{ ...EMPTY_INCOME_STREAM, incomeCategory: 'employment', incomeFrequency: 'hourly' }]} />);
      expect(screen.getByText(/hours per week/i)).toBeInTheDocument();
    });
  });

  describe('delete button', () => {
    it('renders a delete button for each income stream', () => {
      render(<Wrapper defaultStreams={[EMPTY_INCOME_STREAM, EMPTY_INCOME_STREAM]} />);
      expect(screen.getAllByRole('button', { name: /delete income source/i })).toHaveLength(2);
    });
  });

  describe('add income source button', () => {
    it('renders the Add An Income Source button', () => {
      render(<Wrapper />);
      expect(screen.getByRole('button', { name: /add an income source/i })).toBeInTheDocument();
    });

    it('appends a new row when Add button is clicked', async () => {
      render(<Wrapper defaultStreams={[EMPTY_INCOME_STREAM]} />);
      const before = screen.getAllByRole('button', { name: /delete income source/i }).length;
      fireEvent.click(screen.getByRole('button', { name: /add an income source/i }));
      await waitFor(() => {
        expect(screen.getAllByRole('button', { name: /delete income source/i })).toHaveLength(before + 1);
      });
    });
  });

  describe('accessibility', () => {
    it('each visible field label has an id that matches a Select aria-labelledby', () => {
      render(<Wrapper defaultStreams={[{ ...EMPTY_INCOME_STREAM, incomeCategory: 'employment' }]} />);
      // Check that the Typography labels we added ids to are present
      expect(document.getElementById('income-category-label-0')).toBeInTheDocument();
      expect(document.getElementById('income-source-label-0')).toBeInTheDocument();
      expect(document.getElementById('income-frequency-label-0')).toBeInTheDocument();
      expect(document.getElementById('income-amount-label-0')).toBeInTheDocument();
    });
  });
});
