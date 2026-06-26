import { render, screen, fireEvent } from '@testing-library/react';
import MultiSelectTiles from './MultiSelectTiles';

const options = [
  { value: 'none' as const, text: <span>None</span>, icon: null },
  { value: 'employer' as const, text: <span>Employer</span>, icon: null },
  { value: 'medicaid' as const, text: <span>Medicaid</span>, icon: null },
];

type TestKey = 'none' | 'employer' | 'medicaid';

const emptyValues: Partial<Record<TestKey, boolean>> = {
  none: false,
  employer: false,
  medicaid: false,
};

describe('MultiSelectTiles', () => {
  describe('Rendering', () => {
    it('renders all options', () => {
      render(<MultiSelectTiles options={options} values={emptyValues} onChange={jest.fn()} />);
      expect(screen.getByText('None')).toBeInTheDocument();
      expect(screen.getByText('Employer')).toBeInTheDocument();
      expect(screen.getByText('Medicaid')).toBeInTheDocument();
    });

    it('applies selected style to currently selected values', () => {
      render(
        <MultiSelectTiles
          options={options}
          values={{ ...emptyValues, employer: true }}
          onChange={jest.fn()}
        />,
      );
      expect(screen.getByText('Employer').closest('.option-card')).toHaveClass('option-card--selected');
      expect(screen.getByText('Medicaid').closest('.option-card')).not.toHaveClass('option-card--selected');
    });
  });

  describe('Selection behavior', () => {
    it('calls onChange with the clicked value toggled on', () => {
      const onChange = jest.fn();
      render(<MultiSelectTiles options={options} values={emptyValues} onChange={onChange} />);

      fireEvent.click(screen.getByText('Employer'));

      expect(onChange).toHaveBeenCalledWith({ none: false, employer: true, medicaid: false });
    });

    it('calls onChange with the clicked value toggled off when already selected', () => {
      const onChange = jest.fn();
      render(
        <MultiSelectTiles
          options={options}
          values={{ ...emptyValues, employer: true }}
          onChange={onChange}
        />,
      );

      fireEvent.click(screen.getByText('Employer'));

      expect(onChange).toHaveBeenCalledWith({ none: false, employer: false, medicaid: false });
    });

    it('allows multiple non-exclusive values to be selected together', () => {
      const onChange = jest.fn();
      render(
        <MultiSelectTiles
          options={options}
          values={{ ...emptyValues, employer: true }}
          onChange={onChange}
          exclusiveValues={['none']}
        />,
      );

      fireEvent.click(screen.getByText('Medicaid'));

      expect(onChange).toHaveBeenCalledWith({ none: false, employer: true, medicaid: true });
    });
  });

  describe('Exclusive values', () => {
    it('deselects all other values when an exclusive value is selected', () => {
      const onChange = jest.fn();
      render(
        <MultiSelectTiles
          options={options}
          values={{ ...emptyValues, employer: true, medicaid: true }}
          onChange={onChange}
          exclusiveValues={['none']}
        />,
      );

      fireEvent.click(screen.getByText('None'));

      expect(onChange).toHaveBeenCalledWith({ none: true, employer: false, medicaid: false });
    });

    it('deselects exclusive value when a non-exclusive value is selected', () => {
      const onChange = jest.fn();
      render(
        <MultiSelectTiles
          options={options}
          values={{ ...emptyValues, none: true }}
          onChange={onChange}
          exclusiveValues={['none']}
        />,
      );

      fireEvent.click(screen.getByText('Employer'));

      expect(onChange).toHaveBeenCalledWith({ none: false, employer: true, medicaid: false });
    });
  });
});
