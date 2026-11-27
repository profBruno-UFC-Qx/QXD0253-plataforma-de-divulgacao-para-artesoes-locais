import { buscarUsuarioLogado } from '../api/auth'
import { ApiError } from '../api/client'
import { encerrarSessao, getToken, getUsuario, salvarUsuario, type UsuarioLogado } from './sessao'


export async function sincronizarUsuario(): Promise<UsuarioLogado | null> {
  const token = getToken()
  if (!token) return null
  try {
    const usuario = await buscarUsuarioLogado(token)
    if (getToken() !== token) return null
    salvarUsuario(usuario)
    return usuario
  } catch (erro) {
    if (erro instanceof ApiError && erro.status === 401) {
      encerrarSessao()
      return null
    }
    return getUsuario() 
  }
}
