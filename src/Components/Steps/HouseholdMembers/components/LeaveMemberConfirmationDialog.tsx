import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from '@mui/material';
import { FormattedMessage } from 'react-intl';

type LeaveMemberConfirmationDialogProps = {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

/**
 * Warns before leaving a member's page for the household roster. The member is only saved by
 * Continue, so navigating away with answers on screen discards them — this is shown only when
 * the form is dirty, so an untouched page still goes straight through.
 */
const LeaveMemberConfirmationDialog = ({ open, onCancel, onConfirm }: LeaveMemberConfirmationDialogProps) => (
  <Dialog open={open} onClose={onCancel} disableScrollLock maxWidth="xs">
    <DialogTitle>
      <FormattedMessage id="householdDataBlock.leaveMember.title" defaultMessage="Leave without saving?" />
    </DialogTitle>
    <DialogContent>
      <Typography variant="body2">
        <FormattedMessage
          id="householdDataBlock.leaveMember.body"
          defaultMessage="Your answers on this page haven't been saved yet. If you go to your household list now, you'll lose them."
        />
      </Typography>
    </DialogContent>
    <DialogActions>
      {/* Staying is the safe default, so it gets the emphasis. */}
      <Button onClick={onConfirm} variant="outlined" size="small">
        <FormattedMessage id="householdDataBlock.leaveMember.confirm" defaultMessage="Leave anyway" />
      </Button>
      <Button onClick={onCancel} variant="contained" size="small" autoFocus>
        <FormattedMessage id="householdDataBlock.leaveMember.cancel" defaultMessage="Stay on this page" />
      </Button>
    </DialogActions>
  </Dialog>
);

export default LeaveMemberConfirmationDialog;
