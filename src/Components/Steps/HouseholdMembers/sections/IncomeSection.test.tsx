import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { useForm, useFieldArray } from 'react-hook-form';
import IncomeSection from './IncomeSection';
import { EMPTY_INCOME_STREAM } from '../utils/constants';
import { deriveIncomeAnswers } from '../utils/helpers';
import { IncomeStreamFormData } from '../utils/types';

// Stub stepDirectory (IncomeSection calls useStepNumber for analytics). The
// frequency "?" now uses the shared HelpButton, which falls back safely without
// Wrapper Context, so no provider is needed here.
jest.mock('../../../../Assets/stepDirectory', () => ({
  useStepNumber: (_name: string, _required?: boolean) => 5,
  useStepName: (_stepNumber: number) => undefined,
}));

// FormattedMessageType is ReactElement; plain strings work fine in JSDOM render tests
const incomeCategories = {
  employment: 'Work & Self-Employment Income' as any,
  government: 'Government Benefits' as any,
  support: 'Family Support & Gifts' as any,
};
const incomeOptions = {
  employment: {
    wages: 'Wages, salaries, or tips' as any,
    selfEmployment: 'Self-employment, freelance, gig, or contract work' as any,
  },
  government: { sSI: 'SSI' as any },
  support: { childSupport: 'Child Support' as any },
};
const frequencyMenuItems = [
  <option key="monthly" value="monthly">Monthly</option>,
  <option key="hourly" value="hourly">Hourly</option>,
];

const Wrapper = ({
  defaultStreams = [],
  errors = {},
  clearErrorsSpy,
  pageNumber = 1,
}: {
  defaultStreams?: IncomeStreamFormData[];
  errors?: Record<string, any>;
  clearErrorsSpy?: (name: string) => void;
  pageNumber?: number;
}) => {
  // Mirror how defaultValues seeds the three answer fields from persisted streams,
  // so rehydration behavior can be exercised by passing defaultStreams alone.
  const derived = deriveIncomeAnswers(defaultStreams);
  const { control, setValue, clearErrors } = useForm({
    defaultValues: {
      incomeEmployed: derived.employed ? true : derived.gig ? false : null,
      incomeGig: derived.gig ? true : null,
      incomeOther: derived.other ? true : null,
      incomeStreams: defaultStreams,
    },
  });
  const { fields, append, remove } = useFieldArray({ control, name: 'incomeStreams' });

  return (
    <IntlProvider locale="en" messages={{}}>
      <IncomeSection
        control={control as any}
        errors={errors as any}
        fields={fields as any}
        append={append as any}
        remove={remove}
        setValue={setValue as any}
        clearErrors={(clearErrorsSpy ?? clearErrors) as any}
        incomeCategories={incomeCategories}
        incomeOptions={incomeOptions}
        frequencyMenuItems={frequencyMenuItems as any}
        pageNumber={pageNumber}
      />
    </IntlProvider>
  );
};

const employmentStream = (source: string): IncomeStreamFormData => ({
  ...EMPTY_INCOME_STREAM,
  incomeCategory: 'employment',
  incomeStreamName: source,
});

const otherStream = (): IncomeStreamFormData => ({
  ...EMPTY_INCOME_STREAM,
  incomeCategory: 'government',
  incomeStreamName: 'sSI',
});

// MUI Select renders as role="button" with aria-haspopup="listbox" in JSDOM
const getSelectDivs = () =>
  document.querySelectorAll('[aria-haspopup="listbox"]') as NodeListOf<HTMLElement>;

// Grabs the Yes/No radiogroup for a question by its accessible name.
const yesNoGroup = (namePattern: RegExp) => screen.getByRole('radiogroup', { name: namePattern });
const clickYes = (namePattern: RegExp) =>
  fireEvent.click(within(yesNoGroup(namePattern)).getByRole('radio', { name: /^yes$/i }));
const clickNo = (namePattern: RegExp) =>
  fireEvent.click(within(yesNoGroup(namePattern)).getByRole('radio', { name: /^no$/i }));

