"use client";

import { Button } from "@/components/ui/button";
import { Lightbulb, Wand2, Edit, Palette } from "lucide-react";

interface ExamplePromptsProps {
  onSelectPrompt: (prompt: string) => void;
  mode: 'create' | 'edit';
}

export function ExamplePrompts({ onSelectPrompt, mode }: ExamplePromptsProps) {
  const createExamples = [
    {
      icon: <Palette className="h-4 w-4" />,
      title: "Arte Digital",
      prompt: "Um dragão cyberpunk voando sobre uma cidade neon futurística, arte digital detalhada, cores vibrantes"
    },
    {
      icon: <Wand2 className="h-4 w-4" />,
      title: "Fotorrealista",
      prompt: "Retrato profissional de uma pessoa sorrindo, iluminação suave de estúdio, alta resolução, fotorrealista"
    },
    {
      icon: <Lightbulb className="h-4 w-4" />,
      title: "Conceitual",
      prompt: "Paisagem minimalista com montanhas ao pôr do sol, estilo artístico abstrato, cores pastel"
    }
  ];

  const editExamples = [
    {
      icon: <Edit className="h-4 w-4" />,
      title: "Remover Fundo",
      prompt: "Remover completamente o fundo da imagem"
    },
    {
      icon: <Palette className="h-4 w-4" />,
      title: "Mudar Cores",
      prompt: "Mudar todas as cores azuis para dourado"
    },
    {
      icon: <Wand2 className="h-4 w-4" />,
      title: "Adicionar Elementos",
      prompt: "Adicionar flores coloridas ao redor"
    }
  ];

  const examples = mode === 'create' ? createExamples : editExamples;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Lightbulb className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium">
          {mode === 'create' ? 'Exemplos de Criação:' : 'Exemplos de Edição:'}
        </span>
      </div>
      
      <div className="grid gap-2">
        {examples.map((example, index) => (
          <Button
            key={index}
            variant="ghost"
            className="justify-start h-auto p-3 text-left"
            onClick={() => onSelectPrompt(example.prompt)}
          >
            <div className="flex items-start gap-3 w-full">
              <div className="text-primary mt-0.5">
                {example.icon}
              </div>
              <div className="space-y-1 flex-1">
                <div className="font-medium text-sm">{example.title}</div>
                <div className="text-xs text-muted-foreground line-clamp-2">
                  {example.prompt}
                </div>
              </div>
            </div>
          </Button>
        ))}
      </div>
    </div>
  );
}
