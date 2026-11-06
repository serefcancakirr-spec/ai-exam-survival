import { useEffect, useRef } from 'react';
import { useLocation } from 'wouter';

/**
 * Scrolls to a section of the current page by its id (for example "all-tools").
 * Returns true when the section was found.
 */
export function scrollToSection(id: string) {
  const section = document.getElementById(id);
  if (!section) return false;
  section.scrollIntoView({ block: 'start' });
  return true;
}

/**
 * Use as the onClick of a link such as "/#all-tools".
 * Waits one frame so the new page (if any) is on screen, then scrolls.
 * This also works when the visitor is already on that page.
 */
export function scrollToSectionSoon(id: string) {
  window.requestAnimationFrame(() => {
    scrollToSection(id);
  });
}

/**
 * Page-change scrolling.
 *
 * Wouter swaps pages without a full reload, so the browser keeps the old
 * scroll position. This component runs whenever the page (path) changes:
 * - if the address has a #section, it scrolls to that section;
 * - otherwise it jumps to the top of the new page.
 *
 * It does nothing on the very first load, so a page refresh keeps the
 * browser's normal behaviour. It draws nothing on screen.
 */
export default function ScrollManager() {
  const [location] = useLocation();
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      const sectionId = decodeURIComponent(window.location.hash.slice(1));
      if (sectionId && scrollToSection(sectionId)) return;
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [location]);

  return null;
}
