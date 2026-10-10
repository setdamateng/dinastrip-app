/** Pemberitahuan sederhana antar layar: "data SPT berubah, muat ulang daftar". */
type Listener = () => void;
const listeners = new Set<Listener>();

export const sptEvents = {
  changed() {
    listeners.forEach((f) => f());
  },
  onChanged(f: Listener) {
    listeners.add(f);
    return () => {
      listeners.delete(f);
    };
  },
};
