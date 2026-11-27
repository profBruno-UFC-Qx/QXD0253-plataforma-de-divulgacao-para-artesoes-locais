import { vigiarExpiracao } from '../auth/expiracao'
import { irParaLogin } from '../auth/guard'
import { encerrarPorExpiracao, encerrarSessao, estaLogado, getUsuario, type Papel } from '../auth/sessao'
import { sincronizarUsuario } from '../auth/sincronizar'

export type Aba = 'home' | 'eventos' | 'obras' | 'artesoes' | 'perfil'

interface Item {
  aba: Aba
  href: string
  icone: string
  rotulo: string
  publico?: boolean //oq é livre
  papeis?: Papel[] 
}

const ITENS: Item[] = [
  { aba: 'home', href: '/', icone: 'house-door', rotulo: 'Home', publico: true },
  { aba: 'eventos', href: '/eventos.html', icone: 'calendar-event', rotulo: 'Eventos' },
  { aba: 'obras', href: '/obras.html', icone: 'box-seam', rotulo: 'Obras', papeis: ['artesao'] },
  { aba: 'artesoes', href: '/artesoes.html', icone: 'people', rotulo: 'Artesãos', papeis: ['secretaria'] },
  { aba: 'perfil', href: '/perfil.html', icone: 'person', rotulo: 'Perfil' },
]

interface OpcoesLayout {
  ativa: Aba | null
  busca?: boolean
  recarregarSeExpirar?: boolean
}

function itemVisivel(item: Item): boolean {
  if (!item.papeis) return true
  const usuario = getUsuario()
  return usuario !== null && item.papeis.includes(usuario.papel)
}

function htmlItem(item: Item, ativa: Aba | null): string {
  const ativo = item.aba === ativa
  const atributos = ativo ? ' aria-current="page"' : item.publico ? '' : ' data-requires-auth'
  const icone = ativo ? `${item.icone}-fill` : item.icone
  return `<a class="bottombar__item${ativo ? ' is-active' : ''}" href="${item.href}"${atributos}>
      <i class="bi bi-${icone}" aria-hidden="true"></i><span>${item.rotulo}</span></a>`
}

function montarBarraInferior(ativa: Aba | null): void {
  document.querySelector('.bottombar')?.remove()
  const barra = document.createElement('nav')
  barra.className = 'bottombar'
  barra.setAttribute('aria-label', 'Navegação principal')
  barra.innerHTML = `<div class="bottombar__inner">${ITENS.filter(itemVisivel)
    .map((item) => htmlItem(item, ativa))
    .join('')}</div>`
  document.body.append(barra)
}

export function montarLayout({ ativa, busca = false, recarregarSeExpirar = false }: OpcoesLayout): void {
  document.querySelector('.topbar')?.remove()
  const logado = estaLogado()

  const topbar = document.createElement('header')
  topbar.className = 'topbar'
  topbar.innerHTML = `
    <div class="topbar__inner">
      <a class="topbar__brand" href="/">Artesanato do Maciço</a>
      <div class="topbar__actions">
        <a class="icon-btn" href="/perfil.html#configuracoes" data-requires-auth aria-label="Configurações">
          <i class="bi bi-gear" aria-hidden="true"></i></a>
        <a class="icon-btn" href="/perfil.html" data-requires-auth aria-label="Meu perfil">
          <i class="bi bi-person-circle" aria-hidden="true"></i></a>
        ${
          logado
            ? `<button type="button" id="btn-sair" class="icon-btn" aria-label="Sair">
                 <i class="bi bi-box-arrow-right" aria-hidden="true"></i></button>`
            : ''
        }
      </div>
      ${
        busca
          ? `<div class="topbar__search">
               <form id="form-busca" class="search-field" role="search">
                 <i class="bi bi-search" aria-hidden="true"></i>
                 <input id="busca" type="search" placeholder="Buscar produtos" aria-label="Buscar produtos"
                   autocomplete="off" ${logado ? '' : 'readonly data-requires-auth'} />
               </form>
             </div>`
          : ''
      }
    </div>`

  document.body.prepend(topbar)
  montarBarraInferior(ativa)

  topbar.querySelector('#btn-sair')?.addEventListener('click', () => {
    encerrarSessao()
    location.assign('/')
  })

  if (logado) {
    vigiarExpiracao(() => {
      encerrarPorExpiracao()
      if (recarregarSeExpirar) location.reload()
      else irParaLogin(location.pathname + location.search + location.hash, true)
    })

    const papelAntes = getUsuario()?.papel
    void sincronizarUsuario().then((usuario) => {
      if (!usuario) {
        if (recarregarSeExpirar) location.reload() 
      } else if (usuario.papel !== papelAntes) montarBarraInferior(ativa)
    })
  }
}
