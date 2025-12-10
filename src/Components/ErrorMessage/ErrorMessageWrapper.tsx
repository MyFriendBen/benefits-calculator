import { PropsWithChildren } from 'react';
import ErrorIcon from '@mui/icons-material/Error';
import './ErrorMessageWrapper.css';

type Props = PropsWithChildren<{
  fontSize: string;
}>;

export default function ErrorMessageWrapper({ children, fontSize }: Props) {
  return (
    <span className="error-helper-text">
      <ErrorIcon sx={{ fontSize: fontSize, mr: '3px', mt: '0.1em' }} />
      <span className="error-message" style={{ fontSize: fontSize }}>{children}</span>
    </span>
  );
}
