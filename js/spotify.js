/**
 * Vox Gym - Spotify Integration Service
 * Implements OAuth 2.0 PKCE flow & Spotify Connect Playback Control
 */

const SPOTIFY_CLIENT_ID = "f6b3cad634b848fc93849f35e698ff02";
const SPOTIFY_AUTH_ENDPOINT = "https://accounts.spotify.com/authorize";
const SPOTIFY_TOKEN_ENDPOINT = "https://accounts.spotify.com/api/token";
const SPOTIFY_API_BASE = "https://api.spotify.com/v1";

const STORAGE_KEYS = {
  ACCESS_TOKEN: "vox_spotify_access_token",
  REFRESH_TOKEN: "vox_spotify_refresh_token",
  EXPIRES_AT: "vox_spotify_expires_at",
  CODE_VERIFIER: "vox_spotify_code_verifier",
  WIDGET_DISMISSED: "vox_spotify_widget_dismissed"
};

const SCOPES = [
  "user-read-playback-state",
  "user-modify-playback-state",
  "user-read-currently-playing"
];

export class SpotifyService {
  constructor(options = {}) {
    this.clientId = options.clientId || SPOTIFY_CLIENT_ID;
    this.onStateChange = options.onStateChange || (() => {});
    this.pollInterval = null;
    this.lastState = null;
    this.isPolling = false;
  }

  getRedirectUri() {
    return window.location.origin + window.location.pathname;
  }

  // =========================================================================
  // PKCE Crypto Helpers
  // =========================================================================
  generateRandomString(length) {
    const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
    const values = crypto.getRandomValues(new Uint8Array(length));
    return values.reduce((acc, x) => acc + possible[x % possible.length], "");
  }

  async sha256(plain) {
    const encoder = new TextEncoder();
    const data = encoder.encode(plain);
    return window.crypto.subtle.digest("SHA-256", data);
  }

  base64encode(input) {
    return btoa(String.fromCharCode(...new Uint8Array(input)))
      .replace(/=/g, "")
      .replace(/\+/g, "-")
      .replace(/\//g, "_");
  }

  // =========================================================================
  // Authentication & OAuth Flow
  // =========================================================================
  async initiateAuth() {
    const codeVerifier = this.generateRandomString(64);
    const hashed = await this.sha256(codeVerifier);
    const codeChallenge = this.base64encode(hashed);

    window.localStorage.setItem(STORAGE_KEYS.CODE_VERIFIER, codeVerifier);
    this.setWidgetDismissed(false);

    const params = new URLSearchParams({
      client_id: this.clientId,
      response_type: "code",
      redirect_uri: this.getRedirectUri(),
      scope: SCOPES.join(" "),
      code_challenge_method: "S256",
      code_challenge: codeChallenge
    });

    window.location.href = `${SPOTIFY_AUTH_ENDPOINT}?${params.toString()}`;
  }

  async handleCallbackIfPresent() {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("code");
    const error = urlParams.get("error");

    if (error) {
      console.warn("Spotify auth cancelled or error:", error);
      this.cleanUrlParams();
      return false;
    }

    if (!code) return false;

    const codeVerifier = window.localStorage.getItem(STORAGE_KEYS.CODE_VERIFIER);
    if (!codeVerifier) {
      console.warn("Spotify: Missing PKCE code_verifier");
      this.cleanUrlParams();
      return false;
    }

    try {
      const payload = {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: this.clientId,
          grant_type: "authorization_code",
          code,
          redirect_uri: this.getRedirectUri(),
          code_verifier: codeVerifier
        })
      };

      const response = await fetch(SPOTIFY_TOKEN_ENDPOINT, payload);
      const data = await response.json();

      if (data.access_token) {
        this.saveTokens(data);
        window.localStorage.removeItem(STORAGE_KEYS.CODE_VERIFIER);
        this.setWidgetDismissed(false);
      } else {
        console.error("Spotify token exchange failed:", data);
      }
    } catch (err) {
      console.error("Spotify OAuth error:", err);
    } finally {
      this.cleanUrlParams();
    }

