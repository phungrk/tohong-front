import { useCallback, useEffect, useState } from 'react';
import { adminErrMsg } from './format.js';

// Tải dữ liệu admin. `fetcher` phải ổn định (bọc useCallback theo tham số lọc).
// - Đổi fetcher → data về null (đang tải); gọi reload() → giữ dữ liệu cũ cho tới khi có bản mới.
// - loadedAt tăng sau mỗi lần tải thành công, dùng làm key để khởi tạo lại form.
export function useLoad(fetcher) {
  const [state, setState] = useState({ fetcher: null, data: null, error: '', status: 0, loadedAt: 0 });
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let alive = true;
    fetcher()
      .then((data) => {
        if (alive) setState((s) => ({ fetcher, data, error: '', status: 0, loadedAt: s.loadedAt + 1 }));
      })
      .catch((err) => {
        if (alive) {
          setState((s) => ({
            fetcher,
            data: s.fetcher === fetcher ? s.data : null,
            error: adminErrMsg(err),
            status: err.status || 0,
            loadedAt: s.loadedAt,
          }));
        }
      });
    return () => { alive = false; };
  }, [fetcher, tick]);

  const reload = useCallback(() => setTick((t) => t + 1), []);
  const current = state.fetcher === fetcher;
  return {
    data: current ? state.data : null,
    error: current ? state.error : '',
    status: current ? state.status : 0,
    loadedAt: state.loadedAt,
    loading: !current || (state.data === null && !state.error),
    reload,
  };
}
