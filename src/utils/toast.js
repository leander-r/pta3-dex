// ============================================================
// Toast Notification System
// ============================================================
// Global toast utility - works from both React components and plain JS modules

let listeners = [];
let toastId = 0;

const toast = {
    // action: optional { label: string, onClick: () => void } — renders a button inside the toast
    show(message, type = 'info', duration = 4000, action = null) {
        const id = ++toastId;
        const t = { id, message, type, duration, action };
        listeners.forEach(fn => fn(t));
        return id;
    },
    success(message, duration = 3000) { return this.show(message, 'success', duration); },
    error(message, duration = 6000) { return this.show(message, 'error', duration); },
    warning(message, duration = 5000) { return this.show(message, 'warning', duration); },
    info(message, duration = 4000) { return this.show(message, 'info', duration); },
    subscribe(fn) {
        listeners.push(fn);
        return () => { listeners = listeners.filter(l => l !== fn); };
    }
};

export default toast;
