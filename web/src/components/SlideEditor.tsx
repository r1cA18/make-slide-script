import { useState, useEffect } from "react";
import type { Slide, SlideScript, SlideTiming } from "../types";

interface SlideEditorProps {
  slide: Slide;
  onUpdate: (patch: Partial<Pick<Slide, "timing" | "script">>) => void;
  loading?: boolean;
}

export function SlideEditor({ slide, onUpdate, loading }: SlideEditorProps) {
  const [editingScript, setEditingScript] = useState<SlideScript>(slide.script);
  const [editingTiming, setEditingTiming] = useState<SlideTiming>(slide.timing);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    setEditingScript(slide.script);
    setEditingTiming(slide.timing);
    setIsDirty(false);
  }, [slide.slideId]);

  const handleScriptChange = (field: keyof SlideScript, value: string | string[]) => {
    setEditingScript((prev) => ({ ...prev, [field]: value }));
    setIsDirty(true);
  };

  const handleTimingChange = (field: keyof SlideTiming, value: number | boolean) => {
    setEditingTiming((prev) => ({ ...prev, [field]: value }));
    setIsDirty(true);
  };

  const handleSave = () => {
    onUpdate({
      script: editingScript,
      timing: editingTiming,
    });
    setIsDirty(false);
  };

  return (
    <div className="slide-editor">
      <div className="editor-header">
        <h2>
          スライド {slide.index + 1}: {slide.titleGuess}
        </h2>
        {isDirty && (
          <button className="save-button" onClick={handleSave} disabled={loading}>
            {loading ? "保存中..." : "保存"}
          </button>
        )}
      </div>

      <div className="editor-section">
        <label className="editor-label">時間設定</label>
        <div className="timing-controls">
          <div className="timing-input">
            <label>秒数</label>
            <input
              type="number"
              min={editingTiming.minSeconds}
              max={editingTiming.maxSeconds}
              value={editingTiming.seconds}
              onChange={(e) => handleTimingChange("seconds", parseInt(e.target.value) || 0)}
            />
            <span className="timing-range">
              ({editingTiming.minSeconds}〜{editingTiming.maxSeconds}秒)
            </span>
          </div>
          <label className="timing-lock">
            <input
              type="checkbox"
              checked={editingTiming.locked}
              onChange={(e) => handleTimingChange("locked", e.target.checked)}
            />
            時間を固定
          </label>
        </div>
      </div>

      <div className="editor-section">
        <label className="editor-label">目標</label>
        <input
          type="text"
          className="goal-input"
          value={editingScript.goal}
          onChange={(e) => handleScriptChange("goal", e.target.value)}
          placeholder="このスライドで伝えたいこと"
        />
      </div>

      <div className="editor-section">
        <label className="editor-label">台本</label>
        <textarea
          className="talktrack-input"
          value={editingScript.talkTrack}
          onChange={(e) => handleScriptChange("talkTrack", e.target.value)}
          placeholder="話す内容を入力..."
          rows={8}
        />
      </div>

      <div className="editor-section">
        <label className="editor-label">ポイント</label>
        <div className="keypoints-list">
          {editingScript.keyPoints.map((point, index) => (
            <div key={index} className="keypoint-item">
              <input
                type="text"
                value={point}
                onChange={(e) => {
                  const newPoints = [...editingScript.keyPoints];
                  newPoints[index] = e.target.value;
                  handleScriptChange("keyPoints", newPoints);
                }}
              />
              <button
                className="remove-point"
                onClick={() => {
                  const newPoints = editingScript.keyPoints.filter((_, i) => i !== index);
                  handleScriptChange("keyPoints", newPoints);
                }}
              >
                ×
              </button>
            </div>
          ))}
          <button
            className="add-point"
            onClick={() => handleScriptChange("keyPoints", [...editingScript.keyPoints, ""])}
          >
            + ポイントを追加
          </button>
        </div>
      </div>

      <div className="editor-section">
        <label className="editor-label">トランジション</label>
        <div className="transition-inputs">
          <div>
            <label>導入</label>
            <input
              type="text"
              value={editingScript.transitionIn || ""}
              onChange={(e) => handleScriptChange("transitionIn", e.target.value)}
              placeholder="前のスライドからの繋ぎ"
            />
          </div>
          <div>
            <label>締め</label>
            <input
              type="text"
              value={editingScript.transitionOut || ""}
              onChange={(e) => handleScriptChange("transitionOut", e.target.value)}
              placeholder="次のスライドへの繋ぎ"
            />
          </div>
        </div>
      </div>

      <div className="editor-section raw-content">
        <label className="editor-label">元のスライド内容</label>
        <pre className="raw-text">{slide.raw.text}</pre>
      </div>
    </div>
  );
}
