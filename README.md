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

Abra `http://localhost:8000`.

- Um card por linha no celular (abaixo de 640 px) e duas colunas nas telas maiores, com Saída de Maternidade, Batizado, Primeira Comunhão, Festas, Times e Acessórios, sem links nos cards.
- Rosa e azul, logo com os três Cs na diagonal e contato pelo WhatsApp.
- SEO local, dados estruturados `ClothingStore`, metadados sociais, canonical, sitemap e robots.
- O domínio canônico foi mantido como `https://carmoconfeccoes.com.br/`. Confirme o host preferido na publicação e redirecione a variante com/sem `www` para ele.
- As seis imagens em `imagens/vitrine/` são composições individuais aprovadas, em **1536 × 1024 px (3:2)**, com variantes WebP de **480 e 960 px**. A grade preserva a mesma proporção em todas as telas, sem cortar as roupas. A hero usa `<picture>` com composições próprias: desktop panorâmica em 1980 × 792 (5:2) e mobile em 1448 × 1086 (4:3), com a planta, os sapatinhos e o vestido visíveis. `srcset` e `sizes` permitem selecionar a resolução adequada.
- Fotos antigas e Swiper foram preservados no repositório, mas não são mais carregados pela página.

## Instagram

A seção divulga **[@carmo.confeccoes](https://www.instagram.com/carmo.confeccoes/)** com um convite e um botão para abrir o perfil. É estática, sem API, cache, autorização da conta ou sincronização automática.

## Atualizar as imagens aprovadas

O script opcional `scripts/prepare-images.py` converte as artes para WebP e gera as variantes, sem cortar ou ampliar fontes pequenas. Ele exige Pillow apenas na máquina de preparação. Nenhum processamento de imagens roda no servidor de produção.

```sh
python3 scripts/prepare-images.py \
  --batizado /caminho/batizado.png \
  --primeira-comunhao /caminho/primeira-comunhao.png \
  --festas /caminho/festas.png \
  --times /caminho/times.png \
  --hero /caminho/hero-desktop.png \
  --hero-mobile /caminho/hero-mobile.png
```

As quatro artes das categorias devem ter proporção 3:2 e pelo menos 1536 × 1024 px. A hero desktop deve ser panorâmica, em 1980 × 792 px (5:2), com a metade esquerda livre para o texto. No desktop (a partir de 960 px), ela ocupa o fundo inteiro da seção, com o texto sobreposto, sem painel nem máscara de bordas. A hero mobile deve ter proporção 4:3 e pelo menos 1448 × 1086 px. O script rejeita dimensões incompatíveis para evitar recortes acidentais.

Composições: Batizado com vestido e tercinho; Primeira Comunhão com camisa branca e calça preta ao lado do vestido; Festas com vestido rosa e conjunto bege/gravata vinho; Times na ordem Corinthians, Palmeiras, São Paulo e Santos, conforme as fotos de produto aprovadas. Os detalhes muito pequenos dos escudos continuam sujeitos às limitações da imagem gerada.

## Alternância suave da hero

A hero alterna entre a composição rosa e a azul a cada **6 segundos**, com dissolução de **1,8 segundo**. Texto e CTA ficam fixos. Ambas têm artes próprias para desktop e mobile, com alturas estáveis. Os controles discretos no centro inferior da seção têm duas bolinhas para selecionar as imagens e um terceiro botão circular com ícone de pausa/reprodução. A imagem ativa é indicada pelo preenchimento da bolinha; os botões têm área de toque de 44 px e rótulos acessíveis.

O controlador só começa depois que as imagens carregam, para evitar quadros vazios. A aba oculta suspende o temporizador, e uma pausa manual é preservada ao retornar. Com `prefers-reduced-motion: reduce`, a hero permanece estática e o botão de pausa é ocultado; a seleção manual das imagens continua disponível. Sem JavaScript, a primeira composição continua visível.

Para exportar a versão azul, o script aceita também `--hero-menino` (1980 × 792) e `--hero-menino-mobile` (1448 × 1086). Para testar o controlador, execute `node --test tests/hero.test.mjs`.

Na hero, deslize horizontalmente para avançar ou voltar. Gestos verticais mantêm a rolagem normal. Cada seleção manual reinicia o intervalo, sem desfazer uma pausa manual.
