import type { Context } from 'koa';

interface UsuarioAutenticado {
  id: number;
  documentId: string;
  role?: { type?: string };
}

export function usuarioDe(ctx: Context): UsuarioAutenticado {
  return ctx.state.user as UsuarioAutenticado;
}

export function ehSecretaria(usuario: UsuarioAutenticado): boolean {
  return usuario.role?.type === 'secretaria';
}

export function lerData(ctx: Context): Record<string, unknown> {
  const corpo = (ctx.request as unknown as { body?: { data?: Record<string, unknown> } }).body;
  return corpo?.data ?? {};
}

export function definirData(ctx: Context, data: Record<string, unknown>): void {
  (ctx.request as unknown as { body: unknown }).body = { data };
}
