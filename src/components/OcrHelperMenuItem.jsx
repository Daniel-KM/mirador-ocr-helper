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
  windowTextOverlayOptions = {},
}) => {
  const { t } = useTranslation();

  const handleClick = () => {
    handleClose();
    const next = !bubbleVisible;
    // Merge with the current overlay options so we don't clobber unrelated
    // keys (visible/opacity/selectable/…). Mirror `enabled` so neighbouring
    // plugins (e.g. mirador-rotation) that peek at cfg.textOverlay.enabled
    // can stack their bubble below ours.
    updateWindowTextOverlayOptions({
      ...windowTextOverlayOptions,
      bubbleVisible: next,
      enabled: next,
    });
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
  // eslint-disable-next-line react/forbid-prop-types
  windowTextOverlayOptions: PropTypes.object,
};

export default OcrHelperMenuItem;
