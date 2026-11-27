import { factories } from '@strapi/strapi';
import type { Context } from 'koa';
import { definirData, ehSecretaria, lerData, usuarioDe } from '../../../utils/propriedade';
import { criarAjudantes } from '../../../utils/consulta';

const UID = 'api::produto.produto';

export default factories.createCoreController(UID, ({ strapi }) => {
  const ajuda = criarAjudantes(strapi, UID);

  async function podeAlterar(ctx: Context, permitirSecretaria: boolean): Promise<boolean> {
    const usuario = usuarioDe(ctx);
    if (permitirSecretaria && ehSecretaria(usuario)) return true;

    const produto = await strapi.documents(UID).findOne({
      documentId: ctx.params.id,
      populate: { artesao: { fields: ['documentId'] } },
    });
    return produto?.artesao?.documentId === usuario.documentId;
  }

  function resumoArtesao(produto: { artesao?: { documentId: string; nome?: string } | null }) {
    const artesao = produto.artesao;
    return artesao ? { documentId: artesao.documentId, nome: artesao.nome ?? '' } : null;
  }

  return {
    async find(ctx: Context) {
      const consulta = await ajuda.consulta(ctx);
      const populate = { ...(consulta.populate as object), artesao: { fields: ['nome'] } };
      const { results, pagination } = await strapi.service(UID).find({ ...consulta, populate });
      const seguros = (await ajuda.saida(results, ctx)) as object[];
      const dados = seguros.map((item, i) => ({ ...item, artesao: resumoArtesao(results[i]) }));
      return { data: dados, meta: { pagination } };
    },

    async findOne(ctx: Context) {
      const consulta = await ajuda.consulta(ctx);
      const populate = { ...(consulta.populate as object), artesao: { fields: ['nome'] } };
      const produto = await strapi.service(UID).findOne(ctx.params.id, { ...consulta, populate });
      if (!produto) return ctx.notFound();
      const seguro = (await ajuda.saida(produto, ctx)) as object;
      return { data: { ...seguro, artesao: resumoArtesao(produto) }, meta: {} };
    },

    async meus(ctx: Context) {
      const consulta = await ajuda.consulta(ctx);
      const filtros = { ...(consulta.filters as object), artesao: { documentId: usuarioDe(ctx).documentId } };
      const { results, pagination } = await strapi.service(UID).find({ ...consulta, filters: filtros });
      return { data: await ajuda.saida(results, ctx), meta: { pagination } };
    },

    async create(ctx: Context) {
      const { artesao: _ignorado, ...resto } = lerData(ctx);
      definirData(ctx, resto);
      const resposta = await super.create(ctx);
      await strapi.documents(UID).update({
        documentId: resposta.data.documentId,
        data: { artesao: usuarioDe(ctx).documentId },
      });
      return resposta;
    },

    async update(ctx: Context) {
      if (!(await podeAlterar(ctx, false))) {
        return ctx.forbidden('Você só pode editar os seus próprios produtos.');
      }
      const { artesao: _ignorado, ...resto } = lerData(ctx);
      definirData(ctx, resto);
      return super.update(ctx);
    },

    async delete(ctx: Context) {
      if (!(await podeAlterar(ctx, true))) {
        return ctx.forbidden('Você só pode excluir os seus próprios produtos.');
      }
      return super.delete(ctx);
    },
  };
});
