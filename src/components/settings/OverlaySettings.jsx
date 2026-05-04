/* eslint-disable jsx-a11y/label-has-associated-control */
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { MiradorMenuButton, useTranslation } from 'mirador';
import CloseIcon from '@mui/icons-material/Close';
import SubjectIcon from '@mui/icons-material/Subject';
import OpacityIcon from '@mui/icons-material/Opacity';
import PaletteIcon from '@mui/icons-material/Palette';
import TextFieldsIcon from '@mui/icons-material/TextFields';
import TextSelectIcon from '../TextSelectIcon.jsx';
import CircularProgress from '@mui/material/CircularProgress';
import useMediaQuery from '@mui/material/useMediaQuery';
import { styled, useTheme, alpha } from '@mui/material/styles';

import ButtonContainer from './ButtonContainer.jsx';
import OpacityWidget from './OpacityWidget.jsx';
import ColorWidget from './ColorWidget.jsx';
import { DEFAULT_TEXT_COLOR, DEFAULT_BG_COLOR } from '../../state/selectors';

const BubbleContainer = styled('div', {
  shouldForwardProp: (p) =>
    !['imageToolsEnabled', 'open', 'showColorPicker', 'textsFetching'].includes(p),
})(({ theme, imageToolsEnabled, open, showColorPicker, textsFetching }) => {
  const { palette, breakpoints } = theme;
  const bubbleBg = palette.shades?.main ?? palette.background.paper;
  const bottomLeft = !textsFetching && open && showColorPicker ? 0 : 25;
  return {
    display: 'flex',
    flexDirection: 'row',
    backgroundColor: alpha(bubbleBg, 0.8),
    borderRadius: '25px',
    position: 'absolute',
    right: 8,
    top: imageToolsEnabled ? 66 : 8,
    zIndex: 999,
    [breakpoints.down('sm')]: {
      flexDirection: 'column',
      top: 8,
      right: imageToolsEnabled ? 66 : 8,
      borderRadius: `25px 25px 25px ${bottomLeft}px`,
    },
  };
});

