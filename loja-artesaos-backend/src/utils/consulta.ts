import type { Core, UID } from '@strapi/strapi';
import type { Context } from 'koa';

export function criarAjudantes(strapi: Core.Strapi, uid: UID.ContentType) {
  const modelo = () => strapi.contentType(uid);

  return {
    consulta: (ctx: Context) =>
      strapi.contentAPI.sanitize.query(ctx.query, modelo(), { auth: ctx.state.auth }) as Promise<Record<string, any>>,

    saida: (dados: unknown, ctx: Context) =>
      strapi.contentAPI.sanitize.output(dados, modelo(), { auth: ctx.state.auth }) as Promise<any>,
  };
}
