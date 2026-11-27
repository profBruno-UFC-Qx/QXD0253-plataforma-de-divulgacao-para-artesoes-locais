import { factories } from '@strapi/strapi';
import type { Context } from 'koa';
import { definirData, lerData, usuarioDe } from '../../../utils/propriedade';
import { criarAjudantes } from '../../../utils/consulta';

const UID = 'api::venda.venda';

export default factories.createCoreController(UID, ({ strapi }) => {
  const ajuda = criarAjudantes(strapi, UID);

  async function vendaEDoUsuario(ctx: Context): Promise<boolean> {
    const venda = await strapi.documents(UID).findOne({
      documentId: ctx.params.id,
      populate: { artesao: { fields: ['documentId'] } },
    });
    return venda?.artesao?.documentId === usuarioDe(ctx).documentId;
  }

  return {
    // artesão só ve as próprias vendas
    async find(ctx: Context) {
      const consulta = await ajuda.consulta(ctx);
      const filtros = { ...(consulta.filters as object), artesao: { documentId: usuarioDe(ctx).documentId } };
      const { results, pagination } = await strapi.service(UID).find({ ...consulta, filters: filtros });
      return { data: await ajuda.saida(results, ctx), meta: { pagination } };
    },

    async findOne(ctx: Context) {
      if (!(await vendaEDoUsuario(ctx))) return ctx.forbidden('Essa venda não é sua.');
      return super.findOne(ctx);
    },

    async create(ctx: Context) {
      const usuario = usuarioDe(ctx);
      const data = lerData(ctx);

      const produto = await strapi.documents('api::produto.produto').findOne({
        documentId: String(data.produto ?? ''),
        populate: { artesao: { fields: ['documentId'] } },
      });
      if (produto?.artesao?.documentId !== usuario.documentId) {
        return ctx.forbidden('Você só pode registrar vendas dos seus próprios produtos.');
      }

      const { artesao: _ignorado, ...resto } = data;
      definirData(ctx, resto);
      const resposta = await super.create(ctx);
      await strapi.documents(UID).update({
        documentId: resposta.data.documentId,
        data: { artesao: usuario.documentId },
      });
      return resposta;
    },

    async update(ctx: Context) {
      if (!(await vendaEDoUsuario(ctx))) return ctx.forbidden('Essa venda não é sua.');
      const { artesao: _a, produto: _p, ...resto } = lerData(ctx);
      definirData(ctx, resto);
      return super.update(ctx);
    },

    async delete(ctx: Context) {
      if (!(await vendaEDoUsuario(ctx))) return ctx.forbidden('Essa venda não é sua.');
      return super.delete(ctx);
    },
  };
});
