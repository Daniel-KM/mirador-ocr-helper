import React from 'react';
import PropTypes from 'prop-types';
import Slider from '@mui/material/Slider';
import useMediaQuery from '@mui/material/useMediaQuery';
import { styled, useTheme } from '@mui/material/styles';
import { alpha as fade } from '@mui/material/styles';

const Root = styled('div')(({ theme }) => {
  const { palette, breakpoints } = theme;
  const bubbleBg = palette.shades?.main ?? palette.background.paper;
  return {
    backgroundColor: fade(bubbleBg, 0.8),
    borderRadius: '0 0 25px 25px',
    height: 150,
    padding: '16px 8px 24px 8px',
    position: 'absolute',
    top: 48,
    zIndex: 100,
    [breakpoints.down('sm')]: {
      top: 'auto',
      right: 48,
      height: 'auto',
      width: 150,
      borderRadius: '25px 0 0 25px',
      clipPath: 'inset(-8px 0 -8px -8px)',
      paddingTop: 12,
      paddingBottom: 2,
      paddingRight: 24,
    },
  };
});

function OpacityWidget({ opacity, onChange, t }) {
  const theme = useTheme();
  const isSmallDisplay = useMediaQuery(theme.breakpoints.down('sm'));
  return (
    <Root
      data-test-id="text-opacity-slider"
      id="text-opacity-slider"
      aria-labelledby="text-opacity-slider-label"
      className="MuiPaper-elevation4"
    >
      <Slider
        orientation={isSmallDisplay ? 'horizontal' : 'vertical'}
        min={1}
        max={100}
        value={opacity * 100}
        getAriaValueText={(value) => t('opacityCurrentValue', { value })}
        onChange={(evt, val) => onChange(val / 100.0)}
      />
    </Root>
  );
}
OpacityWidget.propTypes = {
  opacity: PropTypes.number.isRequired,
  onChange: PropTypes.func.isRequired,
  t: PropTypes.func.isRequired,
};

export default OpacityWidget;
