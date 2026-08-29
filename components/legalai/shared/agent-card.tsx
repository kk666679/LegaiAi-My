"use client";

import { Agent, AgentHeader, AgentContent } from "@/components/ai-elements/agent";
import { ModelSelector, ModelSelectorTrigger, ModelSelectorContent } from "@/components/ai-elements/model-selector";
import { Badge } from "@/components/ui/badge";
import { Scale, Gavel, BookOpen } from "lucide-react";

interface AgentCardProps {
  name: string;
  model: string;
  jurisdiction: string;
  tools: string[];
}

export function AgentCard({ name, model, jurisdiction, tools }: AgentCardProps) {
  return (
    <Agent className="border-b rounded-none">
      <AgentHeader name={name} model={model}>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1">
            <Scale className="size-3" />
            {jurisdiction}
          </Badge>
          
          <ModelSelector>
            <ModelSelectorTrigger asChild>
              <Badge variant="secondary" className="cursor-pointer">
                切换模型
              </Badge>
            </ModelSelectorTrigger>
            <ModelSelectorContent>
              {/* 模型列表 */}
            </ModelSelectorContent>
          </ModelSelector>
        </div>
      </AgentHeader>
      
      <AgentContent>
        <div className="flex flex-wrap gap-1">
          {tools.map((tool) => (
            <Badge key={tool} variant="outline" className="text-xs">
              {tool.replace("legal_", "")}
            </Badge>
          ))}
        </div>
      </AgentContent>
    </Agent>
  );
}

