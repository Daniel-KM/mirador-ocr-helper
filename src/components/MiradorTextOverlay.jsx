import React, { Component } from 'react';
import { createPortal } from 'react-dom';
import PropTypes from 'prop-types';
import PageTextDisplay from './PageTextDisplay.jsx';

/** Overlay that renders OCR or transcription text in a SVG.
 *
 * Synchronizes the text position to the underlying OpenSeadragon viewer viewport so that
 * every line or word (depending on the granularity of the text/transcription) is rendered
 * at the correct position.
 */
class MiradorTextOverlay extends Component {
  /** Register refs that allow us to directly access the actual render components */
  constructor(props) {
    super(props);

    this.renderRefs = [React.createRef(), React.createRef()];
    this.containerRef = React.createRef();
    this.state = { hasHighlight: false };
    // The Redux reducer for HIGHLIGHT_LINE mutates `line` objects in place,
    // so prevProps shares the same line refs as props. Keep our own snapshot
    // to detect transitions reliably.
    this.lastHighlight = null;
  }

  /** Register OpenSeadragon callback on initial mount */
  componentDidMount() {
    const { enabled, viewer } = this.props;
    if (enabled && viewer) {
      this.registerOsdCallback();
    }
    this.patchAnnotationOverlay();
  }

  /** Register OpenSeadragon callback when viewport changes */
  componentDidUpdate(prevProps) {
    const { enabled, viewer, pageTexts, textColor, bgColor, useAutoColors, visible, selectable } =
      this.props;
    let { opacity } = this.props;

    this.patchAnnotationOverlay();

    // OSD instance becomes available, register callback
    if (enabled && viewer && viewer !== prevProps.viewer) {
      this.registerOsdCallback();
    }
    // Newly enabled, force initial setting of state from OSD
    const newlyEnabled =
      (this.shouldRender() && !this.shouldRender(prevProps)) ||
      pageTexts.filter(this.shouldRenderPage).length !==
        prevProps.pageTexts.filter(this.shouldRenderPage).length;

    if (newlyEnabled) {
      this.onUpdateViewport();
    }

    if (selectable !== prevProps.selectable) {
      this.renderRefs
        .filter((ref) => ref.current)
        .forEach((ref) => ref.current.updateSelectability(selectable));
    }

    this.syncHighlightedLine();

    // Manually update SVG colors for performance reasons
    // eslint-disable-next-line require-jsdoc
    const hasPageColors = (text = {}) => text.textColor !== undefined;
    if (
      visible !== prevProps.visible ||
      opacity !== prevProps.opacity ||
      bgColor !== prevProps.bgColor ||
      textColor !== prevProps.textColor ||
      useAutoColors !== prevProps.useAutoColors ||
      pageTexts.filter(hasPageColors).length !== prevProps.pageTexts.filter(hasPageColors).length
    ) {
      if (!visible) {
        opacity = 0;
      }
      this.renderRefs.forEach((ref, idx) => {
        if (!ref.current) {
          return;
        }
        let fg = textColor;
        let bg = bgColor;
        if (useAutoColors) {
          const { textColor: newFg, bgColor: newBg } = pageTexts[idx];
          if (newFg) {
            fg = newFg;
            bg = newBg;
          }
        }
        ref.current.updateColors(fg, bg, opacity);
      });
    }
  }

  /** OpenSeadragon viewport update callback */
  onUpdateViewport() {
    // Do nothing if the overlay is not currently rendered
    if (!this.shouldRender) {
      return;
    }

    const { viewer, canvasWorld } = this.props;

    // Determine new scale factor and position for each page
    const vpBounds = viewer.viewport.getBounds(true);
    const viewportZoom = viewer.viewport.getZoom(true);
    if (this.containerRef.current) {
      const { clientWidth: containerWidth, clientHeight: containerHeight } = viewer.container;
      const flip = viewer.viewport.getFlip();
      const rotation = viewer.viewport.getRotation();
      const transforms = [];
      if (flip) {
        transforms.push(`translate(${containerWidth}px, 0px)`);
        transforms.push('scale(-1, 1)');
      }
      if (rotation !== 0) {
        switch (rotation) {
          case 90:
            transforms.push(`translate(${containerWidth}px, 0px)`);
            break;
          case 180:
            transforms.push(`translate(${containerWidth}px, ${containerHeight}px)`);
            break;
          case 270:
            transforms.push(`translate(0px, ${containerHeight}px)`);
            break;
          default:
            console.error(`Unsupported rotation: ${rotation}`);
        }
        transforms.push(`rotate(${rotation}deg)`);
      }
      this.containerRef.current.style.transform = transforms.join(' ');
    }
    for (let itemNo = 0; itemNo < viewer.world.getItemCount(); itemNo += 1) {
      // Skip update if we don't have a reference to the PageTextDisplay instance
      if (!this.renderRefs[itemNo].current) {
        // eslint-disable-next-line no-continue
        continue;
      }
      const img = viewer.world.getItemAt(itemNo);
      const canvasDims = canvasWorld.canvasDimensions[itemNo];
      const canvasWorldOffset =
        itemNo > 0
          ? img.source.dimensions.x -
            canvasDims.width +
            canvasWorld.canvasDimensions[itemNo - 1].width
          : 0;
      const canvasWorldScale = img.source.dimensions.x / canvasDims.width;
      this.renderRefs[itemNo].current.updateTransforms(
        img.viewportToImageZoom(viewportZoom),
        vpBounds.x * canvasWorldScale - canvasWorldOffset,
        vpBounds.y * canvasWorldScale,
      );
    }
  }

