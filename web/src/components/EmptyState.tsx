export function EmptyState() {
  return (
    <div className="empty-state">
      <div className="empty-icon">📄</div>
      <h2>プレゼンテーションを読み込んでください</h2>
      <p>
        PDFまたはPPTXファイルをチャットにアップロードすると、
        <br />
        スライドの台本を自動生成します。
      </p>
      <div className="empty-steps">
        <div className="step">
          <span className="step-num">1</span>
          <span>PDFまたはPPTXファイルをアップロード</span>
        </div>
        <div className="step">
          <span className="step-num">2</span>
          <span>「台本を生成して」と依頼</span>
        </div>
        <div className="step">
          <span className="step-num">3</span>
          <span>生成された台本を編集・調整</span>
        </div>
      </div>
    </div>
  );
}
