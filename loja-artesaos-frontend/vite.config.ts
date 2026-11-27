import { existsSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { defineConfig, type Connect, type Plugin } from 'vite'

function pagina404(): Plugin {
  function criarMiddleware(raiz: string, preparar: (html: string) => Promise<string>): Connect.NextHandleFunction {
    return async (req, res, next) => {
      const caminho = decodeURIComponent((req.url ?? '/').split('?')[0] ?? '/')
      const arquivo = caminho.endsWith('/') ? join(raiz, caminho, 'index.html') : join(raiz, caminho)
      const querHtml = (req.headers.accept ?? '').includes('text/html')
      const pagina = join(raiz, '404.html')
      if (req.method !== 'GET' || !querHtml || existsSync(arquivo) || !existsSync(pagina)) return next()

      res.statusCode = 404
      res.setHeader('Content-Type', 'text/html; charset=utf-8')
      res.end(await preparar(readFileSync(pagina, 'utf-8')))
    }
  }

  return {
    name: 'pagina-404',
    configureServer(servidor) {
      return () => {
        servidor.middlewares.use(
          criarMiddleware(servidor.config.root, (html) => servidor.transformIndexHtml('/404.html', html)),
        )
      }
    },
    configurePreviewServer(servidor) {
      const saida = join(servidor.config.root, servidor.config.build.outDir)
      servidor.middlewares.use(criarMiddleware(saida, (html) => Promise.resolve(html)))
    },
  }
}

export default defineConfig({
  appType: 'mpa',
  plugins: [pagina404()],
  build: {
    rollupOptions: {
      input: {
        index: resolve(import.meta.dirname, 'index.html'),
        notFound: resolve(import.meta.dirname, '404.html'),
        login: resolve(import.meta.dirname, 'login.html'),
        cadastro: resolve(import.meta.dirname, 'cadastro.html'),
        produto: resolve(import.meta.dirname, 'produto.html'),
        perfil: resolve(import.meta.dirname, 'perfil.html'),
        eventos: resolve(import.meta.dirname, 'eventos.html'),
        artesoes: resolve(import.meta.dirname, 'artesoes.html'),
        artesaoPerfil: resolve(import.meta.dirname, 'artesao-perfil.html'),
        obras: resolve(import.meta.dirname, 'obras.html'),
        produtoForm: resolve(import.meta.dirname, 'produto-form.html'),
      },
    },
  },
})
