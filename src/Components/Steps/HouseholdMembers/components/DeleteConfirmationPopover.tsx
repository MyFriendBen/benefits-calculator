import { Box, Button, Popover, Typography } from '@mui/material';
import { FormattedMessage } from 'react-intl';
import type { DeletePopoverState } from '../utils/types';
import '../styles/popover.css';

type DeleteConfirmationPopoverProps = {
  deletePopover: DeletePopoverState;
  isDeleting: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

const DeleteConfirmationPopover = ({ deletePopover, isDeleting, onClose, onConfirm }: DeleteConfirmationPopoverProps) => (
  <Popover
    open={deletePopover !== null}
    anchorEl={deletePopover?.anchorEl}
    onClose={onClose}
    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
    transformOrigin={{ vertical: 'top', horizontal: 'right' }}
  >
    <Box className="household-basic-info-page__delete-popover">
      <Typography variant="body2">
        <FormattedMessage id="householdDataBlock.basicInfo.deleteConfirm" defaultMessage="Remove this member?" />
      </Typography>
      <Box className="household-basic-info-page__delete-popover-actions">
        <Button size="small" variant="outlined" onClick={onClose}>
          <FormattedMessage id="householdDataBlock.basicInfo.deleteCancel" defaultMessage="Cancel" />
        </Button>
        <Button size="small" color="error" variant="contained" onClick={onConfirm} disabled={isDeleting}>
          <FormattedMessage id="householdDataBlock.basicInfo.deleteConfirmButton" defaultMessage="Remove" />
        </Button>
      </Box>
    </Box>
  </Popover>
);

export default DeleteConfirmationPopover;
