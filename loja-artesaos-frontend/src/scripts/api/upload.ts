import { requisicao } from './client'

export async function enviarImagem(arquivo: File, token: string): Promise<number> {
  const formulario = new FormData()
  formulario.append('files', arquivo)
  const resposta = await requisicao<{ id: number }[]>('/api/upload', { method: 'POST', body: formulario, token })
  const id = resposta[0]?.id
  if (id === undefined) throw new Error('O servidor não confirmou o envio da imagem.')
  return id
}
