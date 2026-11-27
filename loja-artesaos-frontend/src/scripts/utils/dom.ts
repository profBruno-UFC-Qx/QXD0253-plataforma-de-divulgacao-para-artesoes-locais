export type CampoForm = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement

export function buscar<T extends HTMLElement>(seletor: string): T {
  const elemento = document.querySelector<T>(seletor)
  if (!elemento) throw new Error(`Elemento ${seletor} não encontrado na página`)
  return elemento
}

export function marcarCampo(input: CampoForm, mensagem: string): boolean {
  input.classList.toggle('is-invalid', mensagem !== '')
  input.setAttribute('aria-invalid', String(mensagem !== ''))
  const aviso = input.parentElement?.querySelector('.invalid-feedback')
  if (aviso) aviso.textContent = mensagem
  return mensagem === ''
}

export const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function campo<T extends HTMLElement = HTMLElement>(raiz: ParentNode, nome: string): T {
  const elemento = raiz.querySelector<T>(`[data-campo="${nome}"]`)
  if (!elemento) throw new Error(`Campo "${nome}" não encontrado`)
  return elemento
}

export function normalizar(texto: string): string {
  return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
}
