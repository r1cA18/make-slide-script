import { useToolOutput, useWidgetState, useUpdateSlide, useRebalanceTiming, useExportScript } from "./openai-hooks";
import { Header } from "./components/Header";
import { SlideList } from "./components/SlideList";
import { SlideEditor } from "./components/SlideEditor";
import { EmptyState } from "./components/EmptyState";
import type { Slide } from "./types";

export function App() {
  const data = useToolOutput();
  const [widgetState, setWidgetState] = useWidgetState();

  const projectId = data?.project.projectId;
  const { updateSlide, loading: updateLoading } = useUpdateSlide(projectId);
  const { rebalance, loading: rebalanceLoading } = useRebalanceTiming(projectId);
  const { exportScript, loading: exportLoading } = useExportScript(projectId);

  if (!data) {
    return <EmptyState />;
  }

  const { project, slides } = data;
  const selectedSlideId = widgetState.selectedSlideId || slides[0]?.slideId || null;
  const selectedSlide = slides.find((s) => s.slideId === selectedSlideId) || slides[0];

  const handleSelectSlide = (slideId: string) => {
    setWidgetState({ selectedSlideId: slideId });
  };

  const handleUpdateSlide = async (patch: Partial<Pick<Slide, "timing" | "script">>) => {
    if (selectedSlide) {
      await updateSlide(selectedSlide.slideId, patch);
    }
  };

  const handleRebalance = async () => {
    await rebalance();
  };

  const handleExport = async () => {
    const result = await exportScript("markdown");
    if (result) {
      // The export result will be shown in the chat
      console.log("Exported successfully");
    }
  };

  const isLoading = updateLoading || rebalanceLoading || exportLoading;

  return (
    <div className="app">
      <Header project={project} onRebalance={handleRebalance} onExport={handleExport} loading={isLoading} />

      <div className="app-content">
        <aside className="sidebar">
          <SlideList
            slides={slides}
            selectedSlideId={selectedSlideId}
            onSelectSlide={handleSelectSlide}
            totalSeconds={project.settings.totalSeconds - project.settings.qaBufferSeconds}
            allocatedSeconds={project.stats.allocatedSeconds}
          />
        </aside>

        <main className="main-content">
          {selectedSlide ? (
            <SlideEditor slide={selectedSlide} onUpdate={handleUpdateSlide} loading={updateLoading} />
          ) : (
            <div className="no-slide-selected">スライドを選択してください</div>
          )}
        </main>
      </div>
    </div>
  );
}
