import React, { Component } from 'react';
import { withTranslation } from 'react-i18next';
import DOMPurify from 'dompurify';
import PropTypes from 'prop-types';
import { styled, alpha } from '@mui/material/styles';
import BulbIcon from '@mui/icons-material/EmojiObjects';
import { MiradorMenuButton, htmlRules } from 'mirador';

const Wrap = styled('div')({
  display: 'flex',
  flex: 1,
  width: '100%',
});

const ViewerContainer = styled('div')({
  position: 'relative',
  display: 'flex',
  flex: 1,
});

const TextContainer = styled('div', {
  shouldForwardProp: (p) => !['textsAvailable', 'visible'].includes(p),
})(({ textsAvailable, visible }) => ({
  fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  zIndex: 1,
  flex: '0 0 auto',
  backgroundColor: '#ffffff',
  padding: '0.75rem',
  boxSizing: 'border-box',
  maxWidth: '50%',
  height: '100%',
  overflowY: 'auto',
  scrollBehavior: 'smooth',
  borderLeft: `2px solid ${alpha('#000000', 0.15)}`,
  display: textsAvailable && visible ? null : 'none',
}));

const Paragraph = styled('div')({
  margin: '0.25em 0',
});

const LineWrap = styled('div', {
  shouldForwardProp: (p) => !['lineColor', 'lineOpacity', 'isHighlighted'].includes(p),
})(({ lineColor, lineOpacity, isHighlighted }) => {
  // The panel highlight must stay visible even when the global text overlay
  // opacity is 0 (default): use a guaranteed minimum opacity for the
  // selected line. Hover stays subtle (~0.2) so it does not compete.
  const highlightAlpha = Math.max(lineOpacity ?? 0.5, 0.5);
  const hoverAlpha = isHighlighted ? highlightAlpha : 0.2;
  return {
    position: 'relative',
    width: '100%',
    transition: 'background-color 0.3s ease',
    backgroundColor: isHighlighted
      ? alpha(lineColor || '#ffff00', highlightAlpha)
      : 'transparent',
    '&:hover': {
      backgroundColor: alpha(lineColor || '#ffff00', hoverAlpha),
    },
  };
});

const LineButton = styled('button')({
  appearance: 'none',
  border: 0,
  display: 'block',
  cursor: 'pointer',
  fontSize: '15.4px',
  padding: '0.5em 2em 0.5em 0.5em',
  lineHeight: '1.2',
  backgroundColor: 'transparent',
  width: '100%',
  textAlign: 'left',
});

const CorrectionButton = styled(MiradorMenuButton, {
  shouldForwardProp: (p) => p !== 'showCorrection',
})(({ theme, showCorrection }) => ({
  position: 'absolute',
  top: 0,
  right: 0,
  fontSize: '24px',
  padding: '0.2em 0.25em',
  display: showCorrection ? 'block' : 'none',
  color: theme.palette.primary.main,
  transition: 'color 0.3s ease',
  background: 'transparent',
  '&:hover': {
    background: 'transparent',
    color: theme.palette.primary.dark,
  },
}));

const MAX_POLL_ITERATION_LIMIT = 200;

class MiradorOcrWindowViewer extends Component {
  constructor(props) {
    super(props);
    this.state = {};
    this.lineRefs = [];
  }

  componentDidMount() {
    this.highlightLineByQueryParams();
  }

  componentDidUpdate(prevProps) {
    const { highlightedLine } = this.props;
    if (
      highlightedLine &&
      highlightedLine?.initiator !== 'text' &&
      highlightedLine !== prevProps.highlightedLine
    ) {
      this.scrollTo(highlightedLine);
    }
  }

