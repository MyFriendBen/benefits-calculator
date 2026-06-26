import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IntlProvider } from 'react-intl';
import { useForm } from 'react-hook-form';
import BasicInfoSection from './BasicInfoSection';

// Wrap the section in a test component so it gets a real RHF control
const Wrapper = ({
  isFirstMember = false,
  showSectionHeader = true,
  errors = {},
  relationshipOptions = { spouse: 'Spouse', child: 'Child', parent: 'Parent' },
}: {
  isFirstMember?: boolean;
  showSectionHeader?: boolean;
  errors?: Record<string, any>;
  relationshipOptions?: Record<string, any>;
}) => {
  const { control } = useForm({
    defaultValues: { birthMonth: 0, birthYear: '', relationshipToHH: '' },
  });

  return (
    <IntlProvider locale="en" messages={{}}>
      <BasicInfoSection
        control={control as any}
        errors={errors}
        isFirstMember={isFirstMember}
        relationshipOptions={relationshipOptions}
        showSectionHeader={showSectionHeader}
      />
    </IntlProvider>
  );
};

describe('BasicInfoSection', () => {
  describe('section header', () => {
    it('renders section heading when showSectionHeader is true', () => {
      render(<Wrapper showSectionHeader={true} />);
      expect(screen.getByText('Basic Information')).toBeInTheDocument();
    });

    it('does not render section heading when showSectionHeader is false', () => {
      render(<Wrapper showSectionHeader={false} />);
      expect(screen.queryByText('Basic Information')).not.toBeInTheDocument();
    });
  });

  describe('birth month field', () => {
    it('renders birth month label', () => {
      render(<Wrapper />);
      // MUI renders the label text in both a <label> and a <span> — use getAllByText
      expect(screen.getAllByText('Birth Month').length).toBeGreaterThan(0);
    });

    it('renders a select control for birth month accessible by role and name', () => {
      render(<Wrapper />);
      // Playwright E2E uses getByRole('button', { name: 'Birth Month' }) — verify this works
      expect(screen.getByRole('button', { name: /birth month/i })).toBeInTheDocument();
    });

    it('renders month options with numeric values', () => {
      render(<Wrapper />);
      userEvent.click(screen.getByRole('button', { name: /birth month/i }));
      const januaryOption = screen.getByRole('option', { name: 'January' });
      expect(januaryOption).toHaveAttribute('data-value', '1');
    });

    it('shows birth month error message when error is present', () => {
      const errors = { birthMonth: { message: 'Please enter a birth month.' } };
      render(<Wrapper errors={errors} />);
      expect(screen.getByText('Please enter a birth month.')).toBeInTheDocument();
    });
  });

  describe('birth year field', () => {
    it('renders birth year text field', () => {
      render(<Wrapper />);
      expect(screen.getByLabelText(/birth year/i)).toBeInTheDocument();
    });

    it('shows birth year error message when error is present', () => {
      const errors = { birthYear: { message: 'Please enter a birth year.' } };
      render(<Wrapper errors={errors} />);
      expect(screen.getByText('Please enter a birth year.')).toBeInTheDocument();
    });

    it('has numeric input mode', () => {
      render(<Wrapper />);
      const input = screen.getByLabelText(/birth year/i);
      expect(input).toHaveAttribute('inputmode', 'numeric');
    });
  });

  describe('relationship dropdown', () => {
    it('hides relationship dropdown for first member', () => {
      render(<Wrapper isFirstMember={true} />);
      expect(screen.queryByText(/relationship to you/i)).not.toBeInTheDocument();
    });

    it('shows relationship dropdown for non-first members', () => {
      render(<Wrapper isFirstMember={false} />);
      expect(screen.getAllByText(/relationship to you/i).length).toBeGreaterThan(0);
    });

    it('renders a select control for relationship', () => {
      render(<Wrapper isFirstMember={false} />);
      // MUI Select renders 2 comboboxes (month + relationship); both have aria-haspopup=listbox
      const selects = screen.getAllByRole('button').filter(el => el.getAttribute('aria-haspopup') === 'listbox');
      expect(selects).toHaveLength(2);
    });

    it('shows relationship error message when error is present', () => {
      const errors = { relationshipToHH: { message: 'Please select a relationship.' } };
      render(<Wrapper isFirstMember={false} errors={errors} />);
      expect(screen.getByText('Please select a relationship.')).toBeInTheDocument();
    });

    it('does not show relationship error for first member even if error exists', () => {
      // The field is hidden, so error can't show
      const errors = { relationshipToHH: { message: 'Please select a relationship.' } };
      render(<Wrapper isFirstMember={true} errors={errors} />);
      expect(screen.queryByText('Please select a relationship.')).not.toBeInTheDocument();
    });
  });

  describe('section id for scroll-to-error', () => {
    it('renders with id="basic-info-section" for scroll targeting', () => {
      const { container } = render(<Wrapper showSectionHeader={true} />);
      expect(container.querySelector('#basic-info-section')).toBeInTheDocument();
    });
  });

  describe('empty relationship options', () => {
    it('renders without crashing when relationshipOptions is empty', () => {
      render(<Wrapper isFirstMember={false} relationshipOptions={{}} />);
      expect(screen.getAllByText(/relationship to you/i).length).toBeGreaterThan(0);
    });
  });
});
