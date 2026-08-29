// components/landing/HeroDemo.tsx
import { GlassPanel } from "@/components/legalai/GlassPanel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LegalTimeline from "@/components/legalai/LegalTimeline/LegalTimeline";
import { AIWidget } from "@/components/ai/aiwidget";

export function HeroDemo() {
  return (
    <div className="w-full max-w-5xl mx-auto -mt-20 pb-24 px-4">
      <GlassPanel className="p-1">
        <Tabs defaultValue="timeline" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-transparent border-b border-white/10">
            <TabsTrigger value="timeline">Legal Timeline</TabsTrigger>
            <TabsTrigger value="chat">AI Assistant</TabsTrigger>
            <TabsTrigger value="drafting">Document Drafting</TabsTrigger>
          </TabsList>
          <TabsContent value="timeline" className="p-4">
            <LegalTimeline />
          </TabsContent>
          <TabsContent value="chat" className="p-4 min-h-[400px]">
            <AIWidget title="Legal Assistant">Legal Assistant</AIWidget>
          </TabsContent>
          <TabsContent value="drafting" className="p-4 min-h-[400px]">
            <p className="text-muted-foreground">Coming soon...</p>
          </TabsContent>
        </Tabs>
      </GlassPanel>
    </div>
  );
}