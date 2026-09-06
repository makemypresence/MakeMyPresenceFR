export interface LinkMetadata {
  title: string;
  domain: string;
  url: string;
  icon_url: string;
  preview_url: string;
  preview_large_url: string;
}

export const DEFAULT_LINK_METADATA: LinkMetadata = {
  title: 'Hoppscotch • Open source API development ecosystem',
  domain: 'hoppscotch.io',
  url: 'https://hoppscotch.io',
  icon_url:
    'https://raw.githubusercontent.com/hoppscotch/hoppscotch/main/packages/hoppscotch-common/public/icon.png',
  preview_url: 'https://hoppscotch.io/banner.png',
  preview_large_url: 'https://hoppscotch.io/banner.png',
};

/**
 * Mock metadata mapping by domain/keyword for API demonstration & testing.
 * Future backend APIs can replace or extend this dictionary.
 */
export const MOCK_LINK_METADATA_MAP: Record<string, Partial<LinkMetadata>> = {
  'github.com': {
    title: 'GitHub: Let’s build from here · GitHub',
    domain: 'github.com',
    icon_url: 'https://github.githubassets.com/favicons/favicon.png',
    preview_url: 'https://github.githubassets.com/assets/campaign-social-042d2ef4847e.png',
    preview_large_url: 'https://github.githubassets.com/assets/campaign-social-042d2ef4847e.png',
  },
  'twitter.com': {
    title: 'X. It’s what’s happening / X',
    domain: 'x.com',
    icon_url: 'https://abs.twimg.com/favicons/twitter.3.ico',
    preview_url: 'https://abs.twimg.com/responsive-web/client-web/icon-ios.b1fc727a.png',
    preview_large_url: 'https://abs.twimg.com/responsive-web/client-web/icon-ios.b1fc727a.png',
  },
  'x.com': {
    title: 'X. It’s what’s happening / X',
    domain: 'x.com',
    icon_url: 'https://abs.twimg.com/favicons/twitter.3.ico',
    preview_url: 'https://abs.twimg.com/responsive-web/client-web/icon-ios.b1fc727a.png',
    preview_large_url: 'https://abs.twimg.com/responsive-web/client-web/icon-ios.b1fc727a.png',
  },
};

/**
 * Extracts a clean domain name from a URL.
 */
export function extractDomainFromUrl(rawUrl: string): string {
  if (!rawUrl) return DEFAULT_LINK_METADATA.domain;
  try {
    const formatted = rawUrl.startsWith('http://') || rawUrl.startsWith('https://')
      ? rawUrl
      : `https://${rawUrl}`;
    const parsed = new URL(formatted);
    return parsed.hostname.replace(/^www\./, '');
  } catch {
    return DEFAULT_LINK_METADATA.domain;
  }
}

/**
 * Resolves metadata for a link. In future backend API integration:
 * Replace or extend this function to make HTTP requests (e.g. via privateGateway.get)
 */
export async function fetchLinkMetadata(rawUrl: string): Promise<LinkMetadata> {
  const formattedUrl = rawUrl && rawUrl.trim() !== '' ? rawUrl.trim() : DEFAULT_LINK_METADATA.url;
  const domain = extractDomainFromUrl(formattedUrl);
  const matched = MOCK_LINK_METADATA_MAP[domain];

  if (matched) {
    return {
      ...DEFAULT_LINK_METADATA,
      ...matched,
      url: formattedUrl,
      domain,
    };
  }

  return {
    ...DEFAULT_LINK_METADATA,
    url: formattedUrl,
    domain,
  };
}

/**
 * Helper to normalize link block data with safe fallbacks.
 */
export function getNormalizedLinkMetadata(block: {
  title?: string;
  url?: string;
  image_url?: string;
  block_metadata?: Record<string, any>;
}): LinkMetadata {
  const rawUrl = block.url && block.url.trim() !== '' ? block.url : DEFAULT_LINK_METADATA.url;
  const domain = block.block_metadata?.domain || extractDomainFromUrl(rawUrl);

  const title =
    block.title && block.title.trim() !== ''
      ? block.title
      : DEFAULT_LINK_METADATA.title;

  const icon_url = block.block_metadata?.icon_url || DEFAULT_LINK_METADATA.icon_url;
  const preview_url =
    block.image_url || block.block_metadata?.preview_url || DEFAULT_LINK_METADATA.preview_url;
  const preview_large_url =
    block.block_metadata?.preview_large_url || DEFAULT_LINK_METADATA.preview_large_url;

  return {
    title,
    domain,
    url: rawUrl,
    icon_url,
    preview_url,
    preview_large_url,
  };
}
