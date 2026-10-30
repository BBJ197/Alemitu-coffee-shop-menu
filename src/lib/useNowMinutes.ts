import { useSyncExternalStore } from "react";
import { minutesInShopTime } from "./schedule";

// One shared timer for every component that asks for the time.
const listeners = new Set<() => void>();
let timer: ReturnType<typeof setInterval> | undefined;

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (listeners.size === 1) {
    timer = setInterval(() => listeners.forEach((l) => l()), 30_000);
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      clearInterval(timer);
      timer = undefined;
    }
  };
}

const read = () => minutesInShopTime(new Date());

/** The current time in minutes since midnight on the shop's clock, kept fresh. */
export function useNowMinutes(): number {
  return useSyncExternalStore(subscribe, read, read);
}
