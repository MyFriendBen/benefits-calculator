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
      <FormattedMessage
        id="householdDataBlock.leaveMember.title"
        defaultMessage="Your answers will be cleared"
      />
    </DialogTitle>
    <DialogContent>
      <Typography variant="body2">
        {/*
          Points at Continue, the only thing on this page that keeps the answers. Saying
          "without saving" would imply a Save action this page doesn't have.
        */}
        <FormattedMessage
          id="householdDataBlock.leaveMember.body"
          defaultMessage="Going to your household list will clear what you've entered for this person. Select 'Continue' first to keep it."
        />
      </Typography>
    </DialogContent>
    <DialogActions>
      {/* Going back is the safe default, so it gets the emphasis. */}
      <Button onClick={onConfirm} variant="outlined" size="small">
        <FormattedMessage id="householdDataBlock.leaveMember.confirm" defaultMessage="Clear and go to list" />
      </Button>
      <Button onClick={onCancel} variant="contained" size="small" autoFocus>
        <FormattedMessage id="householdDataBlock.leaveMember.cancel" defaultMessage="Go back" />
      </Button>
    </DialogActions>
  </Dialog>
);

export default LeaveMemberConfirmationDialog;
