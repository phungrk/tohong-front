import { useEffect } from 'react';
import { track } from '../analytics.js';
import {
  useInstallMode, installPlatform, turnOffInstallHint, promptInstall,
} from '../install.js';

const TITLE = 'Thêm Tơ Hồng vào màn hình chính';

// Khối nằm trong luồng bố cục, ngay trên thanh tab (không phủ lên màn nào).
export function InstallHint({ suppressed = false }) {
  const mode = useInstallMode();
  const visible = !suppressed && mode !== '';

  useEffect(() => {
    if (visible) track('install_hint_shown', { platform: installPlatform() });
  }, [visible]);

  if (!visible) return null;

  const dismiss = () => {
    track('install_hint_dismissed', { platform: installPlatform() });
    turnOffInstallHint();
  };
  const install = async () => {
    const platform = installPlatform();
    const outcome = await promptInstall();
    if (outcome) track('install_prompt_result', { platform, outcome });
  };

  return (
    <div className="install-hint" role="region" aria-label={TITLE}>
      <strong className="install-hint-title">{TITLE}</strong>
      {mode === 'ios' && (
        <p className="install-hint-text">Bấm nút Chia sẻ, rồi chọn Thêm vào MH chính.</p>
      )}
      <div className="install-hint-actions">
        {mode === 'prompt' && (
          <button type="button" className="install-hint-primary" onClick={install}>Cài ứng dụng</button>
        )}
        <button type="button" className="install-hint-quiet" onClick={dismiss}>Không nhắc lại</button>
      </div>
    </div>
  );
}
