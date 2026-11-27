import './estilos'
import { buscarProduto } from './api/produtos'
import { exigirSessao } from './auth/acesso'
import { montarLayout } from './components/layout'
import { mostrarErroPagina, tratarErroDePagina } from './components/erros'
import { buscar } from './utils/dom'
import { formatarData, formatarPeso, formatarPreco } from './utils/formatadores'
import { placeholderImagem } from './utils/placeholder'

montarLayout({ ativa: 'home' })

async function iniciar(): Promise<void> {
  if (!(await exigirSessao())) return

  const id = new URLSearchParams(location.search).get('id')
  if (!id) {
    mostrarErroPagina(404)
    return
  }

  try {
    const produto = await buscarProduto(id)

    document.title = `${produto.nome} · Artesanato do Maciço`
    const imagem = buscar<HTMLImageElement>('#imagem')
    imagem.src = produto.imagemUrl ?? placeholderImagem(produto.categoria?.nome ?? 'Sem foto', '#8a9a90')
    imagem.alt = produto.nome

    buscar('#nome').textContent = produto.nome
    buscar('#preco').textContent = formatarPreco(produto.preco)
    buscar('#descricao').textContent = produto.descricao || 'O artesão não escreveu uma descrição.'
    buscar('#artesao').textContent = produto.artesao?.nome ?? 'Não informado'
    buscar('#data').textContent = formatarData(produto.criadoEm)

    const categoria = buscar('#categoria')
    if (produto.categoria) categoria.textContent = produto.categoria.nome
    else categoria.hidden = true

    if (produto.peso === null) buscar('#ficha-peso').hidden = true
    else buscar('#peso').textContent = formatarPeso(produto.peso)

    buscar('#carregando').hidden = true
    buscar('#detalhe').hidden = false
  } catch (erro) {
    tratarErroDePagina(erro)
  }
}

void iniciar()
