import { mostrarErroPagina } from '../components/erros'
import { consumirAvisoDeExpiracao, estaLogado, type Papel, type UsuarioLogado } from './sessao'
import { irParaLogin } from './guard'
import { sincronizarUsuario } from './sincronizar'


export async function exigirSessao(): Promise<UsuarioLogado | null> {
  const tinhaToken = estaLogado()
  const usuario = await sincronizarUsuario()
  if (!usuario) {
    irParaLogin(location.pathname + location.search + location.hash, tinhaToken || consumirAvisoDeExpiracao())
    return null
  }
  return usuario
}

export async function exigirPapel(papeis: Papel[]): Promise<UsuarioLogado | null> {
  const usuario = await exigirSessao()
  if (!usuario) return null
  if (!papeis.includes(usuario.papel)) {
    mostrarErroPagina(403)
    return null
  }
  return usuario
}