/** Control text overlay settings  */
const OverlaySettings = ({
  containerId,
  imageToolsEnabled,
  windowTextOverlayOptions,
  textsAvailable,
  textsFetching,
  updateWindowTextOverlayOptions,
  pageColors
}) => {
  const { t } = useTranslation();
  const {
    enabled,
    visible,
    selectable,
    opacity,
    textColor: defaultTextColor,
    bgColor: defaultBgColor,
    useAutoColors,
    optionsRenderMode,
    bubbleVisible,
  } = windowTextOverlayOptions;
  const [open, setOpen] = useState(enabled && visible);
  const [showOpacitySlider, setShowOpacitySlider] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const theme = useTheme();
  const isSmallDisplay = useMediaQuery(theme.breakpoints.down('sm'));

  const { palette } = theme;
  const bubbleBg = palette.shades?.main ?? palette.background.paper;
  const bubbleC = palette.getContrastText(bubbleBg);
  const toggledBubbleBg = alpha(bubbleC, 0.25);

  const textColor = useAutoColors
    ? (pageColors.map((cs) => cs.textColor).filter(Boolean)[0] ?? defaultTextColor)
    : defaultTextColor;
  const bgColor = useAutoColors
    ? (pageColors.map((cs) => cs.bgColor).filter(Boolean)[0] ?? defaultBgColor)
    : defaultBgColor;

  const showAllButtons = open && !textsFetching;

  if (!enabled || !textsAvailable || !bubbleVisible) {
    return null;
  }

  const renderSimple = () => {
    return (
      <BubbleContainer
        className="MuiPaper-elevation4"
        imageToolsEnabled={imageToolsEnabled}
        open={open}
        showColorPicker={showColorPicker}
        textsFetching={textsFetching}
      >
        <ButtonContainer withBorder={!textsFetching && open && isSmallDisplay}>
          <MiradorMenuButton
            containerId={containerId}
            aria-label={t('textVisible')}
            onClick={() => {
              updateWindowTextOverlayOptions({
                ...windowTextOverlayOptions,
                visible: !visible,
              });
            }}
            disabled={textsFetching}
            aria-pressed={visible}
            style={{ backgroundColor: visible ? toggledBubbleBg : 'transparent' }}
          >
            <TextFieldsIcon />
          </MiradorMenuButton>
        </ButtonContainer>
      </BubbleContainer>
    );
  };

  const renderComplex = () => {
    /** Button for toggling the menu  */
    const toggleButton = (
      <ButtonContainer withBorder={!textsFetching && open && isSmallDisplay}>
        <MiradorMenuButton
          containerId={containerId}
          aria-expanded={showAllButtons}
          aria-haspopup
          aria-label={open ? t('collapseTextOverlayOptions') : t('expandTextOverlayOptions')}
          disabled={textsFetching}
          onClick={() => setOpen(!open)}
        >
          {showAllButtons ? <CloseIcon /> : <SubjectIcon />}
        </MiradorMenuButton>
      </ButtonContainer>
    );
    return (
      <BubbleContainer
        className="MuiPaper-elevation4"
        imageToolsEnabled={imageToolsEnabled}
        open={open}
        showColorPicker={showColorPicker}
        textsFetching={textsFetching}
      >
        {isSmallDisplay && toggleButton}
        {showAllButtons && (
          <>
            <ButtonContainer withBorder paddingPrev={isSmallDisplay ? 8 : 0} paddingNext={8}>
              <MiradorMenuButton
                containerId={containerId}
                aria-label={t('textVisible')}
                onClick={() => {
                  updateWindowTextOverlayOptions({
                    ...windowTextOverlayOptions,
                    visible: !visible,
                  });
                  if (showOpacitySlider && visible) {
                    setShowOpacitySlider(false);
                  }
                  if (showColorPicker && visible) {
                    setShowColorPicker(false);
                  }
                }}
                aria-pressed={visible}
                style={{ backgroundColor: visible ? toggledBubbleBg : 'transparent' }}
              >
                <TextFieldsIcon />
              </MiradorMenuButton>
            </ButtonContainer>
            <ButtonContainer>
              <MiradorMenuButton
                containerId={containerId}
                aria-label={t('overlayTextSelectable') || 'Allow text selection'}
                onClick={() => {
                  updateWindowTextOverlayOptions({
                    ...windowTextOverlayOptions,
                    selectable: !selectable,
                  });
                }}
                aria-pressed={!!selectable}
                style={{ backgroundColor: selectable && toggledBubbleBg }}
              >
                <TextSelectIcon />
              </MiradorMenuButton>
            </ButtonContainer>
            <ButtonContainer>
              <MiradorMenuButton
                id="text-opacity-slider-label"
                containerId={containerId}
                disabled={!visible}
                aria-label={t('overlayOpacity')}
                aria-controls="text-opacity-slider"
                aria-expanded={showOpacitySlider}
                onClick={() => setShowOpacitySlider(!showOpacitySlider)}
                style={{
                  backgroundColor: showOpacitySlider && alpha(bubbleC, 0.1),
                }}
              >
                <OpacityIcon />
              </MiradorMenuButton>
              {visible && showOpacitySlider && (
                <OpacityWidget
                  t={t}
                  opacity={opacity}
                  onChange={(newOpacity) =>
                    updateWindowTextOverlayOptions({
                      ...windowTextOverlayOptions,
                      opacity: newOpacity,
                    })
                  }
                />
              )}
            </ButtonContainer>
            <ButtonContainer withBorder={!isSmallDisplay} paddingNext={isSmallDisplay ? 0 : 8}>
              <MiradorMenuButton
                id="color-picker-label"
                containerId={containerId}
                disabled={!visible}
                aria-label={t('colorPicker')}
                aria-controls="color-picker"
                aria-expanded={showColorPicker}
                onClick={() => setShowColorPicker(!showColorPicker)}
                style={{
                  backgroundColor: showColorPicker && alpha(bubbleC, 0.1),
                }}
              >
                <PaletteIcon />
              </MiradorMenuButton>
              {visible && showColorPicker && (
                <ColorWidget
                  t={t}
                  containerId={containerId}
                  textColor={textColor}
                  bgColor={bgColor}
                  defaultTextColor={DEFAULT_TEXT_COLOR}
                  defaultBgColor={DEFAULT_BG_COLOR}
                  pageColors={pageColors}
                  useAutoColors={useAutoColors}
                  onChange={(newOpts) =>
                    updateWindowTextOverlayOptions({
                      ...windowTextOverlayOptions,
                      ...newOpts,
                    })
                  }
                />
              )}
            </ButtonContainer>
          </>
        )}
        {textsFetching && (
          <CircularProgress disableShrink size={50} style={{ position: 'absolute' }} />
        )}
        {!isSmallDisplay && toggleButton}
      </BubbleContainer>
    );
  };

  return optionsRenderMode === 'complex' ? renderComplex() : renderSimple();
};

OverlaySettings.propTypes = {
  containerId: PropTypes.string.isRequired,
  imageToolsEnabled: PropTypes.bool.isRequired,
  textsAvailable: PropTypes.bool.isRequired,
  textsFetching: PropTypes.bool.isRequired,
  updateWindowTextOverlayOptions: PropTypes.func.isRequired,
  // eslint-disable-next-line react/forbid-prop-types
  windowTextOverlayOptions: PropTypes.object.isRequired,
  pageColors: PropTypes.arrayOf(
    PropTypes.shape({
      textColor: PropTypes.string,
      bgColor: PropTypes.string,
    })
  ).isRequired,
};

export default OverlaySettings;
