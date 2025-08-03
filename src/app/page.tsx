import { AIImageChat } from "@/components/chat/AIImageChat";

const HomePage = () => {
  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        {/* <header className="text-center space-y-4 py-8">
          <h1 className="text-4xl md:text-6xl font-bold gradient-text">
            AI Image Creator
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Crie imagens incríveis com inteligência artificial. 
            Descreva sua visão e transforme suas ideias em arte digital profissional.
          </p>
        </header> */}

        {/* Chat Interface */}
        <div className="max-w-4xl mx-auto">
          <AIImageChat />
        </div>

        {/* Footer Info */}
        {/* <footer className="text-center text-sm text-muted-foreground py-8">
          <p>
            Powered by OpenAI DALL-E 3 • Feito com ❤️ para criar arte digital excepcional
          </p>
        </footer> */}
      </div>
    </div>
  );
}

export default HomePage;