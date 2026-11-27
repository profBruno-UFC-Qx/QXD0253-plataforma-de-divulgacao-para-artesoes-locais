import { ApiError } from '../api/client'
import { irParaLogin, redirecionarSessaoExpirada } from '../auth/guard'

export type CodigoErro = 401 | 403 | 404 | 'rede' | 'generico'

const TEXTOS: Record<CodigoErro, { selo: string; titulo: string; mensagem: string }> = {
  401: {
    selo: '401',
    titulo: 'Entre para continuar',
    mensagem: 'Você precisa estar logado para acessar esta página. Se a sua sessão expirou, entre novamente.',
  },
  403: {
    selo: '403',
    titulo: 'Acesso negado',
    mensagem: 'Você está logado, mas a sua conta não tem permissão para acessar esta página ou fazer esta ação.',
  },
  404: {
    selo: '404',
    titulo: 'Não encontrado',
    mensagem: 'O endereço ou o item que você procura não existe ou foi removido.',
  },
  rede: {
    selo: 'Sem conexão',
    titulo: 'Servidor indisponível',
    mensagem: 'Não foi possível falar com o servidor. Verifique se o Strapi está rodando e tente de novo.',
  },
  generico: {
    selo: 'Erro',
    titulo: 'Algo deu errado',
    mensagem: 'Não foi possível concluir o que você pediu. Tente novamente em instantes.',
  },
}

export function codigoDoErro(erro: unknown): CodigoErro {
  if (erro instanceof ApiError) {
    if (erro.status === 0) return 'rede'
    if (erro.status === 401 || erro.status === 403 || erro.status === 404) return erro.status
  }
  return 'generico'
}

export function mostrarErroPagina(codigo: CodigoErro): void {
  const texto = TEXTOS[codigo]
  const principal = document.querySelector('main')
  if (!principal) return

  const secao = document.createElement('section')
  secao.className = 'erro-pagina'
  secao.setAttribute('role', 'alert')

  const selo = document.createElement('p')
  selo.className = 'erro-pagina__selo'
  selo.textContent = texto.selo
  const titulo = document.createElement('h1')
  titulo.className = 'erro-pagina__titulo'
  titulo.textContent = texto.titulo
  const mensagem = document.createElement('p')
  mensagem.className = 'erro-pagina__mensagem'
  mensagem.textContent = texto.mensagem

  const acoes = document.createElement('div')
  acoes.className = 'd-flex flex-wrap justify-content-center gap-2'

  if (codigo === 401) {
    const entrar = document.createElement('button')
    entrar.type = 'button'
    entrar.className = 'btn btn-primary'
    entrar.textContent = 'Entrar'
    entrar.addEventListener('click', () => irParaLogin(location.pathname + location.search))
    acoes.append(entrar)
  } else if (codigo === 'rede' || codigo === 'generico') {
    const tentar = document.createElement('button')
    tentar.type = 'button'
    tentar.className = 'btn btn-primary'
    tentar.textContent = 'Tentar de novo'
    tentar.addEventListener('click', () => location.reload())
    acoes.append(tentar)
  }
  const inicio = document.createElement('a')
  inicio.className = codigo === 403 || codigo === 404 ? 'btn btn-primary' : 'btn btn-outline-secondary'
  inicio.href = '/'
  inicio.textContent = 'Voltar para a Home'
  acoes.append(inicio)

  secao.append(selo, titulo, mensagem, acoes)
  principal.replaceChildren(secao)
  document.title = `${texto.titulo} · Artesanato do Maciço`
}


export function tratarErroDePagina(erro: unknown): void {
  const codigo = codigoDoErro(erro)
  if (codigo === 401) redirecionarSessaoExpirada()
  else mostrarErroPagina(codigo)
}


export function tratarErroDeAcao(erro: unknown, padrao: string): string | null {
  const codigo = codigoDoErro(erro)
  if (codigo === 401) {
    redirecionarSessaoExpirada()
    return null
  }
  if (codigo === 403) return 'Você não tem permissão para fazer isso.'
  if (codigo === 404) return 'Esse item não foi encontrado. Ele pode ter sido removido.'
  if (codigo === 'rede') return 'Sem conexão com o servidor. Verifique se o Strapi está rodando.'
  return padrao
}
