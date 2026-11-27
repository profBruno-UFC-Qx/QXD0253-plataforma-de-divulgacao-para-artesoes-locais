export interface Categoria {
  id: number
  documentId: string
  nome: string
}

export interface Produto {
  id: number
  documentId: string
  nome: string
  descricao: string
  preco: number
  peso: number | null
  categoria: Categoria | null
  imagemUrl: string | null
  miniaturaUrl: string | null
  criadoEm: string 
  artesao: { documentId: string; nome: string } | null
}

export interface Evento {
  id: number
  documentId: string
  titulo: string
  descricao: string
  dataEvento: string 
  imagemUrl: string | null
}

export interface UsuarioAdmin {
  id: number
  nome: string
  email: string
  idade: number | null
  whatsapp: string | null
  cidade: string | null
  categoria: string | null
  sobre: string | null
  querSerArtesao: boolean
  papel: 'comprador' | 'artesao' | 'secretaria'
  criadoEm: string
}
