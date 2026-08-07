// hooks/useClickOutside.ts
import { useEffect, type RefObject } from "react";

export function useClickOutside(
  ref: RefObject<HTMLElement>,
  onOutside: () => void
) {
  useEffect(() => {
    function handlePointer(e: PointerEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onOutside();
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onOutside();
    }
    document.addEventListener("pointerdown", handlePointer);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("pointerdown", handlePointer);
      document.removeEventListener("keydown", handleKey);
    };
  }, [ref, onOutside]);
}