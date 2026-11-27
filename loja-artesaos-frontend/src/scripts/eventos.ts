import './estilos'
import { atualizarEvento, criarEvento, excluirEvento, listarEventos, type DadosEvento } from './api/eventos'
import { enviarImagem } from './api/upload'
import { exigirSessao } from './auth/acesso'
import { getToken } from './auth/sessao'
import { montarLayout } from './components/layout'
import { tratarErroDeAcao, tratarErroDePagina } from './components/erros'
import type { Evento } from './types'
import { buscar, campo, marcarCampo } from './utils/dom'
import { formatarDiaEvento } from './utils/formatadores'

const TAMANHO_MAXIMO_FOTO = 5 * 1024 * 1024

montarLayout({ ativa: 'eventos' })

async function iniciar(): Promise<void> {
  const usuario = await exigirSessao()
  if (!usuario) return

  const ehSecretaria = usuario.papel === 'secretaria'

  const lista = buscar<HTMLElement>('#lista')
  const estado = buscar<HTMLElement>('#estado')
  const botaoMais = buscar<HTMLButtonElement>('#btn-mais')
  const botaoNovo = buscar<HTMLButtonElement>('#btn-novo')
  const dialogo = buscar<HTMLDialogElement>('#dialogo')
  const form = buscar<HTMLFormElement>('#form-evento')
  const titulo = buscar<HTMLInputElement>('#ev-titulo')
  const data = buscar<HTMLInputElement>('#ev-data')
  const descricao = buscar<HTMLTextAreaElement>('#ev-descricao')
  const foto = buscar<HTMLInputElement>('#ev-foto')
  const preview = buscar<HTMLImageElement>('#ev-preview')
  const removerBloco = buscar('#ev-remover-bloco')
  const remover = buscar<HTMLInputElement>('#ev-remover')
  const erro = buscar('#ev-erro')
  const salvar = buscar<HTMLButtonElement>('#ev-salvar')

  let pagina = 1
  let editando: Evento | null = null
  let urlPrevia: string | null = null

  function mostrarEstado(texto: string): void {
    estado.textContent = texto
    estado.hidden = texto === ''
  }

  function criarCard(evento: Evento): HTMLElement {
    const modelo = buscar<HTMLTemplateElement>('#tpl-evento')
    const fragmento = modelo.content.cloneNode(true) as DocumentFragment
    const card = fragmento.querySelector<HTMLElement>('.evento')
    if (!card) throw new Error('Template do evento sem elemento .evento')

    campo(card, 'titulo').textContent = evento.titulo
    campo(card, 'descricao').textContent = evento.descricao
    const dia = campo<HTMLTimeElement>(card, 'data')
    dia.dateTime = evento.dataEvento
    dia.textContent = formatarDiaEvento(evento.dataEvento)

    if (evento.imagemUrl) {
      const imagem = campo<HTMLImageElement>(card, 'imagem')
      imagem.src = evento.imagemUrl
      imagem.alt = evento.titulo
      imagem.hidden = false
    }

    if (ehSecretaria) {
      campo(card, 'acoes').hidden = false
      campo(card, 'editar').addEventListener('click', () => abrirDialogo(evento))
      campo(card, 'excluir').addEventListener('click', () => void excluir(evento))
    }
    return card
  }

  async function carregar(anexar: boolean): Promise<void> {
    if (!anexar) {
      pagina = 1
      lista.replaceChildren()
      botaoMais.hidden = true
    }
    mostrarEstado('Carregando…')
    try {
      const { eventos, ultimaPagina } = await listarEventos(pagina)
      lista.append(...eventos.map(criarCard))
      botaoMais.hidden = ultimaPagina
      mostrarEstado(lista.children.length === 0 ? 'Nenhum evento ou notícia publicado ainda.' : '')
    } catch (e) {
      if (anexar) mostrarEstado(tratarErroDeAcao(e, 'Não foi possível carregar mais eventos.') ?? '')
      else tratarErroDePagina(e)
    }
  }

  async function excluir(evento: Evento): Promise<void> {
    if (!window.confirm(`Excluir "${evento.titulo}"? Essa ação não pode ser desfeita.`)) return
    const token = getToken()
    if (!token) return
    try {
      await excluirEvento(evento.documentId, token)
      await carregar(false)
    } catch (e) {
      const texto = tratarErroDeAcao(e, 'Não foi possível excluir. Tente novamente.')
      if (texto) window.alert(texto)
    }
  }

  function limparPrevia(): void {
    if (urlPrevia) URL.revokeObjectURL(urlPrevia)
    urlPrevia = null
    preview.hidden = true
    preview.removeAttribute('src')
  }

  function abrirDialogo(evento: Evento | null): void {
    editando = evento
    form.reset()
    for (const c of [titulo, data, descricao, foto]) marcarCampo(c, '')
    erro.classList.add('d-none')
    limparPrevia()

    buscar('#dialogo-titulo').textContent = evento ? 'Editar notícia ou evento' : 'Nova notícia ou evento'
    salvar.textContent = evento ? 'Salvar alterações' : 'Publicar'
    titulo.value = evento?.titulo ?? ''
    data.value = evento?.dataEvento ?? new Date().toISOString().slice(0, 10)
    descricao.value = evento?.descricao ?? ''

    if (evento?.imagemUrl) {
      preview.src = evento.imagemUrl
      preview.hidden = false
    }
    removerBloco.hidden = !evento?.imagemUrl
    dialogo.showModal()
  }

  function validar(): boolean {
    const t = titulo.value.trim()
    const okTitulo = marcarCampo(titulo, t.length >= 3 ? '' : 'Informe o nome (mínimo de 3 letras).')
    const okData = marcarCampo(data, data.value !== '' ? '' : 'Informe a data.')
    const okDescricao = marcarCampo(
      descricao,
      descricao.value.trim().length >= 10 ? '' : 'Escreva uma descrição (mínimo de 10 letras).',
    )
    const arquivo = foto.files?.[0]
    let mensagemFoto = ''
    if (arquivo && !arquivo.type.startsWith('image/')) mensagemFoto = 'Escolha um arquivo de imagem.'
    else if (arquivo && arquivo.size > TAMANHO_MAXIMO_FOTO) mensagemFoto = 'A imagem deve ter no máximo 5 MB.'
    const okFoto = marcarCampo(foto, mensagemFoto)
    return okTitulo && okData && okDescricao && okFoto
  }

  foto.addEventListener('change', () => {
    limparPrevia()
    const arquivo = foto.files?.[0]
    if (arquivo?.type.startsWith('image/')) {
      urlPrevia = URL.createObjectURL(arquivo)
      preview.src = urlPrevia
      preview.hidden = false
    }
  })

  form.addEventListener('submit', async (evento) => {
    evento.preventDefault()
    erro.classList.add('d-none')
    if (!validar()) return

    const token = getToken()
    if (!token) return
    salvar.disabled = true
    try {
      const dados: DadosEvento = {
        titulo: titulo.value.trim(),
        descricao: descricao.value.trim(),
        dataEvento: data.value,
      }
      const arquivo = foto.files?.[0]
      if (arquivo) dados.imagem = await enviarImagem(arquivo, token)
      else if (editando && remover.checked) dados.imagem = null

      if (editando) await atualizarEvento(editando.documentId, dados, token)
      else await criarEvento(dados, token)

      dialogo.close()
      await carregar(false)
    } catch (e) {
      const texto = tratarErroDeAcao(e, 'Não foi possível salvar. Tente novamente.')
      if (texto) {
        erro.textContent = texto
        erro.classList.remove('d-none')
      }
    } finally {
      salvar.disabled = false
    }
  })

  buscar('#ev-cancelar').addEventListener('click', () => dialogo.close())
  dialogo.addEventListener('close', limparPrevia)
  botaoMais.addEventListener('click', () => {
    pagina += 1
    void carregar(true)
  })

  if (ehSecretaria) {
    botaoNovo.hidden = false
    botaoNovo.addEventListener('click', () => abrirDialogo(null))
  }

  await carregar(false)
}

void iniciar()
