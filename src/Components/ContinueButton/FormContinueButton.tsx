import { Button, ButtonProps, CircularProgress } from '@mui/material';
import { PropsWithChildren, useContext } from 'react';
import { FormattedMessage } from 'react-intl';
import { Context } from '../Wrapper/Wrapper';

type FormContinueButtonProps = PropsWithChildren<{
  variant?: ButtonProps['variant'];
  endIcon?: ButtonProps['endIcon'];
  disabled?: boolean;
}>;

const FormContinueButton = ({ children, variant = 'contained', endIcon, disabled }: FormContinueButtonProps) => {
  const { stepLoading } = useContext(Context);
  return (
    <Button variant={variant} type="submit" endIcon={endIcon} disabled={disabled || stepLoading}>
      {stepLoading && <CircularProgress size="1rem" color="inherit" sx={{ position: 'absolute' }} />}
      <span
        style={{
          visibility: stepLoading ? 'hidden' : 'visible',
        }}
      >
        {children ?? <FormattedMessage id="continueButton" defaultMessage="Continue" />}
      </span>
    </Button>
  );
};

export default FormContinueButton;
