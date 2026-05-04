import React from 'react';
import PropTypes from 'prop-types';
import { alpha as fade, useTheme } from '@mui/material/styles';
import { styled } from '@mui/material/styles';

const OverlaySvg = styled('svg', { shouldForwardProp: (p) => p !== 'overlayTheme' })(
  ({ overlayTheme }) => ({
    fontFamily: overlayTheme?.overlayFont ?? 'sans-serif',
  }),
);

/** Check if we're running in Gecko */
function runningInGecko() {
  return navigator.userAgent.indexOf('Gecko/') >= 0;
}

/** Page Text Display component that is optimized for fast panning/zooming
 *
 * NOTE: This component is doing stuff that is NOT RECOMMENDED GENERALLY, like
 *       hacking shouldComponentUpdate to not-rerender on every prop change,
 *       setting styles manually via DOM refs, etc. This was all done to reach
 *       higher frame rates.
 */
class PageTextDisplay extends React.Component {
  /** Set up refs for direct transforms and pointer callback registration */
  constructor(props) {
    super(props);
    this.containerRef = React.createRef();
    this.textContainerRef = React.createRef();
    this.boxContainerRef = React.createRef();
    this.highlightedRect = null;
  }

  /** Register pointerdown handler on SVG container */
  componentDidMount() {
    // FIXME: We should be able to use React for this, but it somehow doesn't work
    this.textContainerRef.current.addEventListener('pointerdown', this.onPointerDown);
    // For mobile Safari <= 12.2
    this.textContainerRef.current.addEventListener('touchstart', this.onPointerDown);
    if (this.boxContainerRef.current) {
      this.boxContainerRef.current.addEventListener('click', this.onBoxClick);
    }
  }

  /** Detach handlers on unmount. */
  componentWillUnmount() {
    if (this.textContainerRef.current) {
      this.textContainerRef.current.removeEventListener('pointerdown', this.onPointerDown);
      this.textContainerRef.current.removeEventListener('touchstart', this.onPointerDown);
    }
    if (this.boxContainerRef.current) {
      this.boxContainerRef.current.removeEventListener('click', this.onBoxClick);
    }
  }

  /** Forward a click on a line rect to the parent so it can dispatch the
   * highlight action (with initiator='image' so the OCR panel scrolls). */
  onBoxClick = (evt) => {
    if (!this.props.onLineClick) {
      return;
    }
    const rect = evt.target && evt.target.closest && evt.target.closest('rect[data-line-key]');
    if (!rect) {
      return;
    }
    const key = rect.getAttribute('data-line-key');
    const line = (this.props.lines || []).find((l) => `${l.x}_${l.y}` === key);
    if (line) {
      this.props.onLineClick(line);
    }
  };

  /** Only update the component when the source changed (i.e. we need to re-render the text).
   *
   * Yes, this is a horrible, horrible, hack, that will bite us in the behind at
   * some point, and is going to trip someone up terribly while debugging in the future,
   * but this *seriously* helps with performance.
   */
  shouldComponentUpdate(nextProps) {
    const { source } = this.props;
    return nextProps.source !== source;
  }

  /** Swallow pointer events if selection is enabled */
  onPointerDown = (evt) => {
    const { selectable } = this.props;
    if (!selectable) {
      return;
    }
    evt.stopPropagation();
  };

  /** Update the CSS transforms for the SVG container, i.e. scale and move the text overlay
   *
   * Intended to be called by the parent component. We use direct DOM access for this instead
   * of props since it is *significantly* faster (30fps vs 60fps on my machine).
   */
  updateTransforms(scaleFactor, x, y) {
    if (!this.containerRef.current) {
      return;
    }
    const { width, height } = this.props;
    // Scaling is done from the center of the container, so we have to update the
    // horizontal and vertical offsets we got from OSD.
    const translateX = ((scaleFactor - 1) * width) / 2 + x * scaleFactor * -1;
    const translateY = ((scaleFactor - 1) * height) / 2 + y * scaleFactor * -1;
    const containerTransforms = [
      `translate(${translateX}px, ${translateY}px)`,
      `scale(${scaleFactor})`,
    ];
    this.containerRef.current.style.display = null;
    this.containerRef.current.style.transform = containerTransforms.join(' ');
  }

  /** Update the opacity of the text and rects in the SVG.
   *
   * Again, intended to be called from the parent, again for performance reasons.
   */
  updateColors(textColor, bgColor, opacity) {
    if (!this.textContainerRef.current || !this.boxContainerRef.current) {
      return;
    }
    // We need to apply the colors to the individual rects and texts instead of
    // one of the containers, since otherwise the user's selection highlight would
    // become transparent as well or disappear entirely.
    for (const rect of this.boxContainerRef.current.querySelectorAll('rect')) {
      // Skip the currently highlighted rect to preserve its color, but
      // refresh the cached original fill so a later clear restores the
      // up-to-date background.
      if (rect.classList.contains('ocr-line-highlighted')) {
        this.highlightedRectOriginalFill = fade(bgColor, opacity);
        continue;
      }
      rect.style.fill = fade(bgColor, opacity);
    }
    for (const text of this.textContainerRef.current.querySelectorAll('text')) {
      text.style.fill = fade(textColor, opacity);
    }
  }

