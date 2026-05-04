import React from 'react';
import PropTypes from 'prop-types';
import { MiradorMenuButton } from 'mirador';
import ResetColorsIcon from '@mui/icons-material/SettingsBackupRestore';
import { styled, alpha as fade } from '@mui/material/styles';

import ColorInput from './ColorInput.jsx';
import { toHexRgb } from '../../lib/color';

const Root = styled('div')(({ theme }) => {
  const { palette, breakpoints } = theme;
  const bubbleBg = palette.shades?.main ?? palette.background.paper;
  return {
    display: 'flex',
    flexDirection: 'column',
    position: 'absolute',
    top: 48,
    zIndex: 100,
    borderRadius: '0 0 25px 25px',
    backgroundColor: fade(bubbleBg, 0.8),
    [breakpoints.down('sm')]: {
      flexDirection: 'row',
      right: 48,
      top: 'auto',
      borderRadius: '25px 0 0 25px',
      clipPath: 'inset(-8px 0 -8px -8px)',
    },
  };
});

const Single = styled(ColorInput, {
  shouldForwardProp: (p) => p !== 'showResetButton',
})(({ theme, showResetButton }) => ({
  height: 40,
  padding: '8px',
  margin: `${showResetButton ? 0 : 12}px 0 0 0`,
  [theme.breakpoints.down('sm')]: {
    height: 48,
    width: 40,
    padding: '8px',
    marginTop: 0,
    margin: `0 0 0 ${showResetButton ? 0 : 12}px`,
  },
}));

const ColorWidget = ({ color, onChange, t, pageColors, useAutoColors, containerId }) => {
  const showResetButton =
    !useAutoColors && pageColors && pageColors.some((c) => c && c.color);

  return (
    <Root className="MuiPaper-elevation4">
      {showResetButton && (
        <MiradorMenuButton
          containerId={containerId}
          aria-label={t('resetColor')}
          onClick={() =>
            onChange({
              useAutoColors: true,
              color: pageColors.map((cs) => cs.color).filter((x) => x)[0] ?? color,
            })
          }
        >
          <ResetColorsIcon />
        </MiradorMenuButton>
      )}
      <Single
        title={t('color')}
        autoColors={useAutoColors ? pageColors.map((colors) => colors.color) : undefined}
        color={color}
        onChange={(newColor) => {
          if (useAutoColors && newColor === toHexRgb(pageColors?.[0]?.color)) {
            return;
          }
          onChange({ color: newColor, useAutoColors: false });
        }}
        showResetButton={showResetButton}
      />
    </Root>
  );
};

ColorWidget.propTypes = {
  containerId: PropTypes.string.isRequired,
  color: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  t: PropTypes.func.isRequired,
  useAutoColors: PropTypes.bool.isRequired,
  pageColors: PropTypes.arrayOf(
    PropTypes.shape({
      color: PropTypes.string,
    }),
  ).isRequired,
};

export default ColorWidget;
