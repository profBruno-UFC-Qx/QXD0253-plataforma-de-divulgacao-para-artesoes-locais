import type { Core } from '@strapi/strapi';
import { criarCategoriasIniciais, sincronizarPapeis } from './bootstrap/papeis';

export default {
  register() {},

  async bootstrap({ strapi }: { strapi: Core.Strapi }) {
    await sincronizarPapeis(strapi);
    await criarCategoriasIniciais(strapi);
  },
};