  /** Update the selectability of the text nodes.
   *
   * Again, intended to be called from the parent, again for performance
   * reasons. shouldComponentUpdate blocks normal re-renders, so we mutate
   * the DOM directly to reflect the new selectable mode on the existing
   * rects.
   */
  updateSelectability(selectable) {
    if (!this.textContainerRef.current) {
      return;
    }
    // Update both SVG wrappers (rect SVG below, text SVG above) so the
    // I-beam shows up regardless of which layer hit-tests under the cursor.
    const textSvg = this.textContainerRef.current.parentElement;
    textSvg.style.userSelect = selectable ? 'text' : 'none';
    textSvg.style.cursor = selectable ? 'text' : 'default';
    // The text SVG sits on top; let it capture events only when the user
    // wants to select text. Otherwise pointer events fall through to the
    // rect SVG below, which drives the click-to-highlight affordance.
    textSvg.style.pointerEvents = selectable ? 'auto' : 'none';
    if (this.boxContainerRef.current) {
      const rectSvg = this.boxContainerRef.current.parentElement;
      rectSvg.style.cursor = selectable ? 'text' : 'default';
      for (const rect of this.boxContainerRef.current.querySelectorAll('rect')) {
        rect.style.cursor = selectable ? 'text' : 'pointer';
        rect.style.pointerEvents = 'fill';
      }
    }
  }

  /** Highlight a single line rectangle in the OSD overlay.
   *
   * Called imperatively by the parent because shouldComponentUpdate blocks
   * normal prop-driven re-renders. Pass null to clear.
   */
  highlightLine(line, options = {}) {
    if (!this.boxContainerRef.current) {
      return;
    }
    if (this.highlightedRect) {
      this.highlightedRect.classList.remove('ocr-line-highlighted');
      // Restore the original inline fill so we don't fall through to the
      // SVG default `fill: black` when removing the inline style.
      if (this.highlightedRectOriginalFill !== undefined) {
        this.highlightedRect.style.fill = this.highlightedRectOriginalFill;
      } else {
        this.highlightedRect.style.removeProperty('fill');
      }
      this.highlightedRect.style.removeProperty('stroke');
      this.highlightedRect.style.removeProperty('stroke-width');
      this.highlightedRect = null;
      this.highlightedRectOriginalFill = undefined;
    }
    if (!line) {
      return;
    }
    const key = `${line.x}_${line.y}`;
    const sel = this.boxContainerRef.current.querySelector(
      `rect[data-line-key="${CSS.escape(key)}"]`,
    );
    if (!sel) {
      return;
    }
    const color = options.color || '#ffeb3b';
    const opacity = options.opacity ?? 0.5;
    // Capture the current inline fill before overwriting so we can restore
    // it on the next clear (the SVG default is black, which would flash
    // through if we just emptied the inline style).
    this.highlightedRectOriginalFill = sel.style.fill;
    sel.classList.add('ocr-line-highlighted');
    sel.style.fill = fade(color, opacity);
    sel.style.stroke = fade(color, Math.min(1, opacity + 0.3));
    sel.style.strokeWidth = '2';
    this.highlightedRect = sel;
  }

