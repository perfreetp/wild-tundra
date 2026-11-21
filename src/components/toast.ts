import { ref } from "vue";

export interface Toast {
  id: number;
  text: string;
  kind: "ok" | "err" | "info";
}

export const toasts = ref<Toast[]>([]);
let seq = 0;

export function pushToast(text: string, kind: Toast["kind"] = "info") {
  const id = ++seq;
  toasts.value.push({ id, text, kind });
  window.setTimeout(() => {
    toasts.value = toasts.value.filter((t) => t.id !== id);
  }, 3400);
}
