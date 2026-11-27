export interface Barra {
  rotulo: string
  valor: number
}

export function desenharGrafico(container: HTMLElement, barras: Barra[], descricao: string): void {
  const maior = Math.max(...barras.map((b) => b.valor), 0)
  container.setAttribute('role', 'img')
  container.setAttribute('aria-label', `${descricao}: ${barras.map((b) => `${b.rotulo} ${b.valor}`).join(', ')}`)

  const colunas = barras.map((barra) => {
    const item = document.createElement('div')
    item.className = 'grafico__item'

    const valor = document.createElement('span')
    valor.className = 'grafico__valor'
    valor.textContent = String(barra.valor)

    const coluna = document.createElement('div')
    coluna.className = 'grafico__coluna'
    const altura = maior === 0 ? 0 : Math.max((barra.valor / maior) * 100, barra.valor > 0 ? 4 : 0)
    coluna.style.setProperty('--altura', `${altura}%`)

    const rotulo = document.createElement('span')
    rotulo.className = 'grafico__rotulo'
    rotulo.textContent = barra.rotulo

    item.append(valor, coluna, rotulo)
    return item
  })
  container.replaceChildren(...colunas)
}
