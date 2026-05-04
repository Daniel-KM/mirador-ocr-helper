import { setCanvas, updateWindow } from 'mirador';
import {
  getCanvasIndex,
  getCurrentCanvas,
  getManifestTitle,
  getManifestMetadata,
} from 'mirador';

import { textsReducer } from './state/reducers';
import { highlightLine } from './state/actions';
import textSaga from './state/sagas';
import { getTextsForVisibleCanvases, getWindowTextOverlayOptions } from './state/selectors';
import MiradorTextOverlay from './components/MiradorTextOverlay.jsx';
import MiradorOcrWindowViewer from './components/MiradorOcrWindowViewer.jsx';
import OverlaySettings from './components/settings/OverlaySettings.jsx';
// This plugin is fully self-contained: it ships its own OverlaySettings bubble
// (visibility / text selection / opacity / palette / collapse) on the
// `OpenSeadragonViewer` target so it does not depend on mirador-textoverlay.
// When both plugins are loaded together, two bubbles will stack — pick one.

export default [
  {
    component: MiradorOcrWindowViewer,
    target: 'WindowViewer',
    mode: 'wrap',
    mapDispatchToProps: (dispatch, { windowId }) => ({
      doHighlightLine: (canvasId, line, initiator) =>
        dispatch(highlightLine(canvasId, line, initiator)),
      doSetCanvas: (canvasId) => dispatch(setCanvas(windowId, canvasId)),
    }),
    mapStateToProps: (state, { id, manifestId, windowId }) => ({
      pageTexts: getTextsForVisibleCanvases(state, { windowId }).map((canvasText) => {
        if (canvasText === undefined || canvasText.isFetching) {
          return undefined;
        }
        return {
          ...canvasText.text,
          canvasId: canvasText.canvasId,
          source: canvasText.source,
          color: canvasText.color,
        };
      }),
      manifestMetadata: getManifestMetadata(state, { companionWindowId: id, manifestId, windowId }),
      manifestTitle: getManifestTitle(state, { windowId }),
      highlightedLine: getTextsForVisibleCanvases(state, { windowId })
        ?.map((page) => page?.text?.lines?.filter((line) => line?.isHighlighted))
        .flat(99)
        .shift(),
      textsAvailable: getTextsForVisibleCanvases(state, { windowId }).length > 0,
      textsFetching: getTextsForVisibleCanvases(state, { windowId }).some((t) => t?.isFetching),
      canvasId: (getCurrentCanvas(state, { windowId }) || {}).id,
      canvasIndex: getCanvasIndex(state, { windowId }),
      windowId,
      ...getWindowTextOverlayOptions(state, { windowId }),
    }),
    reducers: {
      texts: textsReducer,
    },
    saga: textSaga,
  },
  {
    component: MiradorTextOverlay,
    mapDispatchToProps: (dispatch) => ({
      doHighlightLine: (canvasId, line, initiator) =>
        dispatch(highlightLine(canvasId, line, initiator)),
    }),
    mapStateToProps: (state, { windowId }) => ({
      pageTexts: getTextsForVisibleCanvases(state, { windowId }).map((canvasText) => {
        if (canvasText === undefined || canvasText.isFetching) {
          return undefined;
        }
        return {
          ...canvasText.text,
          canvasId: canvasText.canvasId,
          source: canvasText.source,
          color: canvasText.color,
        };
      }),
      highlightedLine: getTextsForVisibleCanvases(state, { windowId })
        ?.map((page) => page?.text?.lines?.filter((line) => line?.isHighlighted))
        .flat(99)
        .shift(),
      windowId,
      ...getWindowTextOverlayOptions(state, { windowId }),
    }),
    mode: 'add',
    target: 'OpenSeadragonViewer',
  },
  {
    component: OverlaySettings,
    target: 'OpenSeadragonViewer',
    mode: 'add',
    mapStateToProps: (state, { windowId }) => {
      const win = state.windows && state.windows[windowId];
      const texts = getTextsForVisibleCanvases(state, { windowId });
      return {
        containerId: windowId,
        imageToolsEnabled: !!(win && win.imageToolsEnabled),
        windowTextOverlayOptions: getWindowTextOverlayOptions(state, { windowId }),
        textsAvailable: texts.length > 0,
        textsFetching: texts.some((t) => t?.isFetching),
        pageColors: texts.map((t) => ({
          color: t?.color,
          textColor: t?.textColor,
          bgColor: t?.bgColor,
        })),
      };
    },
    mapDispatchToProps: (dispatch, { windowId }) => ({
      updateWindowTextOverlayOptions: (newOptions) =>
        dispatch(updateWindow(windowId, { textOverlay: newOptions })),
    }),
  },
];
