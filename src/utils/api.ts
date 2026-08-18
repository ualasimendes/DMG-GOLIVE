export function getApiBaseUrl(): string {
  const pathname = window.location.pathname;
  if (pathname.includes('/dmg-live-share')) {
    return '/dmg-live-share/api';
  }
  return '/api';
}

export function getShareableRoomUrl(roomId: string): string {
  const host = window.location.host;
  const isCustomDomain = host.includes('walacemendes.com.br') || host.includes('walacemendes.com');
  const domain = isCustomDomain ? 'live.walacemendes.com.br' : host;
  const subpath = window.location.pathname.startsWith('/dmg-live-share') ? '/dmg-live-share' : '';
  return `https://${domain}${subpath}/?room=${encodeURIComponent(roomId)}`;
}
