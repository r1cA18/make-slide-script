import type { Slide } from "../types";

interface SlideListProps {
  slides: Slide[];
  selectedSlideId: string | null;
  onSelectSlide: (slideId: string) => void;
  totalSeconds: number;
  allocatedSeconds: number;
}

export function SlideList({
  slides,
  selectedSlideId,
  onSelectSlide,
  totalSeconds,
  allocatedSeconds,
}: SlideListProps) {
  const overBy = allocatedSeconds - totalSeconds;
  const isOver = overBy > 0;

  return (
    <div className="slide-list">
      <div className="slide-list-header">
        <div className="time-summary">
          <span className={isOver ? "time-over" : "time-ok"}>
            {formatTime(allocatedSeconds)} / {formatTime(totalSeconds)}
          </span>
          {isOver && <span className="time-warning">+{overBy}秒超過</span>}
        </div>
      </div>

      <div className="slide-list-items">
        {slides.map((slide) => (
          <div
            key={slide.slideId}
            className={`slide-item ${slide.slideId === selectedSlideId ? "selected" : ""}`}
            onClick={() => onSelectSlide(slide.slideId)}
          >
            <div className="slide-item-header">
              <span className="slide-index">{slide.index + 1}</span>
              <span className="slide-time">
                {slide.timing.seconds}秒
                {slide.timing.locked && <span className="lock-icon">🔒</span>}
              </span>
            </div>
            <div className="slide-title">{slide.titleGuess}</div>
            {slide.flags.length > 0 && (
              <div className="slide-flags">
                {slide.flags.map((flag) => (
                  <span key={flag} className={`flag flag-${flag}`}>
                    {getFlagLabel(flag)}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins > 0) {
    return `${mins}分${secs > 0 ? `${secs}秒` : ""}`;
  }
  return `${secs}秒`;
}

function getFlagLabel(flag: string): string {
  switch (flag) {
    case "too_long":
      return "長い";
    case "too_short":
      return "短い";
    case "dense":
      return "内容多";
    case "needs_context":
      return "補足要";
    default:
      return flag;
  }
}
