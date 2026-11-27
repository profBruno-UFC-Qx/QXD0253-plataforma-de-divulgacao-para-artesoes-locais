export type Tema = 'auto' | 'claro' | 'escuro'

const CHAVE_TEMA = 'tema'
const escuroDoSistema = window.matchMedia('(prefers-color-scheme: dark)')

export function getTema(): Tema {
  const salvo = localStorage.getItem(CHAVE_TEMA)
  return salvo === 'claro' || salvo === 'escuro' ? salvo : 'auto'
}

export function aplicarTema(tema: Tema = getTema()): void {
  const escuro = tema === 'escuro' || (tema === 'auto' && escuroDoSistema.matches)
  document.documentElement.setAttribute('data-bs-theme', escuro ? 'dark' : 'light')
}

export function salvarTema(tema: Tema): void {
  localStorage.setItem(CHAVE_TEMA, tema)
  aplicarTema(tema)
}

escuroDoSistema.addEventListener('change', () => aplicarTema())
