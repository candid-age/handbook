export type MemoContent =
  | { type: 'youtube'; videoId: string }
  | { type: 'url'; url: string }
  | { type: 'text'; text: string }
  | { type: 'empty'; text: string };

export const getYouTubeVideoId = (value?: string) => {
  if (!value?.trim()) {
    return null;
  }

  try {
    const url = new URL(value.trim());
    const host = url.hostname.toLowerCase().replace(/^www\./, '');

    if (host === 'youtu.be') {
      const shortId = url.pathname.split('/').filter(Boolean)[0];
      return shortId && /^[\w-]{11}$/.test(shortId) ? shortId : null;
    }

    if (!host.endsWith('youtube.com')) {
      return null;
    }

    const segments = url.pathname.split('/').filter(Boolean);
    if (segments[0] === 'shorts' || segments[0] === 'embed') {
      const embeddedId = segments[1];
      return embeddedId && /^[\w-]{11}$/.test(embeddedId) ? embeddedId : null;
    }

    const watchId = url.searchParams.get('v');
    return watchId && /^[\w-]{11}$/.test(watchId) ? watchId : null;
  } catch {
    return null;
  }
};

export const getMemoContent = (memo?: string): MemoContent => {
  const trimmedMemo = memo?.trim();
  if (!trimmedMemo) {
    return {
      type: 'empty',
      text: 'No memo attached to this transaction.',
    };
  }

  const youtubeVideoId = getYouTubeVideoId(trimmedMemo);
  if (youtubeVideoId) {
    return {
      type: 'youtube',
      videoId: youtubeVideoId,
    };
  }

  try {
    const parsedUrl = new URL(trimmedMemo);
    if (parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:') {
      return {
        type: 'url',
        url: parsedUrl.toString(),
      };
    }
  } catch {
    // fall back to plain text rendering
  }

  return {
    type: 'text',
    text: trimmedMemo,
  };
};