    return this.isAuthenticated();
  }

  cleanUrlParams() {
    const cleanUrl = window.location.origin + window.location.pathname + window.location.hash;
    window.history.replaceState({}, document.title, cleanUrl);
  }

  saveTokens(data) {
    if (data.access_token) {
      window.localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, data.access_token);
      const expiresAt = Date.now() + (data.expires_in - 60) * 1000;
      window.localStorage.setItem(STORAGE_KEYS.EXPIRES_AT, expiresAt.toString());
    }
    if (data.refresh_token) {
      window.localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, data.refresh_token);
    }
  }

  async getAccessToken() {
    const token = window.localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    const expiresAt = parseInt(window.localStorage.getItem(STORAGE_KEYS.EXPIRES_AT) || "0", 10);

    if (!token) return null;

    if (Date.now() >= expiresAt) {
      return await this.refreshAccessToken();
    }
    return token;
  }

  async refreshAccessToken() {
    const refreshToken = window.localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
    if (!refreshToken) {
      this.disconnect();
      return null;
    }

    try {
      const response = await fetch(SPOTIFY_TOKEN_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "refresh_token",
          refresh_token: refreshToken,
          client_id: this.clientId
        })
      });

      const data = await response.json();
      if (data.access_token) {
        this.saveTokens(data);
        return data.access_token;
      } else {
        this.disconnect();
        return null;
      }
    } catch (e) {
      console.error("Error refreshing Spotify access token:", e);
      return null;
    }
  }

  isAuthenticated() {
    return !!window.localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  }

  disconnect() {
    window.localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    window.localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    window.localStorage.removeItem(STORAGE_KEYS.EXPIRES_AT);
    this.stopPolling();
    this.lastState = null;
    this.onStateChange({ isConnected: false });
  }

  isWidgetDismissed() {
    return window.localStorage.getItem(STORAGE_KEYS.WIDGET_DISMISSED) === "true";
  }

  setWidgetDismissed(dismissed) {
    if (dismissed) {
      window.localStorage.setItem(STORAGE_KEYS.WIDGET_DISMISSED, "true");
    } else {
      window.localStorage.removeItem(STORAGE_KEYS.WIDGET_DISMISSED);
    }
  }

  // =========================================================================
  // Playback Control API
  // =========================================================================
  async apiRequest(endpoint, method = "GET", body = null) {
    const token = await this.getAccessToken();
    if (!token) return null;

    try {
      const options = {
        method,
        headers: {
          Authorization: `Bearer ${token}`
        }
      };
      if (body) {
        options.headers["Content-Type"] = "application/json";
        options.body = JSON.stringify(body);
      }

      const res = await fetch(`${SPOTIFY_API_BASE}${endpoint}`, options);

      if (res.status === 204) return true;
      if (res.status === 401) {
        const freshToken = await this.refreshAccessToken();
        if (freshToken) return this.apiRequest(endpoint, method, body);
        return null;
      }
      if (!res.ok) {
        return null;
      }
      return await res.json();
    } catch (err) {
      console.warn("Spotify API error:", err);
      return null;
    }
  }

  async fetchPlaybackState() {
    const data = await this.apiRequest("/me/player");
    if (!data || !data.item) {
      return {
        isConnected: true,
        hasActiveDevice: !!(data && data.device),
        isPlaying: false,
        trackName: null,
        artistName: null,
        albumArt: null,
        deviceName: data?.device?.name || null
      };
    }

    const track = data.item;
    return {
      isConnected: true,
      hasActiveDevice: true,
      isPlaying: data.is_playing,
      trackName: track.name,
      artistName: track.artists?.map(a => a.name).join(", "),
      albumArt: track.album?.images?.[2]?.url || track.album?.images?.[0]?.url || null,
      deviceName: data.device?.name || "Spotify Player"
    };
  }

  async togglePlayPause() {
    if (!this.lastState) return;
    if (this.lastState.isPlaying) {
      await this.apiRequest("/me/player/pause", "PUT");
    } else {
      await this.apiRequest("/me/player/play", "PUT");
    }
    setTimeout(() => this.pollNow(), 300);
  }

  async nextTrack() {
    await this.apiRequest("/me/player/next", "POST");
    setTimeout(() => this.pollNow(), 400);
  }

  async previousTrack() {
    await this.apiRequest("/me/player/previous", "POST");
    setTimeout(() => this.pollNow(), 400);
  }

  // =========================================================================
  // Polling Loop
  // =========================================================================
  startPolling(intervalMs = 3500) {
    if (this.isPolling) return;
    this.isPolling = true;

    this.pollNow();
    this.pollInterval = setInterval(() => {
      if (document.visibilityState === "visible") {
        this.pollNow();
      }
    }, intervalMs);

    document.addEventListener("visibilitychange", this.handleVisibilityChange);
  }

  handleVisibilityChange = () => {
    if (document.visibilityState === "visible" && this.isPolling) {
      this.pollNow();
    }
  };

  stopPolling() {
    this.isPolling = false;
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
    document.removeEventListener("visibilitychange", this.handleVisibilityChange);
  }

  async pollNow() {
    if (!this.isAuthenticated()) {
      this.lastState = { isConnected: false };
      this.onStateChange(this.lastState);
      return;
    }

    const state = await this.fetchPlaybackState();
    this.lastState = state;
    this.onStateChange(state);
  }
}
