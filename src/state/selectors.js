import { createSelector } from 'reselect';

import {
  getWindowConfig,
  getVisibleCanvases,
  getTheme,
} from 'mirador';
import { miradorSlice } from 'mirador';

const defaultConfig = {
  // Enable the text selection and display feature
  enabled: true,
  // Default opacity of text overlay (0 = hidden by default; the OCR helper
  // panel can still highlight individual line rects regardless).
  opacity: 0,
  // Overlay text overlay by default
  visible: true,
  // Whether the text overlay is selectable (allows the user to copy text). Off
  // by default; toggled from the OverlaySettings bubble.
  selectable: false,
  // Try to automatically determine the text and background color
  useAutoColors: false,
  // Color of rendered text, used as a fallback if auto-detection is enabled and
  // fails
  textColor: '#000000',
  // Color of line background / highlight rect, used as a fallback if
  // auto-detection is enabled and fails
  bgColor: '#00FF7B',
  // Skip empty lines
  skipEmptyLines: true,
  // If enabled, the user can submit corrections to the text via email
  correction: {
    enabled: false,
    emailRecipient: null,
    emailUrlKeepParams: [],
  },
  // Render mode for text overlay options
  optionsRenderMode: 'complex',
  // Whether the floating OverlaySettings bubble (Tt, I, opacity, palette,
  // collapse) is rendered on top of the OpenSeadragon viewer. Toggled from the
  // WindowTopBarPluginMenu entry.
  bubbleVisible: false,
  // Whether the side OCR panel (right column listing the OCR lines) is
  // rendered. Toggled from the WindowTopBarPluginMenu entry.
  panelVisible: true,
};

/** Selector to get text display options for a given window */
export const getWindowTextOverlayOptions = createSelector(
  [getWindowConfig, getTheme],
  ({ textOverlay }, { typography: { fontFamily } }) => ({
    fontFamily,
    ...defaultConfig,
    ...(textOverlay ?? {}),
  })
);

/** Selector to get all loaded texts */
export const getTexts = (state) => miradorSlice(state).texts;

/** Selector for text on all visible canvases */
export const getTextsForVisibleCanvases = createSelector(
  [getVisibleCanvases, getTexts],
  (canvases, allTexts) => {
    if (!allTexts || !canvases) return [];
    const texts = canvases.map((canvas) => allTexts[canvas.id]);
    if (texts.every((t) => t === undefined)) {
      return [];
    }
    return texts;
  }
);
