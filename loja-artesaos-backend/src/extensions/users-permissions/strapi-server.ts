export default (plugin: any) => {
  const atributos = plugin.contentTypes.user.schema.attributes;
  atributos.nome = { type: 'string', minLength: 2, maxLength: 80 };
  atributos.idade = { type: 'integer', min: 14, max: 120 };
  atributos.querSerArtesao = { type: 'boolean', default: false };
  atributos.categoriaArtesanato = { type: 'string', maxLength: 80 };
  atributos.cidade = { type: 'string', maxLength: 80 };
  atributos.whatsapp = { type: 'string', maxLength: 20 };
  atributos.sobreTrabalho = { type: 'text', maxLength: 500 };

  
  const meOriginal = plugin.controllers.user.me;
  plugin.controllers.user.me = async (ctx: any) => {
    await meOriginal(ctx);
    if (ctx.body && ctx.state.user?.role) {
      ctx.body = { ...ctx.body, papel: ctx.state.user.role.type };
    }
  };

  plugin.controllers.user.updateMe = async (ctx: any) => {
    const usuario = ctx.state.user;
    if (!usuario) return ctx.unauthorized();

    const corpo = ctx.request.body ?? {};
    const data: Record<string, unknown> = {};

    if (corpo.nome !== undefined) {
      const nome = String(corpo.nome).trim();
      if (nome.length < 2 || nome.length > 80) return ctx.badRequest('Nome inválido.');
      data.nome = nome;
    }
    if (corpo.idade !== undefined) {
      const idade = Number(corpo.idade);
      if (!Number.isInteger(idade) || idade < 14 || idade > 120) return ctx.badRequest('Idade inválida.');
      data.idade = idade;
    }

    await (globalThis as any).strapi
      .documents('plugin::users-permissions.user')
      .update({ documentId: usuario.documentId, data });

    ctx.body = { ok: true, ...data };
  };

  plugin.routes['content-api'].routes.unshift({
    method: 'PUT',
    path: '/users/me',
    handler: 'user.updateMe',
    config: { prefix: '' },
  });

  return plugin;
};
