import { PropsWithChildren } from 'react';
import ErrorIcon from '@mui/icons-material/Error';
import './ErrorMessageWrapper.css';

type Props = PropsWithChildren<{
  fontSize?: string;
}>;

export default function ErrorMessageWrapper({ children, fontSize = '0.75rem' }: Props) {
  return (
    <span className="error-helper-text" style={{ fontSize }}>
      <ErrorIcon sx={{ fontSize: fontSize, mr: '5px', mt: '.2em' }} />
      <span className="error-message" style={{ fontSize: fontSize }}>{children}</span>
    </span>
  );
}
