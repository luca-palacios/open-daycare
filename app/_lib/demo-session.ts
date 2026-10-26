export const DEMO_SESSION_COOKIE = "odc-demo-session";
export const DEMO_SESSION_VALUE = "demo";
export const DEMO_SESSION_MAX_AGE = 60 * 60 * 8;

const COOKIE_ATTRIBUTES = "path=/; SameSite=Lax";

export function isDemoSessionValue(value: string | undefined): boolean {
  return value === DEMO_SESSION_VALUE;
}

// La cookie la escribe y la borra el cliente: no es HttpOnly y no guarda datos.
export function startDemoSession(): void {
  document.cookie = `${DEMO_SESSION_COOKIE}=${DEMO_SESSION_VALUE}; ${COOKIE_ATTRIBUTES}; max-age=${DEMO_SESSION_MAX_AGE}`;
}

export function endDemoSession(): void {
  document.cookie = `${DEMO_SESSION_COOKIE}=; ${COOKIE_ATTRIBUTES}; max-age=0`;
}
