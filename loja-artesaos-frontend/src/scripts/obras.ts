import './estilos'
import { excluirProduto, listarMeusProdutos } from './api/produtos'
import { excluirVenda, listarVendas, registrarVenda, type Venda } from './api/vendas'
import { exigirPapel } from './auth/acesso'
import { getToken } from './auth/sessao'
import { montarLayout } from './components/layout'
import { mostrarErroPagina, tratarErroDeAcao, tratarErroDePagina } from './components/erros'
import { desenharGrafico } from './components/grafico'
import { desenharPaginacao } from './components/paginacao'
import type { Produto } from './types'
import { buscar, campo, marcarCampo } from './utils/dom'
import { formatarDiaEvento, formatarData, formatarPreco } from './utils/formatadores'
import { placeholderImagem } from './utils/placeholder'

const MESES_NO_GRAFICO = 6

montarLayout({ ativa: 'obras' })

const hoje = (): string => new Date().toISOString().slice(0, 10)

async function iniciar(): Promise<void> {
  if (!(await exigirPapel(['artesao']))) return

  const lista = buscar<HTMLElement>('#lista')
  const estado = buscar<HTMLElement>('#estado')
  const paginacao = buscar<HTMLElement>('#paginacao')
  const campoBusca = buscar<HTMLInputElement>('#busca')
  const mensagem = buscar('#msg')

  const estadoLista = { pagina: 1, busca: '' }
  let requisicaoAtual = 0

  function mostrarEstado(texto: string): void {
    estado.textContent = texto
    estado.hidden = texto === ''
  }

  function avisar(tipo: 'sucesso' | 'erro', texto: string): void {
    mensagem.textContent = texto
    mensagem.classList.remove('d-none', 'alert-success', 'alert-danger')
    mensagem.classList.add(tipo === 'sucesso' ? 'alert-success' : 'alert-danger')
  }

  function falhaNaAcao(erro: unknown, padrao: string): void {
    const texto = tratarErroDeAcao(erro, padrao)
    if (texto) avisar('erro', texto)
  }

  function criarLinha(produto: Produto): HTMLElement {
    const modelo = buscar<HTMLTemplateElement>('#tpl-obra')
    const fragmento = modelo.content.cloneNode(true) as DocumentFragment
    const linha = fragmento.querySelector<HTMLElement>('.obra')
    if (!linha) throw new Error('Template da obra sem elemento .obra')

    const imagem = campo<HTMLImageElement>(linha, 'imagem')
    imagem.src = produto.miniaturaUrl ?? placeholderImagem(produto.categoria?.nome ?? 'Sem foto', '#8a9a90')
    imagem.alt = produto.nome
    campo(linha, 'nome').textContent = produto.nome
    campo(linha, 'preco').textContent = formatarPreco(produto.preco)
    const categoria = campo(linha, 'categoria')
    if (produto.categoria) categoria.textContent = produto.categoria.nome
    else categoria.remove()
    const data = campo<HTMLTimeElement>(linha, 'data')
    data.dateTime = produto.criadoEm
    data.textContent = formatarData(produto.criadoEm)

    campo<HTMLAnchorElement>(linha, 'editar').href = `/produto-form.html?id=${encodeURIComponent(produto.documentId)}`
    campo(linha, 'vender').addEventListener('click', () => abrirVenda(produto))
    campo(linha, 'excluir').addEventListener('click', () => void excluir(produto))
    return linha
  }

  async function carregarProdutos(): Promise<void> {
    const numero = ++requisicaoAtual
    const token = getToken()
    if (!token) return
    mostrarEstado('Carregando produtos…')
    try {
      const resultado = await listarMeusProdutos(estadoLista, token)
      if (numero !== requisicaoAtual) return
      if (resultado.produtos.length === 0 && estadoLista.pagina > 1) {
        estadoLista.pagina -= 1
        await carregarProdutos()
        return
      }
      lista.replaceChildren(...resultado.produtos.map(criarLinha))
      desenharPaginacao(paginacao, resultado.paginaAtual, resultado.totalPaginas, (pagina) => {
        estadoLista.pagina = pagina
        void carregarProdutos()
        buscar('#t-produtos').scrollIntoView({ behavior: 'smooth' })
      })
      if (estadoLista.busca === '') buscar('#kpi-produtos').textContent = String(resultado.total)
      if (resultado.produtos.length === 0) {
        mostrarEstado(
          estadoLista.busca === ''
            ? 'Você ainda não cadastrou produtos. Use o botão “+” para cadastrar o primeiro.'
            : 'Nenhum produto encontrado para essa busca.',
        )
      } else mostrarEstado('')
    } catch (erro) {
      if (numero === requisicaoAtual) tratarErroDePagina(erro)
    }
  }

  async function excluir(produto: Produto): Promise<void> {
    if (!window.confirm(`Excluir "${produto.nome}"? Essa ação não pode ser desfeita.`)) return
    const token = getToken()
    if (!token) return
    try {
      await excluirProduto(produto.documentId, token)
      avisar('sucesso', `"${produto.nome}" foi excluído.`)
      await carregarProdutos()
    } catch (erro) {
      falhaNaAcao(erro, 'Não foi possível excluir o produto.')
    }
  }

  let espera: number | undefined
  campoBusca.addEventListener('input', () => {
    window.clearTimeout(espera)
    espera = window.setTimeout(() => {
      estadoLista.busca = campoBusca.value.trim()
      estadoLista.pagina = 1
      void carregarProdutos()
    }, 350)
  })
  buscar<HTMLFormElement>('#form-busca').addEventListener('submit', (e) => e.preventDefault())

  const listaVendas = buscar<HTMLElement>('#lista-vendas')

  function inicioDoPeriodo(): string {
    const d = new Date()
    return new Date(d.getFullYear(), d.getMonth() - (MESES_NO_GRAFICO - 1), 1).toLocaleDateString('sv-SE')
  }

  function desenharVendas(vendas: Venda[]): void {
    const agora = new Date()
    const meses = Array.from({ length: MESES_NO_GRAFICO }, (_, i) => {
      const d = new Date(agora.getFullYear(), agora.getMonth() - (MESES_NO_GRAFICO - 1 - i), 1)
      return {
        chave: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
        rotulo: d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', ''),
        valor: 0,
      }
    })
    for (const venda of vendas) {
      const mes = meses.find((m) => m.chave === venda.dataVenda.slice(0, 7))
      if (mes) mes.valor += venda.quantidade
    }
    desenharGrafico(buscar('#grafico'), meses, 'Itens vendidos por mês')
    buscar('#grafico-vazio').hidden = vendas.length > 0

    const chaveAtual = meses[meses.length - 1]?.chave ?? ''
    const doMes = vendas.filter((v) => v.dataVenda.startsWith(chaveAtual))
    buscar('#kpi-itens').textContent = String(doMes.reduce((soma, v) => soma + v.quantidade, 0))
    buscar('#kpi-valor').textContent = formatarPreco(doMes.reduce((soma, v) => soma + v.valor, 0))

    buscar('#vendas-vazio').hidden = vendas.length > 0
    listaVendas.replaceChildren(
      ...vendas.slice(0, 10).map((venda) => {
        const item = document.createElement('li')
        item.className = 'venda'
        const texto = document.createElement('div')
        texto.className = 'venda__texto'
        const titulo = document.createElement('p')
        titulo.className = 'venda__titulo'
        titulo.textContent = `${venda.quantidade}× ${venda.produtoNome}`
        const detalhe = document.createElement('p')
        detalhe.className = 'venda__detalhe'
        detalhe.textContent = [formatarDiaEvento(venda.dataVenda), formatarPreco(venda.valor), venda.nomeComprador]
          .filter(Boolean)
          .join(' — ')
        texto.append(titulo, detalhe)

        const remover = document.createElement('button')
        remover.type = 'button'
        remover.className = 'btn btn-sm btn-outline-danger'
        remover.setAttribute('aria-label', `Excluir venda de ${venda.produtoNome}`)
        remover.innerHTML = '<i class="bi bi-trash" aria-hidden="true"></i>'
        remover.addEventListener('click', () => void removerVenda(venda))
        item.append(texto, remover)
        return item
      }),
    )
  }

  async function carregarVendas(): Promise<void> {
    const token = getToken()
    if (!token) return
    try {
      desenharVendas(await listarVendas(inicioDoPeriodo(), token))
    } catch (erro) {
      tratarErroDePagina(erro)
    }
  }

  async function removerVenda(venda: Venda): Promise<void> {
    if (!window.confirm('Excluir esta venda do registro?')) return
    const token = getToken()
    if (!token) return
    try {
      await excluirVenda(venda.documentId, token)
      await carregarVendas()
    } catch (erro) {
      falhaNaAcao(erro, 'Não foi possível excluir a venda.')
    }
  }

  const dialogo = buscar<HTMLDialogElement>('#dialogo-venda')
  const formVenda = buscar<HTMLFormElement>('#form-venda')
  const quantidade = buscar<HTMLInputElement>('#vd-quantidade')
  const valor = buscar<HTMLInputElement>('#vd-valor')
  const dataVenda = buscar<HTMLInputElement>('#vd-data')
  const comprador = buscar<HTMLInputElement>('#vd-comprador')
  const erroVenda = buscar('#vd-erro')
  const salvarVenda = buscar<HTMLButtonElement>('#vd-salvar')
  let produtoDaVenda: Produto | null = null
  let valorEditado = false

  function sugerirValor(): void {
    if (valorEditado || !produtoDaVenda) return
    const qtd = Number(quantidade.value)
    valor.value = Number.isInteger(qtd) && qtd > 0 ? (produtoDaVenda.preco * qtd).toFixed(2) : ''
  }

  function abrirVenda(produto: Produto): void {
    produtoDaVenda = produto
    valorEditado = false
    formVenda.reset()
    for (const c of [quantidade, valor, dataVenda]) marcarCampo(c, '')
    erroVenda.classList.add('d-none')
    buscar('#vd-produto').textContent = `${produto.nome} — ${formatarPreco(produto.preco)} cada`
    quantidade.value = '1'
    dataVenda.value = hoje()
    dataVenda.max = hoje()
    sugerirValor()
    dialogo.showModal()
  }

  quantidade.addEventListener('input', sugerirValor)
  valor.addEventListener('input', () => {
    valorEditado = true
  })
  buscar('#vd-cancelar').addEventListener('click', () => dialogo.close())

  formVenda.addEventListener('submit', async (evento) => {
    evento.preventDefault()
    erroVenda.classList.add('d-none')
    const qtd = Number(quantidade.value)
    const total = Number(valor.value)
    const okQtd = marcarCampo(quantidade, Number.isInteger(qtd) && qtd >= 1 ? '' : 'Informe a quantidade.')
    const okValor = marcarCampo(valor, total > 0 ? '' : 'Informe o valor.')
    const okData = marcarCampo(
      dataVenda,
      dataVenda.value !== '' && dataVenda.value <= hoje() ? '' : 'Informe uma data que não seja no futuro.',
    )
    const token = getToken()
    if (!okQtd || !okValor || !okData || !token || !produtoDaVenda) return

    salvarVenda.disabled = true
    try {
      await registrarVenda(
        {
          produto: produtoDaVenda.documentId,
          quantidade: qtd,
          valor: total,
          dataVenda: dataVenda.value,
          ...(comprador.value.trim() !== '' ? { nomeComprador: comprador.value.trim() } : {}),
        },
        token,
      )
      dialogo.close()
      avisar('sucesso', 'Venda registrada.')
      await carregarVendas()
    } catch (erro) {
      const texto = tratarErroDeAcao(erro, 'Não foi possível registrar a venda.')
      if (texto) {
        erroVenda.textContent = texto
        erroVenda.classList.remove('d-none')
      }
    } finally {
      salvarVenda.disabled = false
    }
  })

  await Promise.all([carregarProdutos(), carregarVendas()])
}

void iniciar().catch(() => mostrarErroPagina('generico'))
