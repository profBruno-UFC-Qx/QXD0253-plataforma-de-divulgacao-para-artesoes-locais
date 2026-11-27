export function desenharPaginacao(nav: HTMLElement, atual: number, total: number, aoMudar: (pagina: number) => void): void {
  nav.hidden = total <= 1
  if (total <= 1) {
    nav.replaceChildren()
    return
  }

  const lista = document.createElement('ul')
  lista.className = 'pagination justify-content-center mb-0'

  function item(rotulo: string, pagina: number, opcoes: { ativo?: boolean; desabilitado?: boolean; aria?: string } = {}): void {
    const li = document.createElement('li')
    li.className = `page-item${opcoes.ativo ? ' active' : ''}${opcoes.desabilitado ? ' disabled' : ''}`
    const botao = document.createElement('button')
    botao.type = 'button'
    botao.className = 'page-link'
    botao.textContent = rotulo
    botao.disabled = opcoes.desabilitado === true
    if (opcoes.aria) botao.setAttribute('aria-label', opcoes.aria)
    if (opcoes.ativo) botao.setAttribute('aria-current', 'page')
    botao.addEventListener('click', () => aoMudar(pagina))
    li.append(botao)
    lista.append(li)
  }

  const inicio = Math.max(1, Math.min(atual - 2, total - 4))
  const fim = Math.min(total, inicio + 4)

  item('‹', atual - 1, { desabilitado: atual === 1, aria: 'Página anterior' })
  for (let p = inicio; p <= fim; p += 1) item(String(p), p, { ativo: p === atual, aria: `Página ${p}` })
  item('›', atual + 1, { desabilitado: atual === total, aria: 'Próxima página' })

  nav.replaceChildren(lista)
}
