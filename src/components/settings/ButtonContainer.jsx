import React from 'react';
import PropTypes from 'prop-types';
import { styled } from '@mui/material/styles';
import { alpha as fade } from '@mui/material/styles';

const Root = styled('div', {
  shouldForwardProp: (p) => !['withBorder', 'paddingPrev', 'paddingNext'].includes(p),
})(({ theme, withBorder, paddingPrev, paddingNext }) => {
  const { palette, breakpoints } = theme;
  const bubbleBg = palette.shades?.main ?? palette.background.paper;
  const bubbleFg = palette.getContrastText(bubbleBg);
  const borderImgRight =
    `linear-gradient(to bottom, ${fade(bubbleFg, 0)} 20%, ` +
    `${fade(bubbleFg, 0.2)} 20% 80%, ${fade(bubbleFg, 0)} 80%)`;
  const borderImgBottom = borderImgRight.replace('to bottom', 'to right');
  return {
    display: 'flex',
    padding: `0 ${paddingNext ?? 0}px 0 ${paddingPrev ?? 0}px`,
    borderRight: withBorder ? `1px solid ${fade(bubbleFg, 0.2)}` : 'none',
    borderImageSlice: withBorder ? 1 : 'unset',
    borderImageSource: borderImgRight,
    flexDirection: 'column',
    [breakpoints.down('sm')]: {
      flexDirection: 'row',
      borderRight: 'none',
      borderBottom: withBorder ? `1px solid ${fade(bubbleFg, 0.2)}` : 'none',
      borderImageSource: borderImgBottom,
      padding: `${paddingPrev ?? 0}px 0 ${paddingNext ?? 0}px 0`,
    },
  };
});

const ButtonContainer = ({ children, withBorder, paddingPrev, paddingNext }) => (
  <Root withBorder={withBorder} paddingPrev={paddingPrev} paddingNext={paddingNext}>
    {children}
  </Root>
);
ButtonContainer.propTypes = {
  children: PropTypes.node.isRequired,
  withBorder: PropTypes.bool,
  paddingNext: PropTypes.number,
  paddingPrev: PropTypes.number,
};
ButtonContainer.defaultProps = {
  withBorder: false,
  paddingNext: undefined,
  paddingPrev: undefined,
};

export default ButtonContainer;
