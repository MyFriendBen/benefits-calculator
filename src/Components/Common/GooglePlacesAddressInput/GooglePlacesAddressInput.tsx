import { useRef, useState } from 'react';
import { Autocomplete, TextField } from '@mui/material';
import type { AutocompleteInputChangeReason } from '@mui/material';
import { fetchAddressSuggestions, type AddressSuggestion } from '../../EnergyCalculator/Results/HeatPumpJourney/fetchAddressSuggestions';

interface GooglePlacesAddressInputProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  error?: boolean;
  helperText?: React.ReactNode;
  placeholder?: string;
  inputProps?: Record<string, string>;
  fullWidth?: boolean;
}

export function GooglePlacesAddressInput({
  id,
  value,
  onChange,
  error,
  helperText,
  placeholder,
  inputProps,
  fullWidth,
}: GooglePlacesAddressInputProps) {
  const [options, setOptions] = useState<AddressSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestId = useRef(0);

  const handleInputChange = (e: React.SyntheticEvent, newValue: string) => {

    onChange(newValue);

    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    if (!newValue.trim()) {
      setOptions([]);
      return;
    }

    debounceTimer.current = setTimeout(() => {
      const currentId = ++requestId.current;
      setLoading(true);
      fetchAddressSuggestions(newValue)
        .then((results) => { if (requestId.current === currentId) setOptions(results); })
        .catch(() => { if (requestId.current === currentId) setOptions([]); })
        .finally(() => { if (requestId.current === currentId) setLoading(false); });
    }, 300);
  };

  const handleChange = (_: React.SyntheticEvent, selected: AddressSuggestion | string | null) => {
    if (typeof selected === 'string') {
      onChange(selected);
    } else if (selected) {
      onChange(selected.description);
    }
  };

  return (
    <Autocomplete
      id={id}
      freeSolo
      sx={{
        '& .MuiOutlinedInput-root': { marginBottom: "14px" }
      }}
      options={options}
      getOptionLabel={(option) => (typeof option === 'string' ? option : option.description)}
      filterOptions={(x) => x}
      loading={loading}
      inputValue={value}
      onInputChange={handleInputChange}
      onChange={handleChange}
      renderInput={(params) => (
        <TextField
          {...params}
          fullWidth={fullWidth}
          error={error}
          helperText={helperText}
          placeholder={placeholder}
          inputProps={{
            ...params.inputProps,
            ...inputProps,
          }}
        />
      )}
    />
  );
}
