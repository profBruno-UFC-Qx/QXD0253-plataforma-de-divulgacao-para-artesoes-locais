import { estaLogado } from '../auth/sessao'
import type { Produto } from '../types'
import { buscar, campo } from '../utils/dom'
import { formatarPreco, formatarTempoRelativo, iniciais } from '../utils/formatadores'
import { placeholderImagem } from '../utils/placeholder'

export function criarPost(produto: Produto): HTMLElement {
  const modelo = buscar<HTMLTemplateElement>('#tpl-post')
  const fragmento = modelo.content.cloneNode(true) as DocumentFragment
  const post = fragmento.querySelector<HTMLElement>('.post')
  if (!post) throw new Error('Template do post sem elemento .post')

  const destino = `/produto.html?id=${encodeURIComponent(produto.documentId)}`
  post.dataset.destino = destino

  const titulo = campo<HTMLAnchorElement>(post, 'nome')
  titulo.textContent = produto.nome
  titulo.href = destino

  const nomeArtesao = produto.artesao?.nome ?? 'Artesão'
  campo(post, 'artesao').textContent = nomeArtesao

  const data = campo<HTMLTimeElement>(post, 'data')
  data.dateTime = produto.criadoEm
  data.textContent = formatarTempoRelativo(produto.criadoEm)

  campo(post, 'avatar').textContent = iniciais(nomeArtesao)

  const imagem = campo<HTMLImageElement>(post, 'imagem')
  imagem.src = produto.miniaturaUrl ?? placeholderImagem(produto.categoria?.nome ?? 'Sem foto', '#8a9a90')
  imagem.alt = produto.nome

  campo(post, 'preco').textContent = formatarPreco(produto.preco)
  const categoria = campo(post, 'categoria')
  if (produto.categoria) categoria.textContent = produto.categoria.nome
  else categoria.remove()
  const descricao = campo(post, 'descricao')
  if (produto.descricao) descricao.textContent = produto.descricao
  else descricao.remove()

  post.addEventListener('click', (evento) => {
    if (!estaLogado() || (evento.target as Element).closest('a')) return
    location.assign(destino)
  })

  return post
}
