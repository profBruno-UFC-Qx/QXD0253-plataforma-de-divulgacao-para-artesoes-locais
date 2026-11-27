# :package: Entrega Final

## :computer: Como executar o projeto

##Pré-requisitos
============================================
Node.js 20.19 ou superior \
npm (instalado junto com o Node). \
As portas 1337 (Strapi) e 5173 (site) livres.
============================================
#Back-end# \
cd backend \
Copy-Item .env.example .env  (windows)  \
cp .env.example .env         (linux)    \
npm install \
npm run dev 
---------------------------------------------
#Front-end# \
cd frontend \
npm install \
npm run dev 
===========================================


## :key: Credenciais de acesso para teste

Papel |	E-mail |	Senha \
Secretaria (administrador do site) |	secretaria@teste.com |	senha_teste_secretaria \
Artesão	| artesao@teste.com	| senha_teste_artesao \
Comprador	| comprador@teste.com	| senha_teste_comprador \
Administrador do painel Strapi (/admin)	| teste@gmail.com |	TesteFinal01 


## :robot: Uso de ferramentas de Inteligência Artificial
Sim. Utilizei o Claude por chat
* Correção de erros: enviei as mensagens de erro do terminal e do navegador, e ele explicou as causas e ajustou o código.
* Documentação: ajudou a escrever este README.
* codigo back por não ter muita esperiencia com back e nunca ter usado o strapi ele me ajudou dando sugestões do que faltava nas tabelas e e ajudou na correção de bug de codigo
* codigo front me ajudou com o layout de botões utilizando também o bootstrap, novamente com bugs e também me ajudou com chamada de rotas que acabava me confundindo as vezes
* também me ajudou respondendo perguntas de comandos especificos do termianl, e com alguns erros do typescript


## :construction: Maiores dificuldades encontradas

Acabei fazendo o trabalho solo então não tive muita dificuldade com versões ou em organizações minha maior dificuldade foi a respeito do desenvolvimento back que não sou bom


## :warning: Limitações conhecidas

bugs conhecidos não tem, mas funcionalidades que eu queria ter implementado não foram feitas
categorias virou algo fixo eu criei alguns tipos o plano era ter um campo interativo onde secretaria poderia criar essas categorias 
ter uma pagina ou filtro na home para que as pessoas pudessem filtra por categorias
não deu para implementar um modo de o comprador entra em contato com o vendedor sobre um produto


<!-- kit:fim-secoes-genericas -->

## :desktop_computer: Tecnologias e bibliotecas utilizadas

html/css \
typescript \
vite \
bootstrap \
strapi \
SQLite \
node.js


