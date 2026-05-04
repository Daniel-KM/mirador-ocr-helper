/* eslint-disable jsx-a11y/label-has-associated-control */
import React from 'react';
import PropTypes from 'prop-types';
import { styled } from '@mui/material/styles';

import { toHexRgb } from '../../lib/color';

const Container = styled('label')({
  width: 48,
  height: 48,
  padding: 8,
  boxSizing: 'border-box',
});

const InputSwatch = styled('div', {
  shouldForwardProp: (p) => !['swatchColor', 'autoColors'].includes(p),
})(({ swatchColor, autoColors }) => {
  const validColors = (autoColors ?? []).filter((c) => c);
  const backgroundColor =
    validColors.length !== 2 ? (validColors?.[0] ?? swatchColor) : swatchColor;
  const backgroundImage =
    validColors.length !== 2
      ? 'none'
      : `linear-gradient(90deg, ${validColors[0] ?? swatchColor} 50%, ${
          validColors[1] ?? swatchColor
        } 50%)`;
  return {
    display: 'inline-block',
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor,
    backgroundImage,
  };
});

/** Input to select a color */
const ColorInput = ({ color, onChange, title, autoColors, className }) => {
  return (
    <Container className={className}>
      <InputSwatch
        title={title}
        className="MuiPaper-elevation2"
        swatchColor={color}
        autoColors={autoColors}
      />
      <input
        type="color"
        value={toHexRgb(autoColors && autoColors[0] ? autoColors[0] : color)}
        style={{
          position: 'absolute',
          width: 1,
          height: 1,
          padding: 0,
          margin: -1,
          overflow: 'hidden',
          clip: 'rect(0, 0, 0, 0)',
          whiteSpace: 'nowrap',
          borderWidth: 0,
        }}
        onChange={(evt) => onChange(evt.target.value)}
        onInput={(evt) => onChange(evt.target.value)}
      />
    </Container>
  );
}
ColorInput.propTypes = {
  className: PropTypes.string,
  color: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired,
  autoColors: PropTypes.arrayOf(PropTypes.string),
};
ColorInput.defaultProps = {
  autoColors: undefined,
  className: '',
};

export default ColorInput;
