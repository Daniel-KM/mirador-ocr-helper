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

const ColorWidget = ({
  textColor,
  bgColor,
  onChange,
  t,
  pageColors,
  useAutoColors,
  containerId,
}) => {
  const showResetButton =
    !useAutoColors &&
    pageColors &&
    pageColors.some((c) => c && (c.textColor || c.bgColor));

  return (
    <Root className="MuiPaper-elevation4">
      {showResetButton && (
        <MiradorMenuButton
          containerId={containerId}
          aria-label={t('resetTextColors')}
          onClick={() =>
            onChange({
              useAutoColors: true,
              textColor:
                pageColors.map((cs) => cs.textColor).filter(Boolean)[0] ?? textColor,
              bgColor:
                pageColors.map((cs) => cs.bgColor).filter(Boolean)[0] ?? bgColor,
            })
          }
        >
          <ResetColorsIcon />
        </MiradorMenuButton>
      )}
      <Single
        title={t('textColor')}
        autoColors={useAutoColors ? pageColors.map((cs) => cs.textColor) : undefined}
        color={textColor}
        onChange={(newColor) => {
          if (useAutoColors && newColor === toHexRgb(pageColors?.[0]?.textColor)) {
            return;
          }
          onChange({ textColor: newColor, bgColor, useAutoColors: false });
        }}
        showResetButton={showResetButton}
      />
      <Single
        title={t('backgroundColor')}
        autoColors={useAutoColors ? pageColors.map((cs) => cs.bgColor) : undefined}
        color={bgColor}
        onChange={(newColor) => {
          if (useAutoColors && newColor === toHexRgb(pageColors?.[0]?.bgColor)) {
            return;
          }
          onChange({ bgColor: newColor, textColor, useAutoColors: false });
        }}
        showResetButton={showResetButton}
      />
    </Root>
  );
};

ColorWidget.propTypes = {
  containerId: PropTypes.string.isRequired,
  textColor: PropTypes.string.isRequired,
  bgColor: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  t: PropTypes.func.isRequired,
  useAutoColors: PropTypes.bool.isRequired,
  pageColors: PropTypes.arrayOf(
    PropTypes.shape({
      textColor: PropTypes.string,
      bgColor: PropTypes.string,
    }),
  ).isRequired,
};

export default ColorWidget;
