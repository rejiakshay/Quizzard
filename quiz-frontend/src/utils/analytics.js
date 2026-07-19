import posthog from 'posthog-js';

const KEY = 'phc_p2BLyPRHYMeFsfE6B7kunLEwJwxfuUR7MegLvnUvLxvU';
const HOST = 'https://us.i.posthog.com';

export function initAnalytics() {
  posthog.init(KEY, {
    api_host: HOST,
    person_profiles: 'identified_only',
    capture_pageview: true,
    capture_pageleave: true,
    session_recording: { maskAllInputs: true },
  });
}

export function identifyUser(user) {
  if (!user?.id) return;
  posthog.identify(String(user.id), {
    email: user.email,
    name: user.name,
    level: user.totalPoints,
  });
}

export function resetUser() {
  posthog.reset();
}

export function trackEvent(event, props = {}) {
  posthog.capture(event, props);
}
