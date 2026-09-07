// Thin fetch wrapper around the AI Trip Planner backend REST API.
// Every function takes the current `apiUrl` explicitly (instead of a module-level
// constant) so the UI's editable "API Host" field keeps working exactly as before.
// Behavior (endpoints, headers, query params, response shapes) is unchanged from
// the original inline fetch() calls in App.jsx -- this file only centralizes them.

async function parseJsonSafe(res) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

// ---- Auth ----------------------------------------------------------------

export async function authRequest(apiUrl, endpoint, { username, password }) {
  const res = await fetch(`${apiUrl}/auth/${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  const data = await parseJsonSafe(res);
  return { ok: res.ok, data };
}

// ---- Trips ------------------------------------------------------------

export async function fetchTripsApi(apiUrl, userId) {
  const res = await fetch(`${apiUrl}/trips`, {
    headers: { x_user_id: userId },
  });
  return parseJsonSafe(res);
}

export async function createTripApi(apiUrl, userId, { title, destination }) {
  const res = await fetch(`${apiUrl}/trips`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      x_user_id: userId,
    },
    body: JSON.stringify({ title, destination }),
  });
  return parseJsonSafe(res);
}

// ---- Preferences --------------------------------------------------------

export async function fetchPreferencesApi(apiUrl, userId) {
  const res = await fetch(`${apiUrl}/preferences`, {
    headers: { x_user_id: userId },
  });
  return parseJsonSafe(res);
}

export async function savePreferencesApi(apiUrl, userId, preferences) {
  const res = await fetch(`${apiUrl}/preferences`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      x_user_id: userId,
    },
    body: JSON.stringify(preferences),
  });
  return parseJsonSafe(res);
}

// ---- Subscription ---------------------------------------------------------

export async function fetchSubscriptionApi(apiUrl, userId) {
  const res = await fetch(`${apiUrl}/subscription/status`, {
    headers: { x_user_id: userId },
  });
  return parseJsonSafe(res);
}

export async function verifyCheckoutSessionApi(apiUrl, { sessionId, userId, tier }) {
  const res = await fetch(
    `${apiUrl}/subscription/verify-checkout-session?session_id=${sessionId}&user_id=${userId}&tier=${tier || 'pro'}`
  );
  return parseJsonSafe(res);
}

export async function createCheckoutSessionApi(apiUrl, { userId, subscriptionType, origin }) {
  const res = await fetch(`${apiUrl}/subscription/create-checkout-session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_id: userId,
      subscription_type: subscriptionType,
      origin,
    }),
  });
  const data = await parseJsonSafe(res);
  return { ok: res.ok, data };
}

// ---- History / Versions ----------------------------------------------

export async function fetchVersionsApi(apiUrl, tripId) {
  const res = await fetch(`${apiUrl}/history/${tripId}/versions`);
  return parseJsonSafe(res);
}

export async function fetchHistoryApi(apiUrl, tripId) {
  const res = await fetch(`${apiUrl}/history/${tripId}`);
  return parseJsonSafe(res);
}

export async function rollbackVersionApi(apiUrl, tripId, versionNum) {
  const res = await fetch(`${apiUrl}/history/${tripId}/rollback/${versionNum}`, {
    method: 'POST',
  });
  return parseJsonSafe(res);
}

// ---- Chat -----------------------------------------------------------------

export async function sendChatMessageApi(apiUrl, tripId, userId, question) {
  const res = await fetch(
    `${apiUrl}/trips/${tripId}/chat?question=${encodeURIComponent(question)}`,
    { headers: { x_user_id: userId } }
  );
  const data = await parseJsonSafe(res);
  return { status: res.status, data };
}
