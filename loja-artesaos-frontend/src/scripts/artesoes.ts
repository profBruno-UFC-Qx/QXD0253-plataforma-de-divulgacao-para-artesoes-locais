import './estilos'
import { listarArtesaos } from './api/artesoes'
import { exigirPapel } from './auth/acesso'
import { getToken } from './auth/sessao'
import { montarLayout } from './components/layout'
import { tratarErroDePagina } from './components/erros'
import type { UsuarioAdmin } from './types'
import { buscar, normalizar } from './utils/dom'
import { iniciais } from './utils/formatadores'

type Aba = 'todos' | 'pedidos' | 'artesaos'

montarLayout({ ativa: 'artesoes' })

const ehPedido = (u: UsuarioAdmin): boolean => u.papel === 'comprador' && u.querSerArtesao

function criarItem(usuario: UsuarioAdmin): HTMLLIElement {
  const item = document.createElement('li')
  const link = document.createElement('a')
  link.className = 'pessoa'
  link.href = `/artesao-perfil.html?id=${usuario.id}`

  const avatar = document.createElement('span')
  avatar.className = 'avatar'
  avatar.setAttribute('aria-hidden', 'true')
  avatar.textContent = iniciais(usuario.nome)

  const info = document.createElement('div')
  info.className = 'pessoa__info'
  const nome = document.createElement('p')
  nome.className = 'pessoa__nome'
  nome.textContent = usuario.nome
  const detalhe = document.createElement('p')
  detalhe.className = 'pessoa__detalhe'
  detalhe.textContent = [usuario.cidade, usuario.categoria].filter(Boolean).join(' · ') || usuario.email
  info.append(nome, detalhe)

  const chip = document.createElement('span')
  chip.className = ehPedido(usuario) ? 'chip chip--alerta' : 'chip chip--ok'
  chip.textContent = ehPedido(usuario) ? 'Pedido pendente' : 'Artesão'

  link.append(avatar, info, chip)
  item.append(link)
  return item
}

async function iniciar(): Promise<void> {
  if (!(await exigirPapel(['secretaria']))) return 

  const lista = buscar<HTMLElement>('#lista')
  const estado = buscar<HTMLElement>('#estado')
  const campoBusca = buscar<HTMLInputElement>('#busca')
  const abas = buscar<HTMLElement>('#abas')

  let todos: UsuarioAdmin[] = []
  let aba: Aba = 'todos'

  function mostrarEstado(texto: string): void {
    estado.textContent = texto
    estado.hidden = texto === ''
  }

  function filtrar(): UsuarioAdmin[] {
    const termo = normalizar(campoBusca.value.trim())
    return todos.filter((u) => {
      if (aba === 'pedidos' && !ehPedido(u)) return false
      if (aba === 'artesaos' && u.papel !== 'artesao') return false
      if (termo === '') return true
      return normalizar([u.nome, u.email, u.cidade ?? '', u.categoria ?? ''].join(' ')).includes(termo)
    })
  }

  function desenhar(): void {
    const itens = filtrar()
    lista.replaceChildren(...itens.map(criarItem))
    if (itens.length > 0) mostrarEstado('')
    else if (todos.length === 0) mostrarEstado('Nenhum artesão ou pedido cadastrado ainda.')
    else mostrarEstado('Nenhum resultado para essa busca.')
  }

  function atualizarContagens(): void {
    const contas: Record<Aba, number> = {
      todos: todos.length,
      pedidos: todos.filter(ehPedido).length,
      artesaos: todos.filter((u) => u.papel === 'artesao').length,
    }
    for (const [nome, total] of Object.entries(contas)) {
      const marcador = abas.querySelector(`[data-conta="${nome}"]`)
      if (marcador) marcador.textContent = `(${total})`
    }
  }

  for (const botao of abas.querySelectorAll<HTMLButtonElement>('button[data-aba]')) {
    botao.addEventListener('click', () => {
      aba = botao.dataset.aba as Aba
      for (const outro of abas.querySelectorAll('button')) outro.setAttribute('aria-pressed', String(outro === botao))
      desenhar()
    })
  }
  campoBusca.addEventListener('input', desenhar)
  buscar<HTMLFormElement>('#form-busca').addEventListener('submit', (e) => e.preventDefault())

  mostrarEstado('Carregando…')
  try {
    const token = getToken()
    if (!token) return
    todos = await listarArtesaos(token)
    atualizarContagens()
    desenhar()
  } catch (e) {
    tratarErroDePagina(e)
  }
}

void iniciar()
