// HTML template for the widget
// The {{COMPONENT_JS}} and {{COMPONENT_CSS}} placeholders will be replaced
// with the bundled component.js content at build time or runtime

export const WIDGET_TEMPLATE = `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SlideScript</title>
  <style>
{{COMPONENT_CSS}}
  </style>
</head>
<body>
  <div id="root"></div>
  <script type="importmap">
  {
    "imports": {
      "react": "https://esm.sh/react@18.3.1",
      "react-dom/client": "https://esm.sh/react-dom@18.3.1/client",
      "react/jsx-runtime": "https://esm.sh/react@18.3.1/jsx-runtime"
    }
  }
  </script>
  <script type="module">
{{COMPONENT_JS}}
  </script>
</body>
</html>`;

// Inline CSS for the widget (embedded directly since we can't easily import CSS in Workers)
export const COMPONENT_CSS = `/* Reset & Base */
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  font-size: 14px;
  line-height: 1.5;
  color: #333;
  background: #f5f5f5;
}

/* App Layout */
.app {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #fff;
}

.app-content {
  display: flex;
  flex: 1;
  overflow: hidden;
}

/* Header */
.app-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  background: #fff;
  border-bottom: 1px solid #e0e0e0;
}

.header-left {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.project-title {
  font-size: 18px;
  font-weight: 600;
}

.project-meta {
  font-size: 12px;
  color: #666;
}

.separator {
  margin: 0 8px;
  color: #ccc;
}

.time-warning {
  color: #d32f2f;
}

.over-badge {
  background: #ffebee;
  color: #d32f2f;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  margin-left: 8px;
}

.header-right {
  display: flex;
  gap: 8px;
}

/* Buttons */
.btn {
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background: #1976d2;
  color: #fff;
  border: none;
}

.btn-primary:hover:not(:disabled) {
  background: #1565c0;
}

.btn-secondary {
  background: #fff;
  color: #333;
  border: 1px solid #ddd;
}

.btn-secondary:hover:not(:disabled) {
  background: #f5f5f5;
}

/* Sidebar / Slide List */
.sidebar {
  width: 280px;
  border-right: 1px solid #e0e0e0;
  background: #fafafa;
  overflow-y: auto;
}

.slide-list {
  padding: 12px;
}

.slide-list-header {
  margin-bottom: 12px;
}

.time-summary {
  font-size: 13px;
  font-weight: 500;
}

.time-ok {
  color: #2e7d32;
}

.time-over {
  color: #d32f2f;
}

.slide-list-items {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.slide-item {
  padding: 12px;
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.slide-item:hover {
  border-color: #1976d2;
}

.slide-item.selected {
  border-color: #1976d2;
  background: #e3f2fd;
}

.slide-item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.slide-index {
  font-weight: 600;
  color: #1976d2;
}

.slide-time {
  font-size: 12px;
  color: #666;
}

.lock-icon {
  margin-left: 4px;
}

.slide-title {
  font-size: 13px;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.slide-flags {
  display: flex;
  gap: 4px;
  margin-top: 8px;
}

.flag {
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 4px;
}

.flag-too_long {
  background: #fff3e0;
  color: #e65100;
}

.flag-too_short {
  background: #e3f2fd;
  color: #1565c0;
}

.flag-dense {
  background: #fce4ec;
  color: #c2185b;
}

.flag-needs_context {
  background: #f3e5f5;
  color: #7b1fa2;
}

/* Main Content / Editor */
.main-content {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.slide-editor {
  max-width: 800px;
}

.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.editor-header h2 {
  font-size: 20px;
  font-weight: 600;
}

.save-button {
  padding: 8px 20px;
  background: #1976d2;
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
}

.save-button:disabled {
  opacity: 0.5;
}

.editor-section {
  margin-bottom: 24px;
}

.editor-label {
  display: block;
  font-size: 12px;
  font-weight: 600;
  color: #666;
  margin-bottom: 8px;
  text-transform: uppercase;
}

/* Timing Controls */
.timing-controls {
  display: flex;
  align-items: center;
  gap: 24px;
}

.timing-input {
  display: flex;
  align-items: center;
  gap: 8px;
}

.timing-input input[type="number"] {
  width: 80px;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.timing-range {
  font-size: 12px;
  color: #999;
}

.timing-lock {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  cursor: pointer;
}

/* Inputs */
.goal-input,
.talktrack-input {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  font-family: inherit;
}

.talktrack-input {
  resize: vertical;
  min-height: 150px;
}

.goal-input:focus,
.talktrack-input:focus {
  outline: none;
  border-color: #1976d2;
}

/* Key Points */
.keypoints-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.keypoint-item {
  display: flex;
  gap: 8px;
}

.keypoint-item input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.remove-point {
  padding: 8px 12px;
  background: #f5f5f5;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  color: #666;
}

.remove-point:hover {
  background: #ffebee;
  color: #d32f2f;
}

.add-point {
  padding: 8px 12px;
  background: #f5f5f5;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  color: #666;
}

.add-point:hover {
  background: #e3f2fd;
  color: #1976d2;
}

/* Transitions */
.transition-inputs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.transition-inputs label {
  display: block;
  font-size: 12px;
  color: #666;
  margin-bottom: 4px;
}

.transition-inputs input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

/* Raw Content */
.raw-content {
  border-top: 1px solid #eee;
  padding-top: 24px;
}

.raw-text {
  background: #f5f5f5;
  padding: 12px;
  border-radius: 6px;
  font-size: 12px;
  color: #666;
  white-space: pre-wrap;
  max-height: 200px;
  overflow-y: auto;
}

/* Empty State */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  text-align: center;
  padding: 40px;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 24px;
}

.empty-state h2 {
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 12px;
}

.empty-state p {
  color: #666;
  margin-bottom: 32px;
}

.empty-steps {
  display: flex;
  flex-direction: column;
  gap: 16px;
  text-align: left;
}

.step {
  display: flex;
  align-items: center;
  gap: 12px;
}

.step-num {
  width: 28px;
  height: 28px;
  background: #1976d2;
  color: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
}

.no-slide-selected {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #999;
}`;

