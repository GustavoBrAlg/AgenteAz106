# AgenteAz106 🤖

Assistente inteligente powered by **Azure AI**, com interface web moderna e deploy via Vercel.

![Azure](https://img.shields.io/badge/Azure_AI-0078D4?style=for-the-badge&logo=microsoft-azure&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)

## ✨ Funcionalidades

- 💬 **Chat interativo** com interface moderna e responsiva
- ⚡ **Respostas instantâneas** powered by Azure AI
- 🎨 **Design premium** com tema escuro e animações suaves
- 📱 **Totalmente responsivo** — funciona em desktop, tablet e mobile
- 🔒 **Seguro e confiável** com infraestrutura Azure

## 🚀 Deploy

Este projeto está configurado para deploy automático no **Vercel**:

1. Conecte o repositório no [Vercel](https://vercel.com)
2. O Vercel detectará automaticamente o diretório `public/` como output
3. Deploy será feito automaticamente a cada push

## 🛠️ Desenvolvimento Local

```bash
# Clone o repositório
git clone https://github.com/GustavoBrAlg/AgenteAz106.git
cd AgenteAz106

# Instale as dependências (opcional, para o servidor local)
npm install

# Inicie o servidor de desenvolvimento
npm run dev
```

## 📁 Estrutura do Projeto

```
AgenteAz106/
├── public/
│   ├── index.html    # Página principal
│   ├── style.css     # Estilos e design system
│   └── script.js     # Lógica do chat
├── package.json      # Configuração do projeto
├── vercel.json       # Configuração do Vercel
└── README.md         # Documentação
```

## 🔧 Configuração do Azure AI

Para conectar o agente do Azure, configure as seguintes variáveis de ambiente no Vercel:

| Variável | Descrição |
|----------|-----------|
| `AZURE_ENDPOINT` | URL do endpoint do Azure AI |
| `AZURE_API_KEY` | Chave de API do Azure |
| `AZURE_DEPLOYMENT` | Nome do deployment do modelo |

## 📄 Licença

MIT © [GustavoBrAlg](https://github.com/GustavoBrAlg)
