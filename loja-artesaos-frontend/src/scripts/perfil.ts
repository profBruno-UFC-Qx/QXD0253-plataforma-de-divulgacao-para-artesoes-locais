import './estilos'
import { ApiError } from './api/client'
import { atualizarPerfil, trocarSenha } from './api/usuario'
import { exigirSessao } from './auth/acesso'
import { encerrarSessao, getToken, getUsuario, salvarUsuario, type Papel, type UsuarioLogado } from './auth/sessao'
import { montarLayout } from './components/layout'
import { tratarErroDeAcao } from './components/erros'
import { getTema, salvarTema, type Tema } from './tema'
import { buscar, marcarCampo } from './utils/dom'
import { iniciais } from './utils/formatadores'
import { IDADE_MAXIMA, IDADE_MINIMA, SENHA_MINIMA } from './utils/regras'

const ROTULO_PAPEL: Record<Papel, string> = {
  comprador: 'Comprador',
  artesao: 'Artesão',
  secretaria: 'Secretaria',
}

montarLayout({ ativa: 'perfil' })

function mostrarMensagem(caixa: HTMLElement, tipo: 'sucesso' | 'erro', texto: string): void {
  caixa.textContent = texto
  caixa.classList.remove('d-none', 'alert-success', 'alert-danger')
  caixa.classList.add(tipo === 'sucesso' ? 'alert-success' : 'alert-danger')
}

function textoDoErro(erro: unknown, padrao: string): string | null {
  if (erro instanceof ApiError && erro.status === 400) {
    if (/current password is invalid/i.test(erro.message)) return 'A senha atual está incorreta.'
    if (/must be different/i.test(erro.message)) return 'A nova senha precisa ser diferente da atual.'
  }
  return tratarErroDeAcao(erro, padrao)
}

function preencherTela(usuario: UsuarioLogado): void {
  buscar('#avatar').textContent = iniciais(usuario.nome)
  buscar('#nome-topo').textContent = usuario.nome
  buscar('#email-topo').textContent = usuario.email
  buscar('#papel').textContent = ROTULO_PAPEL[usuario.papel]
  buscar<HTMLInputElement>('#nome').value = usuario.nome
  buscar<HTMLInputElement>('#idade').value = usuario.idade === null ? '' : String(usuario.idade)
  buscar<HTMLInputElement>('#email').value = usuario.email
  buscar('#aviso-artesao').classList.toggle('d-none', !(usuario.papel === 'comprador' && usuario.querSerArtesao))
}

function configurarDados(): void {
  const form = buscar<HTMLFormElement>('#form-dados')
  const nome = buscar<HTMLInputElement>('#nome')
  const idade = buscar<HTMLInputElement>('#idade')
  const mensagem = buscar('#msg-dados')
  const botao = buscar<HTMLButtonElement>('#btn-dados')

  const validarNome = () => marcarCampo(nome, nome.value.trim().length >= 2 ? '' : 'Informe seu nome (mínimo de 2 letras).')
  const validarIdade = () => {
    const n = Number(idade.value)
    const ok = Number.isInteger(n) && n >= IDADE_MINIMA && n <= IDADE_MAXIMA
    return marcarCampo(idade, ok ? '' : `Informe uma idade entre ${IDADE_MINIMA} e ${IDADE_MAXIMA} anos.`)
  }

  form.addEventListener('submit', async (evento) => {
    evento.preventDefault()
    mensagem.classList.add('d-none')
    const nomeOk = validarNome()
    const idadeOk = validarIdade()
    if (!nomeOk || !idadeOk) return

    const token = getToken()
    if (!token) return
    botao.disabled = true
    try {
      const dados = { nome: nome.value.trim(), idade: Number(idade.value) }
      await atualizarPerfil(dados, token)
      const atual = getUsuario()
      if (atual) {
        const novo = { ...atual, ...dados }
        salvarUsuario(novo)
        preencherTela(novo)
      }
      mostrarMensagem(mensagem, 'sucesso', 'Dados atualizados com sucesso.')
    } catch (erro) {
      const texto = textoDoErro(erro, 'Não foi possível salvar os dados.')
      if (texto) mostrarMensagem(mensagem, 'erro', texto)
    } finally {
      botao.disabled = false
    }
  })
}

function configurarSenha(): void {
  const form = buscar<HTMLFormElement>('#form-senha')
  const atual = buscar<HTMLInputElement>('#senha-atual')
  const nova = buscar<HTMLInputElement>('#senha-nova')
  const confirmar = buscar<HTMLInputElement>('#senha-confirmar')
  const mensagem = buscar('#msg-senha')
  const botao = buscar<HTMLButtonElement>('#btn-senha')

  const validar = () => {
    const a = marcarCampo(atual, atual.value !== '' ? '' : 'Informe sua senha atual.')
    const n = marcarCampo(nova, nova.value.length >= SENHA_MINIMA ? '' : `A senha precisa ter pelo menos ${SENHA_MINIMA} caracteres.`)
    const c = marcarCampo(confirmar, confirmar.value !== '' && confirmar.value === nova.value ? '' : 'As senhas não são iguais.')
    return a && n && c
  }

  form.addEventListener('submit', async (evento) => {
    evento.preventDefault()
    mensagem.classList.add('d-none')
    if (!validar()) return

    const token = getToken()
    if (!token) return
    botao.disabled = true
    try {
      await trocarSenha(atual.value, nova.value, token)
      form.reset()
      mostrarMensagem(mensagem, 'sucesso', 'Senha alterada com sucesso.')
    } catch (erro) {
      const texto = textoDoErro(erro, 'Não foi possível alterar a senha.')
      if (texto) mostrarMensagem(mensagem, 'erro', texto)
    } finally {
      botao.disabled = false
    }
  })
}

function configurarTema(): void {
  const marcado = document.querySelector<HTMLInputElement>(`input[name="tema"][value="${getTema()}"]`)
  if (marcado) marcado.checked = true
  for (const opcao of document.querySelectorAll<HTMLInputElement>('input[name="tema"]')) {
    opcao.addEventListener('change', () => salvarTema(opcao.value as Tema))
  }
}

async function iniciar(): Promise<void> {
  const usuario = await exigirSessao()
  if (!usuario) return
  preencherTela(usuario)

  configurarDados()
  configurarSenha()
  configurarTema()
  buscar('#btn-sair-perfil').addEventListener('click', () => {
    encerrarSessao()
    location.assign('/')
  })
}

void iniciar()
