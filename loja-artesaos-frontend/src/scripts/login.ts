import './estilos'
import { entrar, iniciarSessao } from './api/auth'
import { ApiError } from './api/client'
import { destinoSeguro, estaLogado } from './auth/sessao'
import { buscar, marcarCampo, REGEX_EMAIL } from './utils/dom'

const destino = destinoSeguro(new URLSearchParams(location.search).get('redirect'))

if (estaLogado()) {
  location.replace(destino)
}

if (new URLSearchParams(location.search).get('expirou') === '1') {
  buscar('#aviso-sessao').classList.remove('d-none')
}

const form = buscar<HTMLFormElement>('#form-login')
const botaoEnviar = buscar<HTMLButtonElement>('#btn-enviar')
const erroGeral = buscar<HTMLDivElement>('#erro-geral')
const linkCadastro = buscar<HTMLAnchorElement>('#link-cadastro')
const email = buscar<HTMLInputElement>('#email')
const senha = buscar<HTMLInputElement>('#senha')

function validarEmail(): boolean {
  return marcarCampo(email, REGEX_EMAIL.test(email.value.trim()) ? '' : 'Informe um e-mail válido.')
}

function validarSenha(): boolean {
  return marcarCampo(senha, senha.value !== '' ? '' : 'Informe sua senha.')
}

function traduzirErro(erro: unknown): string {
  if (erro instanceof ApiError) {
    if (erro.status === 0) return erro.message
    if (/invalid identifier or password/i.test(erro.message)) return 'E-mail ou senha incorretos.'
    if (/blocked/i.test(erro.message)) return 'Sua conta foi bloqueada. Fale com a Secretaria.'
    if (/not confirmed/i.test(erro.message)) return 'Confirme seu e-mail antes de entrar.'
  }
  return 'Não foi possível entrar. Tente novamente em instantes.'
}

function definirCarregando(carregando: boolean): void {
  botaoEnviar.disabled = carregando
  botaoEnviar.textContent = carregando ? 'Entrando…' : 'Entrar'
}

email.addEventListener('blur', () => {
  if (email.value !== '') validarEmail()
})
email.addEventListener('input', () => {
  if (email.classList.contains('is-invalid')) validarEmail()
})
senha.addEventListener('input', () => {
  if (senha.classList.contains('is-invalid')) validarSenha()
})

linkCadastro.href = `/cadastro.html?redirect=${encodeURIComponent(destino)}`

form.addEventListener('submit', async (evento) => {
  evento.preventDefault()
  erroGeral.classList.add('d-none')

  const emailOk = validarEmail()
  const senhaOk = validarSenha()
  if (!emailOk || !senhaOk) {
    ;(emailOk ? senha : email).focus()
    return
  }

  definirCarregando(true)
  try {
    const resposta = await entrar(email.value.trim(), senha.value)
    if (!resposta.jwt) throw new Error('Resposta sem token')
    await iniciarSessao(resposta.jwt)
    location.assign(destino)
  } catch (erro) {
    erroGeral.textContent = traduzirErro(erro)
    erroGeral.classList.remove('d-none')
    definirCarregando(false)
  }
})
