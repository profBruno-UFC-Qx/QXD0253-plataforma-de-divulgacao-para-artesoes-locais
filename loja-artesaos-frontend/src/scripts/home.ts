import './estilos'
import { listarCategorias, listarProdutos } from './api/produtos'
import { ApiError } from './api/client'
import { protegerCliques } from './auth/guard'
import { estaLogado } from './auth/sessao'
import { criarPost } from './components/post'
import { montarLayout } from './components/layout'
import type { Categoria } from './types'
import { buscar } from './utils/dom'

montarLayout({ ativa: 'home', busca: true, recarregarSeExpirar: true })
protegerCliques()

const feed = buscar<HTMLElement>('#feed')
const filtros = buscar<HTMLElement>('#filtros')
const estadoTexto = buscar<HTMLElement>('#estado')
const botaoMais = buscar<HTMLButtonElement>('#btn-mais')
const campoBusca = buscar<HTMLInputElement>('#busca')

const estado = { pagina: 1, categoriaId: null as string | null, busca: '' }
let requisicaoAtual = 0

function mostrarEstado(texto: string): void {
  estadoTexto.textContent = texto
  estadoTexto.hidden = texto === ''
}

async function carregar(anexar: boolean): Promise<void> {
  const numero = ++requisicaoAtual
  if (!anexar) {
    estado.pagina = 1
    feed.replaceChildren()
    botaoMais.hidden = true
  }
  mostrarEstado('Carregando produtos…')

  try {
    const { produtos, ultimaPagina } = await listarProdutos({
      pagina: estado.pagina,
      categoriaId: estado.categoriaId,
      busca: estado.busca,
    })
    if (numero !== requisicaoAtual) return 

    feed.append(...produtos.map(criarPost))
    botaoMais.hidden = ultimaPagina
    mostrarEstado(feed.children.length === 0 ? 'Nenhum produto encontrado.' : '')
  } catch (erro) {
    if (numero !== requisicaoAtual) return
    mostrarEstado(erro instanceof ApiError && erro.status === 0 ? erro.message : 'Não foi possível carregar os produtos.')
  }
}

function criarFiltro(rotulo: string, categoriaId: string | null): HTMLButtonElement {
  const botao = document.createElement('button')
  botao.type = 'button'
  botao.className = 'chip-filtro'
  botao.textContent = rotulo
  botao.setAttribute('aria-pressed', String(estado.categoriaId === categoriaId))
  if (!estaLogado()) botao.setAttribute('data-requires-auth', '')

  botao.addEventListener('click', () => {
    if (!estaLogado()) return
    estado.categoriaId = categoriaId
    for (const outro of filtros.querySelectorAll('button')) {
      outro.setAttribute('aria-pressed', String(outro === botao))
    }
    void carregar(false)
  })
  return botao
}

async function carregarFiltros(): Promise<void> {
  try {
    const categorias: Categoria[] = await listarCategorias()
    filtros.replaceChildren(criarFiltro('Todas', null), ...categorias.map((c) => criarFiltro(c.nome, c.documentId)))
  } catch {
    filtros.hidden = true
  }
}

if (!estaLogado()) botaoMais.setAttribute('data-requires-auth', '')
botaoMais.addEventListener('click', () => {
  if (!estaLogado()) return
  estado.pagina += 1
  void carregar(true)
})

let espera: number | undefined
buscar<HTMLFormElement>('#form-busca').addEventListener('submit', (e) => e.preventDefault())
campoBusca.addEventListener('input', () => {
  window.clearTimeout(espera)
  espera = window.setTimeout(() => {
    estado.busca = campoBusca.value.trim()
    void carregar(false)
  }, 350)
})

void carregarFiltros()
void carregar(false)
