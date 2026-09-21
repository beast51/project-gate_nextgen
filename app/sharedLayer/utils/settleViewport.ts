// iOS, an installed PWA most of all, may leave the page shifted after the on-screen keyboard closes: the fixed
// header and the fixed navigation stay where the keyboard pushed them until the page is laid out again.
// A scroll by one pixel and back makes the browser do it. Call it when a text field loses focus.
export const settleViewportAfterKeyboard = () => {
  if (typeof window === 'undefined') return;

  // the keyboard takes a moment to slide away; a field that got the focus next keeps the keyboard open
  window.setTimeout(() => {
    const active = document.activeElement;
    if (active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement) return;

    window.requestAnimationFrame(() => {
      window.scrollBy(0, 1);
      window.scrollBy(0, -1);
    });
  }, 300);
};
