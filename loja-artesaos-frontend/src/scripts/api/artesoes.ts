import { requisicao } from './client'
import type { UsuarioAdmin } from '../types'

interface UsuarioApi {
  id: number
  nome?: string | null
  email: string
  idade?: number | null
  whatsapp?: string | null
  cidade?: string | null
  categoriaArtesanato?: string | null
  sobreTrabalho?: string | null
  querSerArtesao?: boolean | null
  createdAt: string
  role?: { type?: string } | null
}

function converter(u: UsuarioApi): UsuarioAdmin {
  const tipo = u.role?.type
  return {
    id: u.id,
    nome: u.nome ?? u.email,
    email: u.email,
    idade: u.idade ?? null,
    whatsapp: u.whatsapp ?? null,
    cidade: u.cidade ?? null,
    categoria: u.categoriaArtesanato ?? null,
    sobre: u.sobreTrabalho ?? null,
    querSerArtesao: u.querSerArtesao === true,
    papel: tipo === 'artesao' || tipo === 'secretaria' ? tipo : 'comprador',
    criadoEm: u.createdAt,
  }
}

export async function listarArtesaos(token: string): Promise<UsuarioAdmin[]> {
  const [artesaos, pedidos] = await Promise.all([
    requisicao<UsuarioApi[]>('/api/users?filters[role][type][$eq]=artesao&populate=role', { token }),
    requisicao<UsuarioApi[]>(
      '/api/users?filters[role][type][$eq]=comprador&filters[querSerArtesao][$eq]=true&populate=role',
      { token },
    ),
  ])
  return [...pedidos, ...artesaos].map(converter)
}

export async function buscarUsuario(id: string, token: string): Promise<UsuarioAdmin> {
  return converter(await requisicao<UsuarioApi>(`/api/users/${encodeURIComponent(id)}?populate=role`, { token }))
}

async function idDoPapel(tipo: 'artesao' | 'comprador', token: string): Promise<number> {
  const { roles } = await requisicao<{ roles: { id: number; type: string }[] }>('/api/users-permissions/roles', { token })
  const papel = roles.find((r) => r.type === tipo)
  if (!papel) throw new Error(`Papel "${tipo}" não encontrado no servidor.`)
  return papel.id
}

export async function aceitarComoArtesao(id: number, token: string): Promise<void> {
  const role = await idDoPapel('artesao', token)
  await requisicao<unknown>(`/api/users/${id}`, { method: 'PUT', body: { role, querSerArtesao: false }, token })
}

export async function removerArtesao(id: number, token: string): Promise<void> {
  const role = await idDoPapel('comprador', token)
  await requisicao<unknown>(`/api/users/${id}`, { method: 'PUT', body: { role }, token })
}

export async function recusarPedido(id: number, token: string): Promise<void> {
  await requisicao<unknown>(`/api/users/${id}`, { method: 'PUT', body: { querSerArtesao: false }, token })
}