  /** Render the page overlay */
  render() {
    const {
      selectable,
      visible,
      lines,
      width: pageWidth,
      height: pageHeight,
      opacity,
      textColor,
      bgColor,
      useAutoColors,
      pageColors,
      overlayTheme,
    } = this.props;

    const containerStyle = {
      // This attribute seems to be the key to enable GPU-accelerated scaling and translation
      // (without using translate3d) and achieve 60fps on a regular laptop even with huge objects.
      willChange: 'transform',
      position: 'absolute',
      display: 'none', // will be cleared by first update
    };
    const svgStyle = {
      left: 0,
      top: 0,
      width: pageWidth,
      height: pageHeight,
      userSelect: selectable ? 'text' : 'none',
      cursor: selectable ? 'text' : 'default',
      whiteSpace: 'pre',
    };
    let fg = textColor;
    let bg = bgColor;
    if (useAutoColors && pageColors) {
      fg = pageColors.textColor;
      bg = pageColors.bgColor;
    }

    // Background rectangles are only rendered opaque when the overlay text is
    // visible. In all other cases (text overlay off, or selectable-text-only)
    // they stay transparent so they don't occlude the image when the wrapper
    // is forced visible (e.g. when a single line is highlighted from the OCR
    // panel).
    const renderOpacity = visible ? opacity : 0;
    // The rect SVG sits below a topmost text SVG. To make panel-to-image
    // clicks reach the rect, we keep `pointerEvents: 'fill'` here and turn
    // the text layer transparent to pointer events when text selection is
    // off (see svgStyle below). When selection is on, the text layer
    // captures events instead so the browser can drive caret placement.
    const boxStyle = {
      fill: fade(bg, renderOpacity),
      pointerEvents: 'fill',
      cursor: selectable ? 'text' : 'pointer',
    };
    const textStyle = {
      fill: fade(fg, renderOpacity),
    };
    const renderLines = lines.filter((l) => l.width > 0 && l.height > 0);

    /* Firefox/Gecko does not currently support the lengthAdjust parameter on
     * <tspan> Elements, only on <text> (https://bugzilla.mozilla.org/show_bug.cgi?id=890692).
     *
     * Using <text> elements for spans (and skipping the line-grouping) works fine
     * in Firefox, but breaks selection behavior in Chrome (the selected text contains
     * a newline after every word).
     *
     * So we have to go against best practices and use user agent sniffing to determine dynamically
     * how to render lines and spans, sorry :-/ */
    const isGecko = runningInGecko();
    // NOTE: Gecko really works best with a flattened bunch of text nodes. Wrapping the
    //       lines in a <g>, e.g. breaks text selection in similar ways to the below
    //       WebKit-specific note, for some reason ¯\_(ツ)_/¯
    // eslint-disable-next-line require-jsdoc
    const LineWrapper = isGecko ? (
      <></>
    ) : (
      ({ children }) => <text style={textStyle}>{children}</text>
    );
    // eslint-disable-next-line require-jsdoc
    function SpanElem(props) {
      return isGecko ? <text style={textStyle} {...props} /> : <tspan {...props} />;
    }
    return (
      <div ref={this.containerRef} style={containerStyle}>
        {/**
         * NOTE: We have to render the line background rectangles in a separate SVG and can't
         * include them in the same one as the text. Why? Because doing so breaks text selection in
         * WebKit-based browsers :/
         * It seems that if we render the rectangles first (since we don't want rectangles occluding
         * text), very often when a user's selection leaves the current line rectangle and crosses
         * over to the next, the selection will *end* where the user wanted it to start and instead
         * start from the very top of the page.
         * A simpler solution would've been to just render the line rectangles *after* the text to
         * avoid this issue, but unfortunately SVG determines draw order from the element order,
         * i.e. the rectangles would have completely occluded the text.
         * So we have to resort to this, it's a hack, but it works.
         */}
        <svg style={{ ...svgStyle, userSelect: 'none' }}>
          <g ref={this.boxContainerRef}>
            {renderLines.map((line) => (
              <rect
                key={`rect-${line.x}.${line.y}`}
                data-line-key={`${line.x}_${line.y}`}
                x={line.x}
                y={line.y}
                width={line.width}
                height={line.height}
                style={boxStyle}
              />
            ))}
          </g>
        </svg>
        <OverlaySvg
          overlayTheme={overlayTheme}
          style={{
            ...svgStyle,
            position: 'absolute',
            pointerEvents: selectable ? 'auto' : 'none',
          }}
        >
          <g ref={this.textContainerRef}>
            {renderLines.map((line) =>
              line.spans ? (
                <LineWrapper key={`line-${line.x}-${line.y}`}>
                  {line.spans
                    .filter((w) => w.width > 0 && w.height > 0)
                    .map(({ x, y, width, text }) => (
                      <SpanElem
                        key={`text-${x}-${y}`}
                        x={x}
                        y={line.y + line.height * 0.75}
                        textLength={width}
                        fontSize={`${line.height * 0.75}px`}
                        lengthAdjust="spacingAndGlyphs"
                      >
                        {text}
                      </SpanElem>
                    ))}
                </LineWrapper>
              ) : (
                <text
                  key={`line-${line.x}-${line.y}`}
                  x={line.x}
                  y={line.y + line.height * 0.75}
                  textLength={line.width}
                  fontSize={`${line.height}px`}
                  lengthAdjust="spacingAndGlyphs"
                  style={textStyle}
                >
                  {line.text}
                </text>
              ),
            )}
          </g>
        </OverlaySvg>
      </div>
    );
  }
}

const PageTextDisplayWithTheme = React.forwardRef(function PageTextDisplayWithTheme(props, ref) {
  const theme = useTheme();
  return <PageTextDisplay {...props} ref={ref} overlayTheme={theme?.textOverlay} />;
});

PageTextDisplay.propTypes = {
  overlayTheme: PropTypes.object,
  selectable: PropTypes.bool.isRequired,
  visible: PropTypes.bool.isRequired,
  opacity: PropTypes.number.isRequired,
  textColor: PropTypes.string.isRequired,
  bgColor: PropTypes.string.isRequired,
  useAutoColors: PropTypes.bool.isRequired,
  width: PropTypes.number.isRequired,
  height: PropTypes.number.isRequired,
  // eslint-disable-next-line react/forbid-prop-types
  lines: PropTypes.array.isRequired,
  source: PropTypes.string.isRequired,
  // eslint-disable-next-line react/forbid-prop-types
  pageColors: PropTypes.object,
};
PageTextDisplay.defaultProps = {
  overlayTheme: undefined,
  pageColors: undefined,
};

export default PageTextDisplayWithTheme;
