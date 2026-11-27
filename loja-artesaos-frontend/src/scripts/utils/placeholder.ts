export function placeholderImagem(rotulo: string, cor: string): string {
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600">` +
    `<rect width="600" height="600" fill="${cor}"/>` +
    `<text x="300" y="310" font-family="sans-serif" font-size="34" fill="#ffffff" ` +
    `text-anchor="middle">${rotulo}</text></svg>`
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}
