import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { ReactNode, useContext } from 'react';
import { Context } from '../Wrapper/Wrapper';
import { FormattedMessageType } from '../../Types/Questions';
import { Checkbox, FormControlLabel } from '@mui/material';
import './CheckboxAccordion.css';

type Option<T extends string | number> = {
  value: T;
  text: ReactNode;
};

type Props<T extends string | number> = {
  name: FormattedMessageType;
  options: Option<T>[];
  expanded: boolean;
  onExpand: (isExpanded: boolean) => void;
  values: Record<T, boolean>;
  onChange: (values: Record<T, boolean>) => void;
};

function CheckBoxAccordion<T extends string | number>({
  name,
  options,
  onExpand,
  expanded,
  values,
  onChange,
}: Props<T>) {
  const { theme } = useContext(Context);

  return (
    <Accordion
      expanded={expanded}
      onChange={(_, isExpanded) => {
        onExpand(isExpanded);
      }}
      sx={{ marginBottom: '.25rem' }}
      className="checkbox-accordion-container"
    >
      <AccordionSummary
        expandIcon={<ExpandMoreIcon style={{ color: '#ffffff', height: '28.8' }} />}
        aria-controls="panel1a-content"
        id="panel1a-header"
        sx={{ backgroundColor: theme.primaryColor }}
      >
        <span className="checkbox-accordion-title">{name}</span>
      </AccordionSummary>
      <AccordionDetails>
        {options.map((option, index) => {
          const onCheckboxChange = () => {
            let newValue: Record<T, boolean> = { ...values };

            newValue[option.value] = !newValue[option.value];

            onChange(newValue);
          };

          return (
            <div key={index}>
              <FormControlLabel
                sx={{ alignItems: 'flex-start', marginTop: index === 0 ? '0.5rem' : '0.75rem', marginBottom: 0 }}
                control={<Checkbox checked={values[option.value]} onChange={onCheckboxChange} sx={{ paddingTop: '4px' }} />}
                label={option.text}
              />
            </div>
          );
        })}
      </AccordionDetails>
    </Accordion>
  );
}

export default CheckBoxAccordion;
