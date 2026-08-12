import * as WebBrowser from 'expo-web-browser';

import { Colors } from '../design-system/tokens';
import { Coordinates } from '../models/types';

// Opens a Google search for a place in an in-app browser sheet (SFSafariViewController on
// iOS, Chrome Custom Tabs on Android) — not a WebView (bot-like traffic pattern, no browser
// session/cookies, more likely to hit a CAPTCHA) and not HTML scraping (against Google's ToS).
// This is the same thing as opening the system browser, just without leaving the app.
export async function openPlaceSearch(name: string, coords: Coordinates): Promise<void> {
  const query = `${name} ${coords.latitude},${coords.longitude}`;
  const url = `https://www.google.com/search?q=${encodeURIComponent(query)}`;

  await WebBrowser.openBrowserAsync(url, {
    dismissButtonStyle: 'close',
    presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
    toolbarColor: Colors.white,
    controlsColor: Colors.brand.primary,
    showTitle: true,
    enableBarCollapsing: true,
  });
}
