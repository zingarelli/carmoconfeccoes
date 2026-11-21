![Logo do site da loja Carmo Calçados e Confecções](https://user-images.githubusercontent.com/19349339/205375794-d6e704f5-1c27-425b-a25b-bdae4fd56fd9.png)

# Carmo Calçados e Confecções

Site criado para divulgar a loja de confecção infantil da minha mãe, localizada em Araraquara/SP.

O site já existia, porém, eu o refiz para ficar adaptável a diferentes telas e também deixando o HTML mais semântico, tudo concentrado em uma única página. 

Adicionei uma galeria de fotos utilizando o [SwiperJS](swiperjs.com). 

## GIF do site atualizado
![gif do site na versão para celular](https://user-images.githubusercontent.com/19349339/206710165-64fc6b54-c88b-4933-84c2-ec91b90d1295.gif)

## Screenshots do site antigo

### Página inicial 

![página inicial da versão antiga do site](https://user-images.githubusercontent.com/19349339/206710839-af26ab55-28fd-4aa2-be30-74805beb76e6.png)

### Produtos

![página de produtos da versão antiga do site](https://user-images.githubusercontent.com/19349339/206710934-4bd1f942-3e67-4fb9-bb6a-dc1e314d163a.png)

### Contato

![página de contato da versão antiga do site](https://user-images.githubusercontent.com/19349339/206711195-06997632-5ba5-4118-8709-e43298b757e7.png)

### Fotos

![página de fotos da versão antiga do site](https://user-images.githubusercontent.com/19349339/206711449-8e85de83-04c0-45fd-bb39-7f625acc22b8.png)

## Layout mobile-first

Página única em HTML/CSS/JavaScript, sem instalação de dependências ou etapa de build.

```sh
python3 -m http.server 8000
```

Abra `http://localhost:8000`. Use um servidor HTTP para testar o cache do Instagram; abrir o arquivo por `file://` não permite o `fetch`.

- Grade 2 × 2 de Batizado, Primeira Comunhão, Festas e Times, sem links nos cards.
- Rosa e azul, logo com os três Cs na diagonal e contato pelo WhatsApp.
- SEO local, dados estruturados `ClothingStore`, metadados sociais, canonical, sitemap e robots.
- O domínio canônico foi mantido como `https://carmoconfeccoes.com.br/`. Confirme o host preferido na publicação e redirecione a variante com/sem `www` para ele.
- As imagens em `imagens/vitrine/` foram extraídas da proposta visual aprovada e otimizadas em WebP. São pequenas prévias; para maior nitidez em telas de alta densidade, substitua por exportações individuais de maior resolução mantendo a composição e os modelos aprovados.
- Fotos antigas e Swiper foram preservados no repositório, mas não são mais carregados pela página.

## Última publicação do Instagram

O site aponta para **[@carmo.confeccoes](https://www.instagram.com/carmo.confeccoes/)**. Sem um cache válido, a seção mostra somente o convite ao perfil. Não há publicação ou legenda fictícia apresentada como recente.

`scripts/sync-instagram.mjs` consulta a API oficial e grava somente informações públicas em `data/instagram.json`, junto da imagem local em `imagens/instagram/latest.*`. Fotos, carrosséis (primeiro item) e Reels (miniatura) são suportados. Falhas de autenticação ou download preservam o cache anterior. Tokens nunca são enviados ao navegador, incluídos no JSON ou registrados em logs.

### Ativação

1. A conta precisa ser profissional (Business ou Creator). No painel da Meta, autorize a conta da loja para um app com Instagram Login e permissão `instagram_business_basic`.
2. Configure os **Actions secrets** `INSTAGRAM_ACCESS_TOKEN` e `INSTAGRAM_USER_ID`. O ID é numérico; não é o @. Não coloque essas informações em arquivos ou commits.
3. Opcionalmente, configure as **Actions variables** `INSTAGRAM_API_VERSION` (padrão `v27.0`) e `INSTAGRAM_API_HOST` (padrão `graph.instagram.com`). Para um app com Facebook Login, use `graph.facebook.com` e as permissões correspondentes. A legenda é consultada apenas nesse modo, conforme a documentação da Meta; no Instagram Login o cartão usa um texto neutro.
4. Ative a variable `INSTAGRAM_SYNC_ENABLED=true`. O workflow pode ser executado manualmente na branch ou, depois do merge, a cada seis horas na branch padrão. Ele cria um commit somente quando o cache muda. Sem essa variable, o job não roda.
5. Publique o cache com o restante do site. A atualização do repositório **não é um deploy**: o provedor precisa reconstruir/publicar as alterações. Em GitHub Pages, commits feitos com `GITHUB_TOKEN` não iniciam automaticamente um build por branch; configure um workflow de publicação Pages caso esse seja o host. Este PR não altera o provedor nem publica o site.

Tokens da Meta têm validade e podem exigir renovação; acompanhe as falhas do workflow e renove o secret antes de expirar. As restrições da branch também precisam permitir os commits do bot, ou o cache deve ser atualizado por PR. O cron do GitHub pode atrasar ou ser desativado por inatividade em repositórios públicos.

Também é possível executar manualmente com Node 22+, carregando as credenciais em variáveis de ambiente:

```sh
node scripts/sync-instagram.mjs
```

Referências oficiais: [início com Instagram Login](https://developers.facebook.com/documentation/instagram-platform/instagram-api-with-instagram-login/get-started), [campos de mídia](https://developers.facebook.com/documentation/instagram-platform/reference/instagram-media).

### Verificação

```sh
node --test tests/instagram.test.mjs
```

Os testes verificam seleção por data, miniaturas, URLs, proteção do token e preservação do cache em caso de falha. Valide também o layout no navegador, inclusive a 320px e com zoom de 200%, antes de publicar.
