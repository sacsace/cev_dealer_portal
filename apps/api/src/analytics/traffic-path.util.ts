export function isProductViewPath(path: string) {
  return /^\/parts\/[^/?#]+/.test(path);
}
