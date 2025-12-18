import type { Project } from "../types";

interface HeaderProps {
  project: Project;
  onRebalance: () => void;
  onExport: () => void;
  loading?: boolean;
}

export function Header({ project, onRebalance, onExport, loading }: HeaderProps) {
  const { stats, settings } = project;
  const overBy = stats.allocatedSeconds - (settings.totalSeconds - settings.qaBufferSeconds);
  const isOver = overBy > 0;

  return (
    <header className="app-header">
      <div className="header-left">
        <h1 className="project-title">{project.title}</h1>
        <div className="project-meta">
          <span>{stats.slideCount}スライド</span>
          <span className="separator">|</span>
          <span className={isOver ? "time-warning" : ""}>
            {Math.floor(stats.allocatedSeconds / 60)}分{stats.allocatedSeconds % 60}秒 /{" "}
            {Math.floor(settings.totalSeconds / 60)}分
          </span>
          {isOver && <span className="over-badge">+{overBy}秒超過</span>}
        </div>
      </div>

      <div className="header-right">
        <button className="btn btn-secondary" onClick={onRebalance} disabled={loading}>
          時間再配分
        </button>
        <button className="btn btn-primary" onClick={onExport} disabled={loading}>
          エクスポート
        </button>
      </div>
    </header>
  );
}