// Inline component JS - this is a simplified version for the skybridge
// In production, this should be replaced with the built component.js
export const COMPONENT_JS = `
import { useState, useEffect, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import { jsx, jsxs, Fragment } from 'react/jsx-runtime';

// Types are inlined for the browser

// OpenAI Hooks
function useToolOutput() {
  const [data, setData] = useState(null);

  useEffect(() => {
    const checkOutput = () => {
      if (window.openai?.toolOutput) {
        const content = window.openai.toolOutput.find((o) => o.structuredContent);
        if (content?.structuredContent) {
          setData(content.structuredContent);
        }
      }
    };

    checkOutput();
    const interval = setInterval(checkOutput, 1000);
    return () => clearInterval(interval);
  }, []);

  return data;
}

function useWidgetState() {
  const defaultState = { selectedSlideId: null, settingsDraft: {}, filter: '' };
  const [state, setState] = useState(() => window.openai?.getWidgetState?.() || defaultState);

  const updateState = useCallback((updates) => {
    setState((prev) => {
      const next = { ...prev, ...updates };
      window.openai?.setWidgetState?.(next);
      return next;
    });
  }, []);

  return [state, updateState];
}

function useCallTool() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const callTool = useCallback(async (name, args) => {
    if (!window.openai?.callTool) {
      setError('OpenAI bridge not available');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await window.openai.callTool(name, args);
      return result;
    } catch (err) {
      setError(err.message || 'Unknown error');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { callTool, loading, error };
}

// Components
function Header({ project, onRebalance, onExport, loading }) {
  const { stats, settings } = project;
  const overBy = stats.allocatedSeconds - (settings.totalSeconds - settings.qaBufferSeconds);
  const isOver = overBy > 0;

  return jsx('header', { className: 'app-header', children: [
    jsx('div', { className: 'header-left', children: [
      jsx('h1', { className: 'project-title', children: project.title }),
      jsxs('div', { className: 'project-meta', children: [
        jsx('span', { children: stats.slideCount + 'スライド' }),
        jsx('span', { className: 'separator', children: '|' }),
        jsx('span', { className: isOver ? 'time-warning' : '', children:
          Math.floor(stats.allocatedSeconds / 60) + '分' + (stats.allocatedSeconds % 60) + '秒 / ' +
          Math.floor(settings.totalSeconds / 60) + '分'
        }),
        isOver && jsx('span', { className: 'over-badge', children: '+' + overBy + '秒超過' })
      ]})
    ]}),
    jsxs('div', { className: 'header-right', children: [
      jsx('button', { className: 'btn btn-secondary', onClick: onRebalance, disabled: loading, children: '時間再配分' }),
      jsx('button', { className: 'btn btn-primary', onClick: onExport, disabled: loading, children: 'エクスポート' })
    ]})
  ]});
}

function SlideList({ slides, selectedSlideId, onSelectSlide, totalSeconds, allocatedSeconds }) {
  const overBy = allocatedSeconds - totalSeconds;
  const isOver = overBy > 0;

  const getFlagLabel = (flag) => {
    switch (flag) {
      case 'too_long': return '長い';
      case 'too_short': return '短い';
      case 'dense': return '内容多';
      case 'needs_context': return '補足要';
      default: return flag;
    }
  };

  return jsx('div', { className: 'slide-list', children: [
    jsx('div', { className: 'slide-list-header', children:
      jsx('div', { className: 'time-summary', children: [
        jsx('span', { className: isOver ? 'time-over' : 'time-ok', children:
          Math.floor(allocatedSeconds / 60) + '分' + (allocatedSeconds % 60) + '秒 / ' +
          Math.floor(totalSeconds / 60) + '分' + (totalSeconds % 60) + '秒'
        }),
        isOver && jsx('span', { className: 'time-warning', children: ' +' + overBy + '秒超過' })
      ]})
    }),
    jsx('div', { className: 'slide-list-items', children: slides.map((slide) =>
      jsx('div', {
        className: 'slide-item' + (slide.slideId === selectedSlideId ? ' selected' : ''),
        onClick: () => onSelectSlide(slide.slideId),
        children: [
          jsxs('div', { className: 'slide-item-header', children: [
            jsx('span', { className: 'slide-index', children: slide.index + 1 }),
            jsxs('span', { className: 'slide-time', children: [
              slide.timing.seconds + '秒',
              slide.timing.locked && jsx('span', { className: 'lock-icon', children: '🔒' })
            ]})
          ]}),
          jsx('div', { className: 'slide-title', children: slide.titleGuess }),
          slide.flags.length > 0 && jsx('div', { className: 'slide-flags', children:
            slide.flags.map((flag) => jsx('span', { key: flag, className: 'flag flag-' + flag, children: getFlagLabel(flag) }))
          })
        ]
      }, slide.slideId)
    )})
  ]});
}

function SlideEditor({ slide, onUpdate, loading }) {
  const [editingScript, setEditingScript] = useState(slide.script);
  const [editingTiming, setEditingTiming] = useState(slide.timing);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    setEditingScript(slide.script);
    setEditingTiming(slide.timing);
    setIsDirty(false);
  }, [slide.slideId]);

  const handleScriptChange = (field, value) => {
    setEditingScript((prev) => ({ ...prev, [field]: value }));
    setIsDirty(true);
  };

  const handleTimingChange = (field, value) => {
    setEditingTiming((prev) => ({ ...prev, [field]: value }));
    setIsDirty(true);
  };

  const handleSave = () => {
    onUpdate({ script: editingScript, timing: editingTiming });
    setIsDirty(false);
  };

  return jsx('div', { className: 'slide-editor', children: [
    jsxs('div', { className: 'editor-header', children: [
      jsx('h2', { children: 'スライド ' + (slide.index + 1) + ': ' + slide.titleGuess }),
      isDirty && jsx('button', { className: 'save-button', onClick: handleSave, disabled: loading, children: loading ? '保存中...' : '保存' })
    ]}),

    jsxs('div', { className: 'editor-section', children: [
      jsx('label', { className: 'editor-label', children: '時間設定' }),
      jsxs('div', { className: 'timing-controls', children: [
        jsxs('div', { className: 'timing-input', children: [
          jsx('label', { children: '秒数' }),
          jsx('input', { type: 'number', min: editingTiming.minSeconds, max: editingTiming.maxSeconds, value: editingTiming.seconds, onChange: (e) => handleTimingChange('seconds', parseInt(e.target.value) || 0) }),
          jsx('span', { className: 'timing-range', children: '(' + editingTiming.minSeconds + '〜' + editingTiming.maxSeconds + '秒)' })
        ]}),
        jsxs('label', { className: 'timing-lock', children: [
          jsx('input', { type: 'checkbox', checked: editingTiming.locked, onChange: (e) => handleTimingChange('locked', e.target.checked) }),
          '時間を固定'
        ]})
      ]})
    ]}),

    jsxs('div', { className: 'editor-section', children: [
      jsx('label', { className: 'editor-label', children: '目標' }),
      jsx('input', { type: 'text', className: 'goal-input', value: editingScript.goal, onChange: (e) => handleScriptChange('goal', e.target.value), placeholder: 'このスライドで伝えたいこと' })
    ]}),

    jsxs('div', { className: 'editor-section', children: [
      jsx('label', { className: 'editor-label', children: '台本' }),
      jsx('textarea', { className: 'talktrack-input', value: editingScript.talkTrack, onChange: (e) => handleScriptChange('talkTrack', e.target.value), placeholder: '話す内容を入力...', rows: 8 })
    ]}),

    jsxs('div', { className: 'editor-section', children: [
      jsx('label', { className: 'editor-label', children: 'ポイント' }),
      jsx('div', { className: 'keypoints-list', children: [
        ...editingScript.keyPoints.map((point, index) =>
          jsxs('div', { className: 'keypoint-item', children: [
            jsx('input', { type: 'text', value: point, onChange: (e) => {
              const newPoints = [...editingScript.keyPoints];
              newPoints[index] = e.target.value;
              handleScriptChange('keyPoints', newPoints);
            }}),
            jsx('button', { className: 'remove-point', onClick: () => {
              const newPoints = editingScript.keyPoints.filter((_, i) => i !== index);
              handleScriptChange('keyPoints', newPoints);
            }, children: '×' })
          ]}, index)
        ),
        jsx('button', { className: 'add-point', onClick: () => handleScriptChange('keyPoints', [...editingScript.keyPoints, '']), children: '+ ポイントを追加' })
      ]})
    ]}),

    jsxs('div', { className: 'editor-section raw-content', children: [
      jsx('label', { className: 'editor-label', children: '元のスライド内容' }),
      jsx('pre', { className: 'raw-text', children: slide.raw.text })
    ]})
  ]});
}

function EmptyState() {
  return jsx('div', { className: 'empty-state', children: [
    jsx('div', { className: 'empty-icon', children: '📄' }),
    jsx('h2', { children: 'プレゼンテーションを読み込んでください' }),
    jsxs('p', { children: [
      'PDFまたはPPTXファイルをチャットにアップロードすると、',
      jsx('br'),
      'スライドの台本を自動生成します。'
    ]}),
    jsx('div', { className: 'empty-steps', children: [
      jsxs('div', { className: 'step', children: [
        jsx('span', { className: 'step-num', children: '1' }),
        jsx('span', { children: 'PDFまたはPPTXファイルをアップロード' })
      ]}),
      jsxs('div', { className: 'step', children: [
        jsx('span', { className: 'step-num', children: '2' }),
        jsx('span', { children: '「台本を生成して」と依頼' })
      ]}),
      jsxs('div', { className: 'step', children: [
        jsx('span', { className: 'step-num', children: '3' }),
        jsx('span', { children: '生成された台本を編集・調整' })
      ]})
    ]})
  ]});
}

function App() {
  const data = useToolOutput();
  const [widgetState, setWidgetState] = useWidgetState();
  const { callTool, loading } = useCallTool();

  if (!data) {
    return jsx(EmptyState);
  }

  const { project, slides } = data;
  const selectedSlideId = widgetState.selectedSlideId || slides[0]?.slideId || null;
  const selectedSlide = slides.find((s) => s.slideId === selectedSlideId) || slides[0];

  const handleSelectSlide = (slideId) => {
    setWidgetState({ selectedSlideId: slideId });
  };

  const handleUpdateSlide = async (patch) => {
    if (selectedSlide) {
      await callTool('update_slide', { projectId: project.projectId, slideId: selectedSlide.slideId, patch });
    }
  };

  const handleRebalance = async () => {
    await callTool('rebalance_timing', { projectId: project.projectId });
  };

  const handleExport = async () => {
    await callTool('export_script', { projectId: project.projectId, format: 'markdown' });
  };

  return jsx('div', { className: 'app', children: [
    jsx(Header, { project, onRebalance: handleRebalance, onExport: handleExport, loading }),
    jsxs('div', { className: 'app-content', children: [
      jsx('aside', { className: 'sidebar', children:
        jsx(SlideList, {
          slides,
          selectedSlideId,
          onSelectSlide: handleSelectSlide,
          totalSeconds: project.settings.totalSeconds - project.settings.qaBufferSeconds,
          allocatedSeconds: project.stats.allocatedSeconds
        })
      }),
      jsx('main', { className: 'main-content', children:
        selectedSlide
          ? jsx(SlideEditor, { slide: selectedSlide, onUpdate: handleUpdateSlide, loading })
          : jsx('div', { className: 'no-slide-selected', children: 'スライドを選択してください' })
      })
    ]})
  ]});
}

// Mount the app
const root = document.getElementById('root');
if (root) {
  createRoot(root).render(jsx(App));
}
`;
