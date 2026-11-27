import { ApiError } from '../api/client'
import { encerrarSessao, estaLogado } from './sessao'

export function irParaLogin(destino: string = location.pathname, expirou = false): void {
  const url = new URL('/login.html', location.origin)
  url.searchParams.set('redirect', destino)
  if (expirou) url.searchParams.set('expirou', '1')
  location.assign(url)
}

export function redirecionarSessaoExpirada(): void {
  encerrarSessao()
  irParaLogin(location.pathname + location.search + location.hash, true)
}

export function exigirLogin(): boolean {
  if (estaLogado()) return true
  irParaLogin(location.pathname + location.search + location.hash)
  return false
}

export function sessaoExpirou(erro: unknown): boolean {
  if (erro instanceof ApiError && erro.status === 401) {
    redirecionarSessaoExpirada()
    return true
  }
  return false
}

export function protegerCliques(): void {
  document.addEventListener('click', (evento) => {
    if (estaLogado() || !(evento.target instanceof Element)) return

    const alvo = evento.target.closest<HTMLElement>('[data-requires-auth]')
    if (!alvo) return

    evento.preventDefault()
    const href = alvo instanceof HTMLAnchorElement ? alvo.getAttribute('href') : null
    irParaLogin(alvo.dataset.destino ?? href ?? location.pathname)
  })
}
