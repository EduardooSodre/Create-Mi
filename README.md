# 🎨 AI Image Creator

Uma aplicação Next.js com design futurístico que integra com a OpenAI para criar imagens incríveis usando inteligência artificial.

## ✨ Características

- **Chat Interface Futurística**: Interface de chat moderna com temas roxos e efeitos neon
- **Integração OpenAI DALL-E**: Geração de imagens com DALL-E 3 e edição com DALL-E 2
- **Dois Modos de Operação**:
  - 🎨 **Criar**: Gere imagens do zero a partir de descrições
  - ✏️ **Editar**: Faça upload e edite imagens existentes
- **Upload de Imagens**: Drag & drop para envio de imagens para edição
- **Prompts Aprimorados**: Sistema automático que melhora os prompts para resultados profissionais
- **Download Otimizado**: Baixe imagens em PNG diretamente na pasta Downloads
- **Persistência de Dados**: Conversas são salvas automaticamente no navegador
- **Gerenciamento de Sessões**: Botão para limpar conversas quando necessário
- **Exemplos Interativos**: Sugestões de prompts para inspiração
- **Design Responsivo**: Funciona perfeitamente em desktop e mobile
- **Componentes shadcn/ui**: Interface moderna e acessível

## 🚀 Tecnologias Utilizadas

- **Next.js 15** - Framework React
- **TypeScript** - Tipagem estática
- **Tailwind CSS 4** - Estilização moderna
- **shadcn/ui** - Componentes UI
- **OpenAI API** - Geração de imagens
- **Lucide React** - Ícones modernos

## 📋 Pré-requisitos

- Node.js 18+
- Chave da API OpenAI
- npm ou yarn

## 🔧 Instalação

1. **Clone o repositório:**
```bash
git clone <url-do-repositorio>
cd create-mi
```

2. **Instale as dependências:**
```bash
npm install
```

3. **Configure as variáveis de ambiente:**
```bash
cp .env.example .env.local
```

Edite o arquivo `.env.local` e adicione sua chave da OpenAI:
```env
OPENAI_API_KEY=sk-your-openai-api-key-here
```

4. **Execute o projeto:**
```bash
npm run dev
```

5. **Acesse no navegador:**
```
http://localhost:3000
```

## 🎯 Como Usar

### 🎨 Modo Criar (Padrão)
1. **Abra a aplicação** no seu navegador
2. **Digite uma descrição** da imagem que você quer criar
3. **Aguarde a IA** processar e gerar sua imagem
4. **Visualize o resultado** e clique em "Baixar" se desejar salvar

### ✏️ Modo Editar
1. **Clique no botão "Editar"** no topo da interface
2. **Faça upload de uma imagem** (drag & drop ou clique para selecionar)
3. **Descreva as alterações** que você quer fazer
4. **Aguarde a IA** processar e aplicar as edições
5. **Compare com o original** e baixe se desejar

### 💡 Dicas para Melhores Resultados

#### Para Criação de Imagens:
- Seja específico sobre estilo, cores e composição
- Mencione detalhes como iluminação e ambiente  
- Use termos como "fotorrealista", "artístico", "minimalista"
- Exemplos:
  - "Um dragão cyberpunk voando sobre uma cidade neon futurística, arte digital detalhada"
  - "Paisagem minimalista com montanhas ao pôr do sol, estilo artístico abstrato"
  - "Retrato fotorrealista de uma pessoa sorrindo, iluminação profissional"

#### Para Edição de Imagens:
- Use imagens PNG com fundo transparente para melhores resultados
- Seja específico sobre o que quer alterar
- Exemplos:
  - "Remover completamente o fundo"
  - "Mudar todas as cores azuis para dourado"
  - "Adicionar flores coloridas ao redor da pessoa"
  - "Tornar a imagem mais brilhante e contrastada"

## 🎨 Personalização do Design

A aplicação usa um esquema de cores futurístico com:

- **Cores primárias**: Roxo (#8b5cf6) e Azul (#3b82f6)
- **Modo escuro/claro**: Automático baseado na preferência do sistema
- **Efeitos especiais**: Bordas neon, gradientes e animações

### Classes Utilitárias Disponíveis:

```css
.gradient-primary    /* Gradiente roxo/azul */
.gradient-text      /* Texto com gradiente */
.neon-glow         /* Efeito brilho neon */
.neon-border       /* Bordas com efeito neon */
.pulse-neon        /* Animação pulsante */
```

## 📁 Estrutura do Projeto

```
src/
├── app/
│   ├── api/
│   │   ├── generate-image/route.ts       # API para geração de imagens
│   │   └── edit-image/route.ts           # API para edição de imagens
│   ├── globals.css                       # Estilos globais
│   ├── layout.tsx                        # Layout principal
│   └── page.tsx                          # Página inicial
├── components/
│   ├── chat/
│   │   ├── AIImageChat.tsx               # Componente principal do chat
│   │   ├── ChatMessage.tsx               # Componente de mensagem
│   │   ├── ImageUpload.tsx               # Componente de upload
│   │   └── ExamplePrompts.tsx            # Exemplos de prompts
│   └── ui/                               # Componentes shadcn/ui
└── lib/
    ├── openai.ts                         # Utilitários OpenAI
    └── utils.ts                          # Utilitários gerais
```

## 🔑 Configuração da OpenAI

1. Acesse [platform.openai.com](https://platform.openai.com)
2. Crie uma conta ou faça login
3. Vá para "API Keys"
4. Gere uma nova chave
5. Adicione créditos à sua conta
6. Use a chave no arquivo `.env.local`

## 🐛 Solução de Problemas

### Erro: "API key not found"
- Verifique se o arquivo `.env.local` existe
- Confirme se a variável `OPENAI_API_KEY` está definida
- Reinicie o servidor após adicionar a chave

### Erro: "Insufficient quota"
- Verifique se você tem créditos na sua conta OpenAI
- Adicione um método de pagamento válido

### Erro: "Formato de imagem inválido"
- Use imagens PNG para edição (especialmente com fundo transparente)
- Verifique se o arquivo não está corrompido
- Tente redimensionar a imagem para menos de 4MB

### Upload não funciona
- Verifique se o arquivo é uma imagem válida (PNG, JPG, WEBP)
- Confirme se o tamanho é menor que 4MB
- Tente usar formato PNG para melhores resultados de edição

## 📝 Licença

Este projeto é licenciado sob a licença MIT.

## 🤝 Contribuição

Contribuições são bem-vindas! Sinta-se à vontade para abrir issues ou pull requests.

---

Feito com ❤️ para criar arte digital excepcional!
