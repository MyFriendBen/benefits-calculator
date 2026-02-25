import { TextField } from '@mui/material';
import { PatternFormat } from 'react-number-format';
import { RefCallBack } from 'react-hook-form';

type PhoneNumberInputProps = {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  inputRef?: RefCallBack;
  name?: string;
  label?: React.ReactNode;
  error?: boolean;
  helperText?: React.ReactNode;
  sx?: object;
  onAfterChange?: (value: string) => void;
};

const PhoneNumberInput = ({ value, onChange, onBlur, inputRef, name, label, error, helperText, sx, onAfterChange }: PhoneNumberInputProps) => {
  return (
    <PatternFormat
      value={value}
      onValueChange={({ value }) => {
        onChange(value);
        onAfterChange?.(value);
      }}
      getInputRef={inputRef}
      name={name}
      onBlur={onBlur}
      format="(###) ###-####"
      mask="_"
      customInput={TextField}
      label={label}
      variant="outlined"
      inputProps={{ inputMode: 'numeric' }}
      error={error}
      helperText={helperText}
      sx={sx}
    />
  );
};

export default PhoneNumberInput;