  /** Locate the currently highlighted line across all pageTexts. */
  findHighlightedLine(pageTexts) {
    for (let idx = 0; idx < (pageTexts || []).length; idx += 1) {
      const line = (pageTexts[idx]?.lines || []).find((l) => l.isHighlighted);
      if (line) {
        return { line, idx };
      }
    }
    return null;
  }

  /** Push the current highlight state to the right PageTextDisplay via ref. */
  syncHighlightedLine() {
    const { pageTexts, bgColor, useAutoColors } = this.props;
    const curr = this.findHighlightedLine(pageTexts);
    const prev = this.lastHighlight;

    const sameLine = prev?.line === curr?.line && prev?.idx === curr?.idx;
    if (sameLine) {
      return;
    }
    this.lastHighlight = curr;

    // Clear any previously-highlighted rect on every page (cheap and robust
    // against page changes).
    this.renderRefs.forEach((ref) => {
      if (ref?.current?.highlightLine) {
        ref.current.highlightLine(null);
      }
    });

    if (curr) {
      const ref = this.renderRefs[curr.idx];
      if (ref?.current?.highlightLine) {
        const pageBg = useAutoColors ? pageTexts[curr.idx]?.bgColor : null;
        const color = pageBg || bgColor || '#ffeb3b';
        // Use a fixed opacity so the rectangle stays visible even if the
        // text overlay itself is hidden (opacity=0).
        ref.current.highlightLine(curr.line, { color, opacity: 0.5 });
      }
      if (curr.line.initiator === 'text') {
        this.zoomToLine(curr.idx, curr.line);
      }
    }

    if (!!curr !== this.state.hasHighlight) {
      this.setState({ hasHighlight: !!curr });
    }
  }

  /** Pan + zoom the OSD viewport so the line is centered with some padding.
   *
   * Triggered when the user clicks a line in the side OCR panel — gives a
   * "jump to this passage" feel rather than just dropping a faint highlight
   * far away from the current view.
   */
  zoomToLine(idx, line) {
    const { viewer } = this.props;
    if (!viewer || !line) return;
    const item = viewer.world.getItemAt(idx);
    const viewport = viewer.viewport;
    if (!item || !viewport || typeof viewport.imageToViewportRectangle !== 'function') {
      return;
    }
    // Pad in image-space, then convert through the viewport (which knows
    // both the tiled image and the world layout). OSD's TiledImage
    // .imageToViewportRectangle does not always do the normalization we
    // need; viewport.imageToViewportRectangle is reliable for a single
    // tiled image at world index 0.
    const pad = line.height * 1.5;
    const padded = viewport.imageToViewportRectangle(
      line.x - pad,
      line.y - pad,
      line.width + pad * 2,
      line.height + pad * 2,
    );
    if (!padded) return;
    try {
      if (typeof viewport.fitBoundsWithConstraints === 'function') {
        viewport.fitBoundsWithConstraints(padded);
      } else {
        viewport.fitBounds(padded);
      }
    } catch (_e) {
      // Bounds outside the source dimensions; skip silently rather than
      // throwing in the middle of a Redux callback.
    }
  }

  /** If the page should be rendered */
  shouldRenderPage = ({ lines } = {}) =>
    lines &&
    lines.length > 0 &&
    lines.some(({ text, spans }) => text || (spans && spans.length > 0));

  /** If the overlay should be rendered at all */
  shouldRender(props) {
    const { enabled, pageTexts } = props ?? this.props;
    return enabled && pageTexts.length > 0;
  }

  /** Update container dimensions and page scale/offset every time the OSD viewport changes. */
  registerOsdCallback() {
    const { viewer } = this.props;
    viewer.addHandler('update-viewport', this.onUpdateViewport.bind(this));
  }

