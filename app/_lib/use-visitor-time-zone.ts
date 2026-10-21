"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

function getTimeZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

function getServerTimeZone(): string {
  return "";
}

// Devuelve la zona del navegador tras la hidratación, sin desajustes con el servidor.
export function useVisitorTimeZone(): string {
  return useSyncExternalStore(subscribe, getTimeZone, getServerTimeZone);
}
