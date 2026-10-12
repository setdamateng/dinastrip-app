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

/** Data master (pegawai/OPD) berubah -> daftar memuat ulang. */
const masterListeners = new Set<Listener>();
export const masterEvents = {
  changed() {
    masterListeners.forEach((f) => f());
  },
  onChanged(f: Listener) {
    masterListeners.add(f);
    return () => {
      masterListeners.delete(f);
    };
  },
};
