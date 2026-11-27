import './estilos'
import { atualizarProduto, buscarProduto, criarProduto, listarCategorias, type DadosProduto } from './api/produtos'
import { enviarImagem } from './api/upload'
import { exigirPapel } from './auth/acesso'
import { getToken } from './auth/sessao'
import { montarLayout } from './components/layout'
import { mostrarErroPagina, tratarErroDeAcao, tratarErroDePagina } from './components/erros'
import type { Produto } from './types'
import { buscar, marcarCampo } from './utils/dom'

const TAMANHO_MAXIMO_FOTO = 5 * 1024 * 1024

montarLayout({ ativa: 'obras' })

async function iniciar(): Promise<void> {
  const usuario = await exigirPapel(['artesao'])
  if (!usuario) return

  const id = new URLSearchParams(location.search).get('id')
  const form = buscar<HTMLFormElement>('#form-produto')
  const foto = buscar<HTMLInputElement>('#foto')
  const preview = buscar<HTMLImageElement>('#preview')
  const nome = buscar<HTMLInputElement>('#nome')
  const preco = buscar<HTMLInputElement>('#preco')
  const peso = buscar<HTMLInputElement>('#peso')
  const categoria = buscar<HTMLSelectElement>('#categoria')
  const descricao = buscar<HTMLTextAreaElement>('#descricao')
  const erroGeral = buscar('#erro-geral')
  const salvar = buscar<HTMLButtonElement>('#btn-salvar')

  let produto: Produto | null = null
  let urlPrevia: string | null = null

  try {
    for (const c of await listarCategorias()) categoria.add(new Option(c.nome, c.documentId))
  } catch (erro) {
    tratarErroDePagina(erro)
    return
  }

  if (id) {
    buscar('#titulo').textContent = 'Editar produto'
    buscar('#btn-salvar').textContent = 'Salvar alterações'
    document.title = 'Editar produto · Artesanato do Maciço'
    try {
      produto = await buscarProduto(id)
    } catch (erro) {
      tratarErroDePagina(erro)
      return
    }
    if (produto.artesao?.documentId !== usuario.documentId) {
      mostrarErroPagina(403) 
      return
    }
    nome.value = produto.nome
    preco.value = String(produto.preco)
    peso.value = produto.peso === null ? '' : String(Math.round(produto.peso * 1000))
    categoria.value = produto.categoria?.documentId ?? ''
    descricao.value = produto.descricao
    if (produto.imagemUrl) {
      preview.src = produto.imagemUrl
      preview.hidden = false
    }
  }

  function limparPrevia(): void {
    if (urlPrevia) URL.revokeObjectURL(urlPrevia)
    urlPrevia = null
  }

  foto.addEventListener('change', () => {
    limparPrevia()
    const arquivo = foto.files?.[0]
    if (arquivo?.type.startsWith('image/')) {
      urlPrevia = URL.createObjectURL(arquivo)
      preview.src = urlPrevia
      preview.hidden = false
    } else if (!produto?.imagemUrl) preview.hidden = true
  })

  function validar(): boolean {
    const arquivo = foto.files?.[0]
    let mensagemFoto = ''
    if (!arquivo && !produto?.imagemUrl) mensagemFoto = 'Escolha uma foto do produto.'
    else if (arquivo && !arquivo.type.startsWith('image/')) mensagemFoto = 'Escolha um arquivo de imagem.'
    else if (arquivo && arquivo.size > TAMANHO_MAXIMO_FOTO) mensagemFoto = 'A imagem deve ter no máximo 5 MB.'

    const valorPreco = Number(preco.value)
    const valorPeso = Number(peso.value)
    const resultados = [
      marcarCampo(foto, mensagemFoto),
      marcarCampo(nome, nome.value.trim().length >= 3 ? '' : 'Informe o nome (mínimo de 3 letras).'),
      marcarCampo(preco, valorPreco > 0 && valorPreco <= 100000 ? '' : 'Informe um preço maior que zero.'),
      marcarCampo(peso, Number.isInteger(valorPeso) && valorPeso >= 1 ? '' : 'Informe o peso em gramas (número inteiro).'),
      marcarCampo(categoria, categoria.value !== '' ? '' : 'Escolha uma categoria.'),
    ]
    return resultados.every(Boolean)
  }

  form.addEventListener('submit', async (evento) => {
    evento.preventDefault()
    erroGeral.classList.add('d-none')
    if (!validar()) return

    const token = getToken()
    if (!token) return
    salvar.disabled = true
    try {
      const dados: DadosProduto = {
        nome: nome.value.trim(),
        descricao: descricao.value.trim(),
        preco: Number(preco.value),
        peso: Number(peso.value) / 1000, 
        categoria: categoria.value,
      }
      const arquivo = foto.files?.[0]
      if (arquivo) dados.imagem = await enviarImagem(arquivo, token)

      if (produto) await atualizarProduto(produto.documentId, dados, token)
      else await criarProduto(dados, token)
      location.assign('/obras.html')
    } catch (erro) {
      const texto = tratarErroDeAcao(erro, 'Não foi possível salvar o produto. Tente novamente.')
      if (texto) {
        erroGeral.textContent = texto
        erroGeral.classList.remove('d-none')
      }
      salvar.disabled = false
    }
  })
}

void iniciar().catch(() => mostrarErroPagina('generico'))
