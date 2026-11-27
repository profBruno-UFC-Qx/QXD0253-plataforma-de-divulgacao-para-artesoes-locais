import './estilos'
import { montarLayout } from './components/layout'
import { mostrarErroPagina } from './components/erros'

montarLayout({ ativa: null })
mostrarErroPagina(404)
