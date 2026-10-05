/**
 * Avatar de fallback para perfil sem foto.
 *
 * Existe porque `<img src="">` não é inofensivo: o navegador trata string
 * vazia como "recarregue o documento atual", e volta a baixar a página inteira.
 * Devolver um data-URI mantém os doze pontos de renderização inalterados e sem
 * nenhuma dependência de rede.
 */
export const avatarDeIniciais = (nome: string, cor: string): string => {
  const iniciais = nome
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(parte => parte[0] ?? '')
    .join('')
    .toUpperCase() || '?';

  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96">` +
    `<rect width="96" height="96" rx="48" fill="${cor}"/>` +
    `<text x="48" y="48" dy="0.35em" text-anchor="middle" fill="#fff"` +
    ` font-family="system-ui, sans-serif" font-size="38" font-weight="700">${iniciais}</text>` +
    `</svg>`;

  // encodeURIComponent em vez de base64: o SVG tem acentos possíveis no nome,
  // e btoa quebra com caractere fora de Latin-1.
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
};
