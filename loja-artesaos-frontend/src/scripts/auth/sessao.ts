const CHAVE_TOKEN = 'jwt'
const CHAVE_USUARIO = 'usuario'
const CHAVE_VENCEU = 'sessao-venceu'

export type Papel = 'comprador' | 'artesao' | 'secretaria'

export interface UsuarioLogado {
  id: number
  documentId: string
  email: string
  nome: string
  idade: number | null
  papel: Papel
  querSerArtesao: boolean
}

function lerExpiracao(token: string): number | null {
  try {
    const carga = token.split('.')[1]
    if (!carga) return null
    const base64 = carga.replace(/-/g, '+').replace(/_/g, '/')
    const json = atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, '='))
    const exp = (JSON.parse(json) as { exp?: unknown }).exp
    return typeof exp === 'number' ? exp * 1000 : null
  } catch {
    return null
  }
}

export function getToken(): string | null {
  const token = localStorage.getItem(CHAVE_TOKEN)
  if (!token) return null
  const expiracao = lerExpiracao(token)
  if (expiracao !== null && expiracao <= Date.now()) {
    encerrarPorExpiracao()
    return null
  }
  return token
}

export function expiracaoDoToken(): number | null {
  const token = localStorage.getItem(CHAVE_TOKEN)
  return token ? lerExpiracao(token) : null
}

export function encerrarPorExpiracao(): void {
  sessionStorage.setItem(CHAVE_VENCEU, '1')
  encerrarSessao()
}

export function consumirAvisoDeExpiracao(): boolean {
  const venceu = sessionStorage.getItem(CHAVE_VENCEU) === '1'
  sessionStorage.removeItem(CHAVE_VENCEU)
  return venceu
}

export function estaLogado(): boolean {
  return getToken() !== null
}

export function salvarSessao(jwt: string): void {
  localStorage.setItem(CHAVE_TOKEN, jwt)
  sessionStorage.removeItem(CHAVE_VENCEU)
}

export function salvarUsuario(usuario: UsuarioLogado): void {
  if (getToken() === null) return
  localStorage.setItem(CHAVE_USUARIO, JSON.stringify(usuario))
}

export function atualizarUsuario(parcial: Partial<UsuarioLogado>): void {
  const atual = getUsuario()
  if (atual) salvarUsuario({ ...atual, ...parcial })
}

export function getUsuario(): UsuarioLogado | null {
  if (!estaLogado()) {
    localStorage.removeItem(CHAVE_USUARIO)
    return null
  }
  const texto = localStorage.getItem(CHAVE_USUARIO)
  if (!texto) return null
  try {
    return JSON.parse(texto) as UsuarioLogado
  } catch {
    return null
  }
}

export function encerrarSessao(): void {
  localStorage.removeItem(CHAVE_TOKEN)
  localStorage.removeItem(CHAVE_USUARIO)
}

export function destinoSeguro(valor: string | null): string {
  if (!valor || !valor.startsWith('/') || valor.startsWith('//') || valor.startsWith('/\\')) {
    return '/'
  }
  return valor
}
