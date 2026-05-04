import { createSelector } from 'reselect';

import {
  getWindowConfig,
  getVisibleCanvases,
  getTheme,
} from 'mirador';
import { miradorSlice } from 'mirador';

export const DEFAULT_TEXT_COLOR = '#000000';
export const DEFAULT_BG_COLOR = '#00FF7B';

const defaultConfig = {
  // Enable the text selection and display feature
  enabled: true,
  // Default opacity of text overlay (0 = hidden by default; the OCR helper
  // panel can still highlight individual line rects regardless).
  opacity: 0,
  // Text overlay on the image is off by default: the side panel covers the
  // OCR-reading use case without the cost of painting/laying out hundreds of
  // <text>/<rect> nodes per page. The Tt bubble button (or raising opacity)
  // enables it on demand.
  visible: false,
  // Whether the text overlay is selectable (allows the user to copy text). Off
  // by default; toggled from the OverlaySettings bubble.
  selectable: false,
  // Try to automatically determine the text and background color
  useAutoColors: false,
  // Color of rendered text, used as a fallback if auto-detection is enabled and
  // fails
  textColor: DEFAULT_TEXT_COLOR,
  // Color of line background / highlight rect, used as a fallback if
  // auto-detection is enabled and fails
  bgColor: DEFAULT_BG_COLOR,
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
  // Scroll animation when the side OCR panel jumps to a highlighted line.
  // Accepts the native scrollIntoView() behavior values: 'smooth' (default),
  // 'instant' (no animation), or 'auto' (defer to the user agent / parent
  // CSS). Surface this in the Mirador config to swap to 'instant' on dense
  // manifests where the ~300ms animation feels sluggish.
  panelScrollBehavior: 'smooth',
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