describe('IncomeSection (three-question design)', () => {
  describe('question visibility', () => {
    it('renders the employed and other questions, but hides the gig question initially', () => {
      render(<Wrapper />);
      expect(screen.getByText(/are you currently employed\?/i)).toBeInTheDocument();
      expect(screen.getByText(/government benefits, child support, alimony/i)).toBeInTheDocument();
      expect(screen.queryByText(/freelance, gig, or occasional work/i)).not.toBeInTheDocument();
    });

    it('phrases the questions in the first person for member 1 ("you")', () => {
      render(<Wrapper pageNumber={1} />);
      expect(screen.getByText(/are you currently employed\?/i)).toBeInTheDocument();
    });

    it('phrases the questions in the third person for later members ("they")', () => {
      render(<Wrapper pageNumber={2} />);
      expect(screen.getByText(/are they currently employed\?/i)).toBeInTheDocument();
      expect(screen.queryByText(/are you currently employed\?/i)).not.toBeInTheDocument();
    });

    it('shows the gig question only after answering "No" to employed', () => {
      render(<Wrapper />);
      clickNo(/are you currently employed/i);
      expect(screen.getByText(/freelance, gig, or occasional work/i)).toBeInTheDocument();
    });

    it('hides the gig question again when employed is switched to "Yes"', () => {
      render(<Wrapper />);
      clickNo(/are you currently employed/i);
      expect(screen.getByText(/freelance, gig, or occasional work/i)).toBeInTheDocument();
      clickYes(/are you currently employed/i);
      expect(screen.queryByText(/freelance, gig, or occasional work/i)).not.toBeInTheDocument();
    });
  });

  describe('employed question (Q1) fields', () => {
    it('reveals a source-only row (no category dropdown) on "Yes"', async () => {
      render(<Wrapper />);
      clickYes(/are you currently employed/i);
      await waitFor(() => {
        expect(document.getElementById('income-source-label-0')).toBeInTheDocument();
      });
      // No Income Category label for employment rows.
      expect(document.getElementById('income-category-label-0')).not.toBeInTheDocument();
    });

    it('offers both wages and self-employment as source options', async () => {
      // Employment rows show only when the question is Yes; seed one wages stream
      // to auto-answer employed and surface the row.
      render(<Wrapper defaultStreams={[employmentStream('wages')]} />);
      const sourceSelect = Array.from(getSelectDivs()).find(
        (el) => el.getAttribute('aria-label') === 'Income Source',
      )!;
      fireEvent.mouseDown(sourceSelect);
      await waitFor(() => {
        expect(screen.getByRole('option', { name: /wages, salaries, or tips/i })).toBeInTheDocument();
        expect(
          screen.getByRole('option', { name: /self-employment, freelance, gig, or contract work/i }),
        ).toBeInTheDocument();
      });
    });
  });

  describe('gig question (Q2) fields', () => {
    it('shows only frequency + amount (no category or source dropdowns) on "Yes"', async () => {
      render(<Wrapper />);
      clickNo(/are you currently employed/i);
      clickYes(/freelance, gig, or occasional work/i);
      await waitFor(() => {
        expect(document.getElementById('income-amount-label-0')).toBeInTheDocument();
      });
      expect(document.getElementById('income-category-label-0')).not.toBeInTheDocument();
      expect(document.getElementById('income-source-label-0')).not.toBeInTheDocument();
    });
  });

  describe('other question (Q3) fields', () => {
    it('reveals a full row with category dropdown on "Yes"', async () => {
      render(<Wrapper />);
      clickYes(/government benefits, child support, alimony/i);
      await waitFor(() => {
        expect(document.getElementById('income-category-label-0')).toBeInTheDocument();
        expect(document.getElementById('income-source-label-0')).toBeInTheDocument();
      });
    });

    it('excludes the employment category from the Q3 category dropdown', async () => {
      render(<Wrapper defaultStreams={[otherStream()]} />);
      const categorySelect = Array.from(getSelectDivs()).find(
        (el) => el.getAttribute('aria-label') === 'Income Category',
      )!;
      fireEvent.mouseDown(categorySelect);
      await waitFor(() => {
        expect(screen.getByRole('option', { name: /government benefits/i })).toBeInTheDocument();
      });
      expect(screen.queryByRole('option', { name: /work & self-employment income/i })).not.toBeInTheDocument();
    });
  });

  describe('rehydration from existing streams', () => {
    it('auto-answers employed=Yes and renders the employment row for a saved wages stream', () => {
      render(<Wrapper defaultStreams={[employmentStream('wages')]} />);
      expect(document.getElementById('income-source-label-0')).toBeInTheDocument();
      // Gig question stays hidden because employed is Yes.
      expect(screen.queryByText(/freelance, gig, or occasional work/i)).not.toBeInTheDocument();
    });

    it('auto-answers gig=Yes (employed=No) for a saved self-employment-only stream', () => {
      render(<Wrapper defaultStreams={[employmentStream('selfEmployment')]} />);
      expect(screen.getByText(/freelance, gig, or occasional work/i)).toBeInTheDocument();
    });

    it('auto-answers other=Yes for a saved non-employment stream', () => {
      render(<Wrapper defaultStreams={[otherStream()]} />);
      expect(document.getElementById('income-category-label-0')).toBeInTheDocument();
    });
  });

  describe('add / remove within a bucket', () => {
    it('offers an add-income-source link on the gig question', () => {
      render(<Wrapper defaultStreams={[employmentStream('selfEmployment')]} />);
      // Gig question is active (self-employment-only stream) and can add more rows.
      expect(screen.getByRole('button', { name: /add an income source/i })).toBeInTheDocument();
    });

    it('appends another employment row via Add An Income Source', async () => {
      render(<Wrapper defaultStreams={[employmentStream('wages')]} />);
      const before = screen.getAllByRole('button', { name: /delete income source/i }).length;
      fireEvent.click(screen.getByRole('button', { name: /add an income source/i }));
      await waitFor(() => {
        expect(screen.getAllByRole('button', { name: /delete income source/i })).toHaveLength(before + 1);
      });
    });

    it('removes all employment rows when employed is switched to "No" (after confirming in the popover)', async () => {
      render(<Wrapper defaultStreams={[employmentStream('wages')]} />);
      expect(screen.getAllByRole('button', { name: /delete income source/i })).toHaveLength(1);
      clickNo(/are you currently employed/i);
      // A confirmation popover appears; confirm the removal.
      fireEvent.click(await screen.findByRole('button', { name: /^remove$/i }));
      await waitFor(() => {
        expect(screen.queryByRole('button', { name: /delete income source/i })).not.toBeInTheDocument();
      });
    });
  });

  describe('confirm before discarding filled income (destructive toggle)', () => {
    it('opens a confirmation popover before removing a filled row when switching to "No"', async () => {
      render(<Wrapper defaultStreams={[employmentStream('wages')]} />);
      clickNo(/are you currently employed/i);
      expect(await screen.findByText(/this will remove the income you entered/i)).toBeInTheDocument();
    });

    it('keeps the data and the "Yes" answer if the popover is cancelled', async () => {
      render(<Wrapper defaultStreams={[employmentStream('wages')]} />);
      clickNo(/are you currently employed/i);
      fireEvent.click(await screen.findByRole('button', { name: /^cancel$/i }));
      await waitFor(() => {
        expect(screen.queryByText(/this will remove the income you entered/i)).not.toBeInTheDocument();
      });
      expect(screen.getByRole('button', { name: /delete income source/i })).toBeInTheDocument();
      expect(within(yesNoGroup(/are you currently employed/i)).getByRole('radio', { name: /^yes$/i })).toHaveAttribute('aria-checked', 'true');
    });

    it('does not prompt when the employment rows are empty', () => {
      render(<Wrapper />);
      clickYes(/are you currently employed/i); // appends an empty employment row
      clickNo(/are you currently employed/i); // empty row → removed with no popover
      expect(screen.queryByText(/this will remove the income you entered/i)).not.toBeInTheDocument();
      // Gig question appears (employed is now No), confirming the toggle applied.
      expect(screen.getByText(/freelance, gig, or occasional work/i)).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('renders each question as a radiogroup with two radios', () => {
      render(<Wrapper />);
      const group = yesNoGroup(/are you currently employed/i);
      expect(within(group).getAllByRole('radio')).toHaveLength(2);
    });

    it('associates the required-answer error with the toggle via aria-describedby + aria-invalid', () => {
      // Force the employed error via the errors prop.
      render(<Wrapper errors={{ incomeEmployed: { message: 'Please select an answer.' } }} />);
      const group = yesNoGroup(/are you currently employed/i);
      expect(group).toHaveAttribute('aria-invalid', 'true');
      const describedBy = group.getAttribute('aria-describedby');
      expect(describedBy).toBe('income-employed-error');
      expect(document.getElementById(describedBy!)).toHaveTextContent(/please select an answer/i);
    });

    it('clears the stale question error when the answer is changed', () => {
      // Reproduces the confusing case: after a failed submit the "Yes" question
      // shows an error; toggling No then Yes should clear it rather than persist.
      const clearErrorsSpy = jest.fn();
      render(<Wrapper clearErrorsSpy={clearErrorsSpy} />);
      clickNo(/are you currently employed/i);
      clickYes(/are you currently employed/i);
      expect(clearErrorsSpy).toHaveBeenCalledWith('incomeEmployed');
    });

    it('moves the selection with arrow keys', () => {
      render(<Wrapper />);
      const group = yesNoGroup(/are you currently employed/i);
      fireEvent.keyDown(group, { key: 'ArrowRight' });
      // From unanswered, ArrowRight selects "Yes".
      expect(within(group).getByRole('radio', { name: /^yes$/i })).toHaveAttribute('aria-checked', 'true');
      fireEvent.keyDown(group, { key: 'ArrowRight' });
      expect(within(group).getByRole('radio', { name: /^no$/i })).toHaveAttribute('aria-checked', 'true');
    });
  });

  describe('hourly hours field', () => {
    it('shows Hours per Week when an employment row is hourly', () => {
      render(<Wrapper defaultStreams={[{ ...employmentStream('wages'), incomeFrequency: 'hourly' }]} />);
      expect(screen.getByText(/hours per week/i)).toBeInTheDocument();
    });
  });
});
