import './estilos'
import { cadastrar, iniciarSessao } from './api/auth'
import { ApiError } from './api/client'
import { destinoSeguro, estaLogado } from './auth/sessao'
import { listarCategorias } from './api/produtos'
import { buscar, marcarCampo, REGEX_EMAIL, type CampoForm } from './utils/dom'
import { IDADE_MAXIMA, IDADE_MINIMA, SENHA_MINIMA } from './utils/regras'

const destino = destinoSeguro(new URLSearchParams(location.search).get('redirect'))

if (estaLogado()) {
  location.replace(destino)
}

const form = buscar<HTMLFormElement>('#form-cadastro')
const botaoEnviar = buscar<HTMLButtonElement>('#btn-enviar')
const erroGeral = buscar<HTMLDivElement>('#erro-geral')
const querArtesao = buscar<HTMLInputElement>('#quer-artesao')

const campos = {
  nome: buscar<HTMLInputElement>('#nome'),
  idade: buscar<HTMLInputElement>('#idade'),
  email: buscar<HTMLInputElement>('#email'),
  senha: buscar<HTMLInputElement>('#senha'),
  confirmar: buscar<HTMLInputElement>('#confirmar'),
}
const extras = {
  categoria: buscar<HTMLSelectElement>('#categoria'),
  cidade: buscar<HTMLInputElement>('#cidade'),
  whatsapp: buscar<HTMLInputElement>('#whatsapp'),
  sobre: buscar<HTMLTextAreaElement>('#sobre'),
}
const blocoArtesao = buscar<HTMLFieldSetElement>('#campos-artesao')
const todosOsCampos: CampoForm[] = [...Object.values(campos), extras.categoria, extras.cidade, extras.whatsapp]

function camposAtivos(): CampoForm[] {
  return querArtesao.checked ? todosOsCampos : Object.values(campos)
}

const apenasDigitos = (texto: string): string => texto.replace(/\D/g, '')

function mensagemDeErro(input: CampoForm): string {
  const valor = input.value

  switch (input) {
    case campos.nome:
      return valor.trim().length >= 2 ? '' : 'Informe seu nome (mínimo de 2 letras).'
    case campos.idade: {
      const idade = Number(valor)
      const valida = Number.isInteger(idade) && idade >= IDADE_MINIMA && idade <= IDADE_MAXIMA
      return valida ? '' : `Informe uma idade entre ${IDADE_MINIMA} e ${IDADE_MAXIMA} anos.`
    }
    case campos.email:
      return REGEX_EMAIL.test(valor.trim()) ? '' : 'Informe um e-mail válido.'
    case campos.senha:
      return valor.length >= SENHA_MINIMA ? '' : `A senha precisa ter pelo menos ${SENHA_MINIMA} caracteres.`
    case campos.confirmar:
      return valor !== '' && valor === campos.senha.value ? '' : 'As senhas não são iguais.'
    case extras.categoria:
      return valor !== '' ? '' : 'Escolha a categoria do seu artesanato.'
    case extras.cidade:
      return valor.trim().length >= 2 ? '' : 'Informe a sua cidade.'
    case extras.whatsapp: {
      const digitos = apenasDigitos(valor).length
      return digitos === 10 || digitos === 11 ? '' : 'Informe o WhatsApp com DDD, por exemplo (85) 99999-9999.'
    }
    default:
      return ''
  }
}

function validarCampo(input: CampoForm): boolean {
  return marcarCampo(input, mensagemDeErro(input))
}

function traduzirErro(erro: unknown): string {
  if (erro instanceof ApiError) {
    if (/already taken/i.test(erro.message)) return 'Este e-mail já está cadastrado. Tente entrar.'
    if (erro.status === 0) return erro.message
  }
  return 'Não foi possível criar a conta. Tente novamente em instantes.'
}

function mostrarErroGeral(mensagem: string): void {
  erroGeral.textContent = mensagem
  erroGeral.classList.remove('d-none')
}

function definirCarregando(carregando: boolean): void {
  botaoEnviar.disabled = carregando
  botaoEnviar.textContent = carregando ? 'Criando conta…' : 'Criar conta'
}

for (const input of todosOsCampos) {
  input.addEventListener('blur', () => {
    if (input.value !== '') validarCampo(input)
  })
  input.addEventListener('input', () => {
    if (input.classList.contains('is-invalid')) validarCampo(input)
    // Se a senha mudar, a confirmação precisa ser conferida de novo
    if (input === campos.senha && campos.confirmar.value !== '') validarCampo(campos.confirmar)
  })
}

async function carregarCategorias(): Promise<void> {
  if (extras.categoria.options.length > 1) return // já carregadas
  try {
    for (const categoria of await listarCategorias()) {
      extras.categoria.add(new Option(categoria.nome, categoria.nome))
    }
  } catch {
    marcarCampo(extras.categoria, 'Não foi possível carregar as categorias. Desmarque e marque a opção de novo.')
  }
}

querArtesao.addEventListener('change', () => {
  blocoArtesao.hidden = !querArtesao.checked
  if (querArtesao.checked) void carregarCategorias()
})

buscar<HTMLAnchorElement>('#link-login').href = `/login.html?redirect=${encodeURIComponent(destino)}`

form.addEventListener('submit', async (evento) => {
  evento.preventDefault()
  erroGeral.classList.add('d-none')

  const invalidos = camposAtivos().filter((input) => !validarCampo(input))
  if (invalidos.length > 0) {
    invalidos[0]?.focus()
    return
  }

  definirCarregando(true)
  try {
    const resposta = await cadastrar({
      nome: campos.nome.value.trim(),
      idade: Number(campos.idade.value),
      email: campos.email.value.trim(),
      senha: campos.senha.value,
      querSerArtesao: querArtesao.checked,
      artesao: querArtesao.checked
        ? {
            categoriaArtesanato: extras.categoria.value,
            cidade: extras.cidade.value.trim(),
            whatsapp: apenasDigitos(extras.whatsapp.value),
            sobreTrabalho: extras.sobre.value.trim(),
          }
        : undefined,
    })

    if (!resposta.jwt) {
      mostrarErroGeral('Conta criada! Confirme seu e-mail para conseguir entrar.')
      definirCarregando(false)
      return
    }

    await iniciarSessao(resposta.jwt)
    location.assign(destino)
  } catch (erro) {
    mostrarErroGeral(traduzirErro(erro))
    definirCarregando(false)
  }
})
