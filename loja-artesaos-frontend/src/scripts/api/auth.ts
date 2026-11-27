import { encerrarSessao, salvarSessao, salvarUsuario, type Papel, type UsuarioLogado } from '../auth/sessao'
import { requisicao } from './client'

interface UsuarioStrapi {
  id: number
  documentId: string
  email: string
  nome?: string | null
  idade?: number | null
  querSerArtesao?: boolean | null
  papel?: string
  role?: { type?: string } | null
}

export interface RespostaAuth {
  jwt?: string
  user: UsuarioStrapi
}

export interface DadosArtesao {
  categoriaArtesanato: string
  cidade: string
  whatsapp: string 
  sobreTrabalho: string
}

export interface DadosCadastro {
  nome: string
  idade: number
  email: string
  senha: string
  querSerArtesao: boolean
  artesao?: DadosArtesao // preencher quando quer ser artesao
}

export function cadastrar(dados: DadosCadastro): Promise<RespostaAuth> {
  return requisicao<RespostaAuth>('/api/auth/local/register', {
    method: 'POST',
    body: {
      username: dados.email, 
      email: dados.email,
      password: dados.senha,
      nome: dados.nome,
      idade: dados.idade,
      querSerArtesao: dados.querSerArtesao,
      ...(dados.artesao ?? {}),
    },
  })
}

export function entrar(email: string, senha: string): Promise<RespostaAuth> {
  return requisicao<RespostaAuth>('/api/auth/local', {
    method: 'POST',
    body: { identifier: email, password: senha },
  })
}

function converterPapel(tipo: string | undefined): Papel {
  return tipo === 'artesao' || tipo === 'secretaria' ? tipo : 'comprador'
}

export async function buscarUsuarioLogado(token: string): Promise<UsuarioLogado> {
  const u = await requisicao<UsuarioStrapi>('/api/users/me', { token })
  return {
    id: u.id,
    documentId: u.documentId,
    email: u.email,
    nome: u.nome ?? u.email,
    idade: u.idade ?? null,
    papel: converterPapel(u.papel ?? u.role?.type),
    querSerArtesao: u.querSerArtesao === true,
  }
}

export async function iniciarSessao(jwt: string): Promise<void> {
  salvarSessao(jwt)
  try {
    salvarUsuario(await buscarUsuarioLogado(jwt))
  } catch (erro) {
    encerrarSessao()
    throw erro
  }
}
