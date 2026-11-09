import React from 'react';
import PropTypes from 'prop-types';
import ChromeReaderModeIcon from '@mui/icons-material/ChromeReaderMode';
import { MiradorMenuButton, useTranslation } from 'mirador';

/** Button of the window top bar to show or hide the OCR panel. */
const OcrPanelToggle = ({
  textsAvailable = false,
  updateWindowTextOverlayOptions,
  windowTextOverlayOptions = {},
}) => {
  const { t } = useTranslation();
  if (!textsAvailable) return null;
  const panelVisible = windowTextOverlayOptions.panelVisible !== false;
  return (
    <MiradorMenuButton
      aria-label={t('panelVisible')}
      aria-pressed={panelVisible}
      color={panelVisible ? 'primary' : 'default'}
      onClick={() => updateWindowTextOverlayOptions({
        ...windowTextOverlayOptions,
        panelVisible: !panelVisible,
      })}
    >
      <ChromeReaderModeIcon />
    </MiradorMenuButton>
  );
};

OcrPanelToggle.propTypes = {
  textsAvailable: PropTypes.bool,
  updateWindowTextOverlayOptions: PropTypes.func.isRequired,
  // eslint-disable-next-line react/forbid-prop-types
  windowTextOverlayOptions: PropTypes.object,
};

export default OcrPanelToggle;
