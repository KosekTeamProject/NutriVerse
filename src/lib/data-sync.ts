export function notifyDataChanged() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("nutriverse:data-changed"));
  }
}
