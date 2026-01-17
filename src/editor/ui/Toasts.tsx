import { useEffect } from 'react';
import { useEditorStore } from '../state/editorStore';

export function Toasts() {
  const toasts = useEditorStore((state) => state.toasts);
  const removeToast = useEditorStore((state) => state.removeToast);

  useEffect(() => {
    if (toasts.length === 0) {
      return;
    }
    const timers = toasts.map((toast) =>
      window.setTimeout(() => removeToast(toast.id), 2600),
    );
    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [toasts, removeToast]);

  return (
    <div className="pointer-events-none absolute right-4 top-20 flex flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto rounded border px-4 py-2 text-sm shadow ${
            toast.tone === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
              : toast.tone === 'error'
                ? 'border-rose-200 bg-rose-50 text-rose-700'
                : 'border-slate-200 bg-white text-slate-700'
          }`}
        >
          {toast.message}
        </div>
      ))}
    </div>
  );
}