  componentWillUnmount() {
    if (this.textPollInterval) {
      clearInterval(this.textPollInterval);
    }
    this.lineRefs = [];
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  highlightLineByQueryParams() {
    const { doSetCanvas, doHighlightLine } = this.props;
    const lineParam = this.getQuery('line');
    let fetchTextPollIterations = 0;

    if (lineParam) {
      const [newCanvasId, lineX, lineY] = lineParam.split(',');
      if (newCanvasId) {
        doSetCanvas(newCanvasId);
      }
      if (lineX && lineY) {
        const clearTextPollInterval = setInterval(() => {
          const textIsCompleted = !!this.props.pageTexts.find(
            (text) => text?.canvasId === newCanvasId,
          );
          if (textIsCompleted) {
            doHighlightLine(newCanvasId, { x: Number(lineX), y: Number(lineY) }, 'text');
          }
          if (textIsCompleted || fetchTextPollIterations > MAX_POLL_ITERATION_LIMIT) {
            clearInterval(clearTextPollInterval);
          }
          fetchTextPollIterations++;
        }, 300);
      }
    }
  }

  scrollTo({ index }) {
    const element = Array.isArray(this.lineRefs) ? this.lineRefs[index] : null;
    if (!element) return;
    const method =
      typeof element.scrollIntoViewIfNeeded === 'function'
        ? 'scrollIntoViewIfNeeded'
        : typeof element.scrollIntoView === 'function'
        ? 'scrollIntoView'
        : null;
    if (method) {
      element[method]({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
    }
  }

  getQuery(q, urlToParse = window.location.search) {
    return (urlToParse.match(new RegExp('[?&]' + q + '=([^&]+)')) || [null, null])[1];
  }

  getEmailLink(line) {
    const { correction, t, manifestMetadata, manifestTitle, canvasId, canvasIndex } = this.props;
    const metadata = (manifestMetadata || []).reduce(
      (acc, lv) => acc.concat([{ [lv.label]: DOMPurify.sanitize(lv.values.join(', '), htmlRules.iiif) }]),
      [],
    );
    const metadataString = metadata
      .reduce(
        (acc, lv) =>
          acc.concat([`${Object.keys(lv)[0]}: ${Object.values(lv)[0]}`]),
        [],
      )
      .join('\r\n');

    const currentUrl = new URL(window.location.href);
    const url = new URL(currentUrl.origin + currentUrl.pathname);
    const params = new URLSearchParams(currentUrl.search);
    for (const [key, value] of params) {
      if (correction.emailUrlKeepParams?.includes(key)) {
        url.searchParams.set(key, value);
      }
    }
    url.searchParams.set('line', `${canvasId},${line.x},${line.y}`);

    const to = correction.emailRecipient || '';
    const subject = t('ocrCorrectionSubject') || '';
    const body =
      t('ocrCorrectionBody', {
        metadata: metadataString,
        signature: manifestTitle,
        text: line.text,
        url: decodeURIComponent(url.href),
        page: canvasIndex + 1,
      }) || '';

    return `mailto:?to=${encodeURIComponent(to)}&subject=${encodeURIComponent(
      subject,
    )}&body=${encodeURIComponent(body)}`;
  }

  render() {
    const {
      windowId,
      canvasId,
      correction,
      skipEmptyLines,
      pageTexts,
      textsAvailable,
      textsFetching,
      doHighlightLine,
      visible,
      opacity,
      t,
      TargetComponent,
      targetProps,
    } = this.props;
    const { hasError } = this.state;

    if (hasError) {
      return null;
    }

    return (
      <Wrap>
        <ViewerContainer>
          {TargetComponent && <TargetComponent {...targetProps} />}
        </ViewerContainer>
        <TextContainer
          className="ocr-container"
          textsAvailable={textsAvailable}
          visible={visible !== false}
        >
          {textsAvailable &&
            !textsFetching &&
            pageTexts?.map((page) =>
              page?.lines?.map((line, index) => {
                const showLine =
                  !skipEmptyLines ||
                  (line.width > 0 && line.height > 0 && line.text.trim().length > 0);
                if (!showLine) return null;
                return (
                  <Paragraph
                    ref={(ref) => {
                      this.lineRefs[index] = ref;
                    }}
                    key={`line_${line.x}_${line.y}`}
                  >
                    <LineWrap
                      lineColor={page.bgColor}
                      lineOpacity={opacity}
                      isHighlighted={!!line.isHighlighted}
                    >
                      <LineButton
                        className="ocr-line"
                        type="button"
                        onClick={() => doHighlightLine(canvasId, line, 'text')}
                      >
                        {line.text}
                      </LineButton>
                      {correction?.enabled && line.text && (
                        <CorrectionButton
                          size="small"
                          showCorrection={!!line.isHighlighted}
                          aria-label={t('ocrCorrectionTooltip')}
                          onClick={(ev) => {
                            ev.preventDefault();
                            ev.stopPropagation();
                            window.open(this.getEmailLink(line), '_blank');
                          }}
                        >
                          <BulbIcon style={{ fontSize: '1em', lineHeight: 0, padding: 0 }} />
                        </CorrectionButton>
                      )}
                    </LineWrap>
                  </Paragraph>
                );
              }),
            )}
        </TextContainer>
      </Wrap>
    );
  }
}

MiradorOcrWindowViewer.propTypes = {
  canvasId: PropTypes.string,
  canvasIndex: PropTypes.number,
  correction: PropTypes.object,
  skipEmptyLines: PropTypes.bool,
  doHighlightLine: PropTypes.func,
  doSetCanvas: PropTypes.func,
  highlightedLine: PropTypes.object,
  manifestTitle: PropTypes.string,
  manifestMetadata: PropTypes.array,
  opacity: PropTypes.number,
  pageTexts: PropTypes.array,
  t: PropTypes.func.isRequired,
  textsAvailable: PropTypes.bool,
  textsFetching: PropTypes.bool,
  visible: PropTypes.bool,
  windowId: PropTypes.string.isRequired,
  TargetComponent: PropTypes.elementType,
  targetProps: PropTypes.object,
};

MiradorOcrWindowViewer.defaultProps = {
  correction: { enabled: false },
  skipEmptyLines: true,
  TargetComponent: null,
  targetProps: {},
};

export default withTranslation()(MiradorOcrWindowViewer);
