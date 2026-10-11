import { ImportError } from './import-error';

// Some recipe sites turn away requests that don't look like a browser.
// This is Safari on iPhone, which is what the phone would be anyway.
const SAFARI_USER_AGENT =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0 Mobile/15E148 Safari/604.1';

const TIMEOUT_MS = 20_000;

/** Downloads a recipe page's HTML on the phone. No server is involved. */
export async function fetchPage(url: URL): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(url.href, {
      headers: { 'User-Agent': SAFARI_USER_AGENT, Accept: 'text/html' },
      signal: controller.signal,
    });
    const html = await response.text();
    if (isBotCheck(response.status, html)) {
      throw new ImportError(
        `${url.hostname} wouldn't let the app read this page. Open it in Safari, copy the recipe and use Paste text instead.`,
      );
    }
    if (!response.ok) {
      throw new ImportError(
        `The page couldn't be opened (error ${response.status}). Check the link.`,
      );
    }
    return html;
  } catch (error) {
    if (error instanceof ImportError) throw error;
    throw new ImportError(
      controller.signal.aborted
        ? 'The page took too long to load. Try again, or copy the recipe and use Paste text.'
        : "The page couldn't be opened. Check the link and your connection.",
    );
  } finally {
    clearTimeout(timeout);
  }
}

/** Cloudflare and similar services answer bots with a challenge page instead of the recipe. */
function isBotCheck(status: number, html: string): boolean {
  return (
    (status === 403 || status === 429 || status === 503) &&
    /just a moment|challenge-platform|cf-chl|captcha/i.test(html.slice(0, 20_000))
  );
}
