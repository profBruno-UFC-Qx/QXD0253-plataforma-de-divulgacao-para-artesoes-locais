# :checkered_flag: Loja Virtual para Artesãos Locais

Uma plataforma de e-commerce simplificada onde artesãos locais podem divulgar e vender seus produtos, 
conectando-os diretamente aos consumidores da comunidade.

## :technologist: Membros da equipe

535636, Lucas Cavalcante Maciel, Ciência da Computação.

## :bulb: Objetivo Geral
Criar uma vitrine digital para artesãos exibirem seus trabalhos e gerenciarem vendas(Não necessariamente vender pelo site, mas sim ter um controle de vendas.) de forma simplificada, facilitando o acesso dos consumidores aos produtos locais.


## :eyes: Público-Alvo

Quem serão os clientes? A secretaria do meio ambiente do municipio de capistrano (o nome do responsavel eu ainda vou me informar)
Quem (parcela da sociedade) participará da concepção deste sistema? Os artesões de capistrano e de outros municipios do maciço de baturiter.



## :star2: Impacto Esperado
Promover a cultura e o artesanato local, dando uma maior visibilidade digital aos pequenos produtores da cidade para aumentar a renda dos artesãos.


## :people_holding_hands: Papéis ou tipos de usuário da aplicação

* **Comprador não logado (Visitante):** Pode acessar a área pública para visualizar o catálogo de produtos,eventos e detalhes dos itens.
* **Artesão:** Usuário logado com acesso a um painel restrito exclusivo para cadastrar, editar e excluir seus próprios produtos, além de uma aréa para visualizar/controlar pedidos recebidos/vendas feitas no mês.
* **Secretaria (Administrador):** Usuário logado com acesso restrito total para moderar cadastros de artesãos e gerenciar as categorias gerais de produtos do sistema responsavel por cria eventos.
> Tenha em mente que obrigatoriamente a aplicação deve possuir funcionalidades acessíveis a todos os tipos de usuário e outra funcionalidades restritas a certos tipos de usuários.

## :triangular_flag_on_post:	 Principais funcionalidades da aplicação

**Funcionalidades Acessíveis a todos:**
* Visualização da página inicial e listagem do catálogo completo de produtos.
*  Visualização da página de detalhes de um produtor.
* Criação de conta (Cadastro de novos Compradores e Artesãos).

**Funcionalidades Restritas :**
* **Comprador:** Visualização da página de detalhes de um produto específico.
* **Artesão:** CRUD completo (Criar, Ler, Atualizar e Deletar) dos seus próprios produtos vinculados ao seu perfil e  de vendas.
* **Secretaria:** CRUD completo (Criar, Ler, Atualizar e Deletar) de Categorias de produtos e eventos.
* Barra de navegação com funcionalidade de *Logout* (encerrar sessão).

## :spiral_calendar: Entidades ou tabelas do sistema

## :spiral_calendar: Entidades ou tabelas do sistema

* **Usuários:** Gerencia dados de autenticação e perfis (Comprador, Artesão, Secretaria).
* **Categorias:** Classificação dos produtos (Ex: Cerâmica, Roupas, Alimentos).
* **Produtos:** Armazena os itens à venda (Nome, descrição, preço, imagem). **Entidade dependente:** Um produto pertence a uma Categoria e é criado por um Usuário (Artesão).
* **Vendas:** Armazena o registro de controle manual de vendas feitas pelo artesão (Preço, data). **Entidade dependente:** Uma venda está vinculada a um Produto (o item comercializado) e aos Usuários envolvidos (o Artesão que vendeu e o Comprador).
