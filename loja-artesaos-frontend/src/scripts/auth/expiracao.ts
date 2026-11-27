import { expiracaoDoToken } from './sessao'


export function vigiarExpiracao(aoExpirar: () => void): void {
  const expiracao = expiracaoDoToken()
  if (expiracao === null) return

  let avisado = false
  const disparar = (): void => {
    if (avisado) return
    avisado = true
    aoExpirar()
  }

  window.setTimeout(disparar, Math.max(expiracao - Date.now(), 0) + 500)
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && expiracao <= Date.now()) disparar()
  })
}