  /**
   * Patch the neighboring AnnotationOverlay container to work with the text overlay.
   *
   * FIXME: This is almost criminally hacky and brittle.
   *
   * If Mirador renders an annotation overlay, it can either:
   * - be rendered above the text overlay and intercept pointer events,
   *   preventing selection
   * - or be rendered below the text overlay, i.e. we occlude the annotations
   *
   * To fix both cases, we hard-code the z-index on the annotation overlay so
   * it's always above us and set `pointer-events` to `none` if selectability
   * is active (this has the effect of the annotation overlay becoming
   * 'transparent' to pointer events, i.e. they reach us and allow the user
   * to select text).
   *
   * We have to resort to manual DOM-wrangling since an attempt at using a
   * wrapping plugin component around `AnnotationOverlay` fails on multiple
   * levels:
   * - Adjusting the styles on the wrapping element itself fails since the
   *   annotation overlay renders with `React.createPortal`, i.e. outside of the
   *   plugin components's DOM subtree.
   * - Accessing the `ref` on `AnnotationOverlay` fails since we can't get a
   *   handle on it via `props.children` in the wrapping component
   *
   *  So this is it, it's ugly, it's brittle, it's painful, but it works (for now...).
   */
  patchAnnotationOverlay() {
    const { enabled, selectable } = this.props;
    if (!enabled) {
      return;
    }
    const annoCanvasContainer = this.containerRef.current?.parentElement
      // This selector will currently only match the AnnotationOverlay's `canvas` node
      .querySelector('div.openseadragon-canvas > div > canvas')?.parentElement;
    if (annoCanvasContainer) {
      annoCanvasContainer.style.zIndex = 100;
      annoCanvasContainer.style.pointerEvents = selectable ? 'none' : null;
    }
  }

  /** Render the text overlay SVG */
  render() {
    const {
      pageTexts,
      selectable,
      visible,
      viewer,
      opacity,
      textColor,
      bgColor,
      useAutoColors,
      fontFamily,
      doHighlightLine,
      panelVisible,
    } = this.props;
    if (!this.shouldRender() || !viewer || !pageTexts) {
      return null;
    }
    // Rects only need to capture clicks when the side panel is actually
    // visible — that's the only place the image-to-panel highlight is
    // observable. Otherwise let OSD receive the click so its default
    // click-to-zoom behaviour kicks in.
    const rectClickable = panelVisible !== false && visible !== false;
    return createPortal(
      <div
        ref={this.containerRef}
        style={{
          position: 'absolute',
          // The wrapper has no own hit area: let pointer/wheel events fall
          // through to OSD (zoom, pan) by default. Individual <rect> nodes
          // re-enable pointer-events:fill on themselves so the click-to-
          // highlight affordance still works on top of the line boxes.
          pointerEvents: 'none',
          // Force the wrapper visible when a line is highlighted so the
          // imperatively-styled <rect> shows up even if the user has not
          // enabled the text overlay (typical case: only the OCR panel is
          // open).
          display: selectable || visible || this.state.hasHighlight ? null : 'none',
        }}
      >
        {pageTexts.map((page, idx) => {
          if (!page || !this.shouldRenderPage(page)) {
            return null;
          }
          const {
            lines,
            source,
            width: pageWidth,
            height: pageHeight,
            textColor: pageFg,
            bgColor: pageBg,
          } = page;
          return (
            <PageTextDisplay
              ref={this.renderRefs[idx]}
              key={source}
              lines={lines}
              source={source}
              selectable={selectable}
              visible={visible}
              opacity={opacity}
              width={pageWidth}
              height={pageHeight}
              textColor={textColor}
              fontFamily={fontFamily}
              bgColor={bgColor}
              useAutoColors={useAutoColors}
              clickable={rectClickable}
              onLineClick={(line) => {
                if (doHighlightLine && page.canvasId) {
                  doHighlightLine(page.canvasId, line, 'image');
                }
              }}
              pageColors={pageFg ? { textColor: pageFg, bgColor: pageBg } : undefined}
            />
          );
        })}
      </div>,
      viewer.canvas,
    );
  }
}

MiradorTextOverlay.propTypes = {
  canvasWorld: PropTypes.object, // eslint-disable-line react/forbid-prop-types
  enabled: PropTypes.bool,
  opacity: PropTypes.number,
  pageTexts: PropTypes.array, // eslint-disable-line react/forbid-prop-types
  selectable: PropTypes.bool,
  viewer: PropTypes.object, // eslint-disable-line react/forbid-prop-types
  visible: PropTypes.bool,
  textColor: PropTypes.string,
  fontFamily: PropTypes.oneOfType([PropTypes.string, PropTypes.arrayOf(PropTypes.string)]),
  bgColor: PropTypes.string,
  useAutoColors: PropTypes.bool,
  panelVisible: PropTypes.bool,
};

MiradorTextOverlay.defaultProps = {
  canvasWorld: undefined,
  enabled: true,
  opacity: 0.75,
  pageTexts: undefined,
  selectable: true,
  viewer: undefined,
  visible: false,
  textColor: '#000000',
  fontFamily: undefined,
  bgColor: '#ffffff',
  useAutoColors: true,
};

export default MiradorTextOverlay;
