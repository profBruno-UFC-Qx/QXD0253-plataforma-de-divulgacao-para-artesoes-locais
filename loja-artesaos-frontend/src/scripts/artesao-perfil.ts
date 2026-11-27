import './estilos'
import { aceitarComoArtesao, buscarUsuario, recusarPedido, removerArtesao } from './api/artesoes'
import { exigirPapel } from './auth/acesso'
import { getToken } from './auth/sessao'
import { montarLayout } from './components/layout'
import { mostrarErroPagina, tratarErroDeAcao, tratarErroDePagina } from './components/erros'
import type { UsuarioAdmin } from './types'
import { buscar } from './utils/dom'
import { formatarData, formatarTelefone, iniciais } from './utils/formatadores'

montarLayout({ ativa: 'artesoes' })

async function iniciar(): Promise<void> {
  if (!(await exigirPapel(['secretaria']))) return // área exclusiva da Secretaria

  const carregando = buscar('#carregando')
  const perfil = buscar('#perfil')
  const mensagem = buscar('#msg')
  const btnAceitar = buscar<HTMLButtonElement>('#btn-aceitar')
  const btnRecusar = buscar<HTMLButtonElement>('#btn-recusar')
  const btnRemover = buscar<HTMLButtonElement>('#btn-remover')
  const id = new URLSearchParams(location.search).get('id')
  let usuario: UsuarioAdmin | null = null

  function mostrarMensagem(tipo: 'sucesso' | 'erro', texto: string): void {
    mensagem.textContent = texto
    mensagem.classList.remove('d-none', 'alert-success', 'alert-danger')
    mensagem.classList.add(tipo === 'sucesso' ? 'alert-success' : 'alert-danger')
  }

  function texto(seletor: string, valor: string | null | undefined, padrao = 'Não informado'): void {
    buscar(seletor).textContent = valor && valor !== '' ? valor : padrao
  }

  function desenhar(u: UsuarioAdmin): void {
    document.title = `${u.nome} · Artesanato do Maciço`
    buscar('#avatar').textContent = iniciais(u.nome)
    texto('#nome', u.nome)
    texto('#email', u.email)
    texto('#idade', u.idade === null ? null : `${u.idade} anos`)
    texto('#cidade', u.cidade)
    texto('#categoria', u.categoria)
    texto('#criado', formatarData(u.criadoEm))
    texto('#sobre', u.sobre, 'O usuário não escreveu nada sobre o trabalho.')

    const whatsapp = buscar('#whatsapp')
    if (u.whatsapp) {
      const link = document.createElement('a')
      link.href = `https://wa.me/55${u.whatsapp}`
      link.target = '_blank'
      link.rel = 'noopener noreferrer'
      link.textContent = formatarTelefone(u.whatsapp)
      whatsapp.replaceChildren(link)
    } else {
      whatsapp.textContent = 'Não informado'
    }

    const pedido = u.papel === 'comprador' && u.querSerArtesao
    const situacao = buscar('#situacao')
    situacao.className = pedido ? 'chip chip--alerta' : 'chip chip--ok'
    situacao.textContent =
      u.papel === 'artesao' ? 'Artesão' : u.papel === 'secretaria' ? 'Secretaria' : pedido ? 'Pedido pendente' : 'Comprador'

    btnAceitar.hidden = u.papel !== 'comprador'
    btnAceitar.textContent = pedido ? 'Aceitar como artesão' : 'Tornar artesão'
    btnRecusar.hidden = !pedido
    btnRemover.hidden = u.papel !== 'artesao'
    buscar('#acoes-texto').textContent =
      u.papel === 'artesao'
        ? 'Este usuário é um artesão e pode cadastrar produtos e registrar vendas.'
        : u.papel === 'secretaria'
          ? 'Esta é uma conta da Secretaria.'
          : pedido
            ? 'Este usuário pediu para vender como artesão. Ao aceitar, o painel Obras é liberado para ele.'
            : 'Este usuário é um comprador e não pediu para ser artesão.'
  }

  async function executar(acao: (idUsuario: number, token: string) => Promise<void>, sucesso: string): Promise<void> {
    const token = getToken()
    if (!token || !usuario) return
    for (const b of [btnAceitar, btnRecusar, btnRemover]) b.disabled = true
    try {
      await acao(usuario.id, token)
      usuario = await buscarUsuario(String(usuario.id), token)
      desenhar(usuario)
      mostrarMensagem('sucesso', sucesso)
    } catch (e) {
      const texto = tratarErroDeAcao(e, 'Não foi possível concluir a ação. Tente novamente.')
      if (texto) mostrarMensagem('erro', texto)
    } finally {
      for (const b of [btnAceitar, btnRecusar, btnRemover]) b.disabled = false
    }
  }

  btnAceitar.addEventListener('click', () => void executar(aceitarComoArtesao, 'Pronto! Agora este usuário é um artesão.'))
  btnRecusar.addEventListener('click', () => {
    if (window.confirm('Recusar o pedido? O usuário continua como comprador.')) {
      void executar(recusarPedido, 'Pedido recusado.')
    }
  })
  btnRemover.addEventListener('click', () => {
    if (window.confirm('Remover a permissão de artesão? Ele volta a ser comprador e perde o acesso ao painel Obras.')) {
      void executar(removerArtesao, 'Permissão removida. O usuário voltou a ser comprador.')
    }
  })

  if (!id || !/^\d+$/.test(id)) {
    mostrarErroPagina(404)
    return
  }

  try {
    const token = getToken()
    if (!token) return
    usuario = await buscarUsuario(id, token)
    desenhar(usuario)
    carregando.hidden = true
    perfil.hidden = false
  } catch (e) {
    tratarErroDePagina(e)
  }
}

void iniciar()
