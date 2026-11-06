import { Box, Button, Dialog, Typography } from '@mui/material';
import { FormattedMessage } from 'react-intl';
import '../styles/popover.css';

type LeaveMemberConfirmationDialogProps = {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

/**
 * Warns before leaving a member's page for the household roster. The member is only saved by
 * Continue, so navigating away with answers on screen discards them — this is shown only when
 * the form is dirty, so an untouched page still goes straight through.
 *
 * Deliberately matches DeleteConfirmationPopover: one line and two buttons, no title.
 */
const LeaveMemberConfirmationDialog = ({ open, onCancel, onConfirm }: LeaveMemberConfirmationDialogProps) => (
  <Dialog open={open} onClose={onCancel} disableScrollLock maxWidth="xs">
    <Box className="household-basic-info-page__delete-popover">
      <Typography variant="body2">
        <FormattedMessage
          id="householdDataBlock.leaveMember.confirm"
          defaultMessage="Changes on this page will be lost."
        />
      </Typography>
      <Box className="household-basic-info-page__delete-popover-actions">
        {/* Cancel keeps the answers, so it's the emphasized default. */}
        <Button size="small" variant="outlined" onClick={onConfirm}>
          <FormattedMessage id="householdDataBlock.leaveMember.leave" defaultMessage="Leave" />
        </Button>
        <Button size="small" variant="contained" onClick={onCancel} autoFocus>
          <FormattedMessage id="householdDataBlock.basicInfo.deleteCancel" defaultMessage="Cancel" />
        </Button>
      </Box>
    </Box>
  </Dialog>
);

export default LeaveMemberConfirmationDialog;
