import { useRef, useEffect } from 'react';
import { TextField } from '@mui/material';
import { LoadScript } from '@react-google-maps/api';

const LIBRARIES: ('places')[] = ['places'];

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

function PlainTextField({ id, value, onChange, error, helperText, placeholder, inputProps, fullWidth }: GooglePlacesAddressInputProps) {
  return (
    <TextField
      fullWidth={fullWidth}
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      error={error}
      helperText={helperText}
      placeholder={placeholder}
      inputProps={inputProps}
    />
  );
}

function AutocompleteTextField({ id, value, onChange, error, helperText, placeholder, inputProps, fullWidth }: GooglePlacesAddressInputProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  });

  useEffect(() => {
    if (!inputRef.current || typeof window.google === 'undefined') return;

    const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
      types: ['address'],
      componentRestrictions: { country: 'us' },
    });

    const listener = autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();
      if (place?.formatted_address) {
        onChangeRef.current(place.formatted_address);
      }
    });

    return () => {
      window.google.maps.event.removeListener(listener);
    };
  }, []);

  return (
    <TextField
      fullWidth={fullWidth}
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      error={error}
      helperText={helperText}
      placeholder={placeholder}
      inputProps={inputProps}
      inputRef={inputRef}
    />
  );
}

export function GooglePlacesAddressInput(props: GooglePlacesAddressInputProps) {
  const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return <PlainTextField {...props} />;
  }

  return (
    <LoadScript googleMapsApiKey={apiKey} libraries={LIBRARIES} loadingElement={<PlainTextField {...props} />}>
      <AutocompleteTextField {...props} />
    </LoadScript>
  );
}
