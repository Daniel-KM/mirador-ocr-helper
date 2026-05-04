import React from 'react';
import PropTypes from 'prop-types';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import SubjectIcon from '@mui/icons-material/Subject';
import { useTranslation } from 'mirador';

const OcrHelperMenuItem = ({
  bubbleVisible = false,
  handleClose,
  textsAvailable = false,
  updateWindowTextOverlayOptions,
}) => {
  const { t } = useTranslation();

  const handleClick = () => {
    handleClose();
    const next = !bubbleVisible;
    // Mirror `enabled` so neighbouring plugins (e.g. mirador-rotation) that
    // peek at cfg.textOverlay.enabled can stack their bubble below ours.
    updateWindowTextOverlayOptions({ bubbleVisible: next, enabled: next });
  };

  return (
    <MenuItem disabled={!textsAvailable} onClick={handleClick}>
      <ListItemIcon>
        <SubjectIcon />
      </ListItemIcon>
      <ListItemText>
        {bubbleVisible ? t('ocrHelperHideOverlay') : t('ocrHelperShowOverlay')}
      </ListItemText>
    </MenuItem>
  );
};

OcrHelperMenuItem.propTypes = {
  bubbleVisible: PropTypes.bool,
  handleClose: PropTypes.func.isRequired,
  textsAvailable: PropTypes.bool,
  updateWindowTextOverlayOptions: PropTypes.func.isRequired,
};

export default OcrHelperMenuItem;
