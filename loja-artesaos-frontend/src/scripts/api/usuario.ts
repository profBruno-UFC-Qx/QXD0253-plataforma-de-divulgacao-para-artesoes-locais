import { requisicao } from './client'

export function atualizarPerfil(dados: { nome: string; idade: number }, token: string): Promise<void> {
  return requisicao<void>('/api/users/me', { method: 'PUT', body: dados, token })
}

export function trocarSenha(atual: string, nova: string, token: string): Promise<void> {
  return requisicao<void>('/api/auth/change-password', {
    method: 'POST',
    body: { currentPassword: atual, password: nova, passwordConfirmation: nova },
    token,
  })
}
