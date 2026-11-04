import { useEffect, useRef } from 'react';
import { useLayerCount } from '../nav.js';
import { track } from '../analytics.js';
import {
  useInstallMode, installPlatform, turnOffInstallHint, promptInstall,
} from '../install.js';

const TITLE = 'Thêm Tơ Hồng vào màn hình chính';

// Khối nằm trong luồng bố cục, ngay trên thanh tab (không phủ lên màn nào).
export function InstallHint({ suppressed = false, scrollHidden = false }) {
  const mode = useInstallMode();
  const layers = useLayerCount();
  // Có lớp phủ đang mở thì ẩn (ADR-011); kéo nội dung lên thì ẩn, kéo xuống thì hiện (T-054 mục 8).
  // Ẩn bằng opacity + không nhận chạm/focus nhưng GIỮ CHỖ: gỡ khỏi luồng sẽ làm khoảng cuộn co lại,
  // scrollY bị kẹp và nội dung nhảy (spec 5.1, 8.5). Lớp phủ nay là position: fixed nên không bị khối đẩy.
  const present = !suppressed && mode !== '';
  const visible = present && layers === 0 && !scrollHidden;
  const shownRef = useRef(false);

  useEffect(() => {
    if (visible && !shownRef.current) {
      shownRef.current = true;
      track('install_hint_shown', { platform: installPlatform() });
    }
  }, [visible]);

  if (!present) return null;

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
    <div className={`install-hint${visible ? '' : ' is-concealed'}`} role="region" aria-label={TITLE} inert={visible ? undefined : true}>
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
