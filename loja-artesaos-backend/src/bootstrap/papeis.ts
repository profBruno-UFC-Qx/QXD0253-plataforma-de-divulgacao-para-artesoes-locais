import type { Core } from '@strapi/strapi';

const LEITURA = [
  'api::produto.produto.find',
  'api::produto.produto.findOne',
  'api::categoria.categoria.find',
  'api::categoria.categoria.findOne',
  'api::evento.evento.find',
  'api::evento.evento.findOne',
  'plugin::users-permissions.user.me',
  'plugin::users-permissions.user.updateMe',
  'plugin::users-permissions.auth.changePassword',
];

const crud = (api: string) => ['find', 'findOne', 'create', 'update', 'delete'].map((a) => `${api}.${a}`);

const PAPEIS = [
  {
    type: 'comprador',
    name: 'Comprador',
    description: 'Visualiza produtos, categorias e eventos.',
    acoes: LEITURA,
  },
  {
    type: 'artesao',
    name: 'Artesao',
    description: 'Gerencia os próprios produtos e vendas.',
    acoes: [
      ...LEITURA,
      'api::produto.produto.meus',
      'api::produto.produto.create',
      'api::produto.produto.update',
      'api::produto.produto.delete',
      ...crud('api::venda.venda'),
      'plugin::upload.content-api.upload',
    ],
  },
  {
    type: 'secretaria',
    name: 'Secretaria',
    description: 'Modera artesãos e gerencia categorias e eventos.',
    acoes: [
      ...LEITURA,
      'api::produto.produto.delete',
      ...crud('api::categoria.categoria'),
      ...crud('api::evento.evento'),
      'plugin::users-permissions.user.find',
      'plugin::users-permissions.user.findOne',
      'plugin::users-permissions.user.update',
      'plugin::users-permissions.role.find',
      'plugin::upload.content-api.upload',
    ],
  },
];

// Visitantes limita visão
const PUBLICO = [
  'api::produto.produto.find',
  'api::categoria.categoria.find',
  'api::evento.evento.find',
];

const CATEGORIAS_INICIAIS = ['Cerâmica', 'Renda e bordado', 'Palha', 'Alimentos', 'Tecidos'];

async function garantirPermissoes(strapi: Core.Strapi, roleId: number, acoes: string[]) {
  const query = strapi.db.query('plugin::users-permissions.permission');
  for (const action of acoes) {
    const existe = await query.findOne({ where: { action, role: { id: roleId } } });
    if (!existe) await query.create({ data: { action, role: roleId } });
  }
}

export async function sincronizarPapeis(strapi: Core.Strapi): Promise<void> {
  const roles = strapi.db.query('plugin::users-permissions.role');

  for (const papel of PAPEIS) {
    const role =
      (await roles.findOne({ where: { type: papel.type } })) ??
      (await roles.create({ data: { type: papel.type, name: papel.name, description: papel.description } }));
    await garantirPermissoes(strapi, role.id, papel.acoes);
  }

  const publico = await roles.findOne({ where: { type: 'public' } });
  if (publico) await garantirPermissoes(strapi, publico.id, PUBLICO);

  const store = strapi.store({ type: 'plugin', name: 'users-permissions' });
  const avancado = ((await store.get({ key: 'advanced' })) ?? {}) as Record<string, unknown>;
  if (avancado.default_role !== 'comprador' || avancado.email_confirmation !== false) {
    await store.set({ key: 'advanced', value: { ...avancado, default_role: 'comprador', email_confirmation: false } });
  }
}

export async function criarCategoriasIniciais(strapi: Core.Strapi): Promise<void> {
  const total = await strapi.documents('api::categoria.categoria').count({});
  if (total > 0) return;
  for (const nome of CATEGORIAS_INICIAIS) {
    await strapi.documents('api::categoria.categoria').create({ data: { nome } });
  }
}
