import { requisicao } from './client'

interface VendaApi {
  documentId: string
  quantidade: number
  valor: number
  dataVenda: string // "YYYY-MM-DD"
  nomeComprador?: string | null
  produto?: { nome?: string } | null
}

export interface Venda {
  documentId: string
  quantidade: number
  valor: number
  dataVenda: string
  nomeComprador: string | null
  produtoNome: string
}

export interface DadosVenda {
  produto: string 
  quantidade: number
  valor: number
  dataVenda: string
  nomeComprador?: string
}

export async function listarVendas(desde: string, token: string): Promise<Venda[]> {
  const vendas: Venda[] = []
  for (let pagina = 1; pagina <= 10; pagina += 1) {
    const params = new URLSearchParams({
      'populate[produto][fields][0]': 'nome',
      sort: 'dataVenda:desc',
      'filters[dataVenda][$gte]': desde,
      'pagination[page]': String(pagina),
      'pagination[pageSize]': '100',
    })
    const resposta = await requisicao<{ data: VendaApi[]; meta: { pagination: { pageCount: number } } }>(
      `/api/vendas?${params}`,
      { token },
    )
    for (const v of resposta.data) {
      vendas.push({
        documentId: v.documentId,
        quantidade: v.quantidade,
        valor: Number(v.valor),
        dataVenda: v.dataVenda,
        nomeComprador: v.nomeComprador ?? null,
        produtoNome: v.produto?.nome ?? 'Produto removido',
      })
    }
    if (pagina >= resposta.meta.pagination.pageCount) break
  }
  return vendas
}

export function registrarVenda(dados: DadosVenda, token: string): Promise<void> {
  return requisicao<void>('/api/vendas', { method: 'POST', body: { data: dados }, token })
}

export function excluirVenda(documentId: string, token: string): Promise<void> {
  return requisicao<void>(`/api/vendas/${encodeURIComponent(documentId)}`, { method: 'DELETE', token })
}
