"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Bell,
  Plus,
  X,
  CheckCircle,
  AlertTriangle,
  Loader2,
  BookOpen,
  Scale,
  Building,
  Users,
  Shield,
  TrendingUp,
  FileText,
  Globe,
  Clock
} from "lucide-react";
import { ChainOfThought, ChainOfThoughtContent, ChainOfThoughtHeader, ChainOfThoughtStep } from "@/components/ai-elements/chain-of-thought";

const LEGAL_TOPICS = [
  { id: "judicial_review", label: "Judicial Review", icon: Scale },
  { id: "employment_law", label: "Employment Law", icon: Users },
  { id: "land_acquisition", label: "Land Acquisition", icon: Building },
  { id: "constitutional_law", label: "Constitutional Law", icon: Shield },
  { id: "commercial_law", label: "Commercial Law", icon: TrendingUp },
  { id: "criminal_law", label: "Criminal Law", icon: Scale },
  { id: "family_law", label: "Family Law", icon: Users },
  { id: "intellectual_property", label: "Intellectual Property", icon: FileText },
  { id: "international_law", label: "International Law", icon: Globe },
  { id: "tax_law", label: "Tax Law", icon: BookOpen },
  { id: "corporate_law", label: "Corporate Law", icon: Building },
  { id: "human_rights", label: "Human Rights", icon: Shield },
  { id: "environmental_law", label: "Environmental Law", icon: Globe },
  { id: "banking_finance", label: "Banking & Finance", icon: TrendingUp },
  { id: "insolvency", label: "Insolvency", icon: AlertTriangle },
];

interface SubscriptionManagerProps {
  userId: string;
  onActionChange?: (action: string) => void;
}

export function SubscriptionManager({ userId, onActionChange }: SubscriptionManagerProps) {
  const [subscriptions, setSubscriptions] = useState<string[]>([]);
  const [availableTopics] = useState(LEGAL_TOPICS);
  const [isLoading, setIsLoading] = useState(false);
  const [newTopicDialogOpen, setNewTopicDialogOpen] = useState(false);
  const [customTopic, setCustomTopic] = useState("");
  const [notificationPrefs, setNotificationPrefs] = useState({
    email: true,
    telegram: false,
    inApp: true,
  });
  const [workflowSteps, setWorkflowSteps] = useState<Array<{
    tool: string;
    status: "complete" | "active" | "pending";
    description: string;
  }>>([]);

  useEffect(() => {
    onActionChange?.("subscribe");
    loadSubscriptions();
  }, []);

  const loadSubscriptions = async () => {
    setIsLoading(true);
    setWorkflowSteps([
      { tool: "legal_monitor", status: "active", description: "Fetching subscriptions from Redis..." },
    ]);

    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setSubscriptions(["judicial_review", "employment_law", "land_acquisition"]);
    
    setWorkflowSteps([
      { tool: "legal_monitor", status: "complete" as const, description: "Subscriptions loaded" },
    ]);
    setIsLoading(false);
  };

  const handleSubscribe = async (topicId: string) => {
    if (subscriptions.includes(topicId)) return;

    setIsLoading(true);
    setWorkflowSteps([
      { tool: "legal_monitor", status: "active" as const, description: `Subscribing to ${topicId}...` },
    ]);

    await new Promise(resolve => setTimeout(resolve, 800));

    setSubscriptions([...subscriptions, topicId]);
    
    setWorkflowSteps([
      { tool: "legal_monitor", status: "complete" as const, description: "Subscription active" },
    ]);
    setIsLoading(false);
  };

  const handleUnsubscribe = async (topicId: string) => {
    setIsLoading(true);
    setWorkflowSteps([
      { tool: "legal_monitor", status: "active" as const, description: `Removing subscription to ${topicId}...` },
    ]);

    await new Promise(resolve => setTimeout(resolve, 500));

    setSubscriptions(subscriptions.filter(t => t !== topicId));
    
    setWorkflowSteps([
      { tool: "legal_monitor", status: "complete" as const, description: "Subscription removed" },
    ]);
    setIsLoading(false);
  };

  const handleAddCustomTopic = () => {
    if (!customTopic.trim()) return;
    const topicId = customTopic.toLowerCase().replace(/\\s+/g, "_");
    handleSubscribe(topicId);
    setCustomTopic("");
    setNewTopicDialogOpen(false);
  };

  const getTopicIcon = (topicId: string) => {
    const topic = LEGAL_TOPICS.find(t => t.id === topicId);
    return topic?.icon || BookOpen;
  };

  const getTopicLabel = (topicId: string) => {
    const topic = LEGAL_TOPICS.find(t => t.id === topicId);
    return topic?.label || topicId.replace(/_/g, " ").replace(/\\b\\w/g, l => l.toUpperCase());
  };

  return (
    <div className="space-y-4">
      {workflowSteps.length > 0 && (
        <ChainOfThought defaultOpen={isLoading}>
          <ChainOfThoughtHeader>Subscription Process</ChainOfThoughtHeader>
          <ChainOfThoughtContent>
            {workflowSteps.map((step, index) => (
              <ChainOfThoughtStep
                key={index}
                label={step.tool}
                description={step.description}
                status={step.status}
              />
            ))}
          </ChainOfThoughtContent>
        </ChainOfThought>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Bell className="size-4" />
              Your Subscriptions
            </span>
            <Badge variant="outline" className="font-mono">
              User ID: {userId.slice(0, 8)}...
            </Badge>
          </CardTitle>
          <CardDescription>
            Receive alerts when new cases or decisions match your subscribed topics
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Active Topics ({subscriptions.length})</Label>
            {subscriptions.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <Bell className="size-8 mx-auto mb-2 opacity-50" />
                <p>No subscriptions yet</p>
                <p className="text-sm">Subscribe to topics to receive alerts</p>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {subscriptions.map((topicId) => {
                  const Icon = getTopicIcon(topicId);
                  return (
                    <Badge 
                      key={topicId} 
                      variant="secondary"
                      className="gap-2 px-3 py-1.5"
                    >
                      <Icon className="size-3" />
                      {getTopicLabel(topicId)}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-auto p-1"
                        onClick={() => handleUnsubscribe(topicId)}
                      >
                        <X className="size-3" />
                      </Button>
                    </Badge>
                  );
                })}
              </div>
            )}
          </div>

          <Separator />

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Available Topics</Label>
              <Dialog open={newTopicDialogOpen} onOpenChange={setNewTopicDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Plus className="size-3 mr-1" />
                    Custom Topic
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Custom Topic</DialogTitle>
                    <DialogDescription>
                      Enter a custom legal topic you'd like to monitor
                    </DialogDescription>
                  </DialogHeader>
                  <Input
                    placeholder="e.g., Sports Law, Aviation Law..."
                    value={customTopic}
                    onChange={(e) => setCustomTopic(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddCustomTopic()}
                  />
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setNewTopicDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleAddCustomTopic}>
                      Add Topic
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
            
            <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto p-1">
              {availableTopics
                .filter(topic => !subscriptions.includes(topic.id))
                .map((topic) => {
                  const Icon = topic.icon;
                  return (
                    <Button
                      key={topic.id}
                      variant="outline"
                      size="sm"
                      className="justify-start gap-2 h-auto py-2"
                      onClick={() => handleSubscribe(topic.id)}
                      disabled={isLoading}
                    >
                      <Icon className="size-3 flex-shrink-0" />
                      <span className="truncate">{topic.label}</span>
                    </Button>
                  );
                })}
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label>Notification Channels</Label>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="size-4 text-muted-foreground" />
                  <span>In-App Notifications</span>
                </div>
                <Switch
                  checked={notificationPrefs.inApp}
                  onCheckedChange={(checked) => setNotificationPrefs({ ...notificationPrefs, inApp: checked as boolean })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <svg className="size-4 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="4" width="20" height="16" rx="2" />
                    <path d="M22 7L12 13L2 7" />
                  </svg>
                  <span>Email</span>
                </div>
                <Switch
                  checked={notificationPrefs.email}
                  onCheckedChange={(checked) => setNotificationPrefs({ ...notificationPrefs, email: checked as boolean })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <svg className="size-4 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
                  </svg>
                  <span>Telegram</span>
                </div>
                <Switch
                  checked={notificationPrefs.telegram}
                  onCheckedChange={(checked) => setNotificationPrefs({ ...notificationPrefs, telegram: checked as boolean })}
                />
              </div>
            </div>
            {(notificationPrefs.email || notificationPrefs.telegram) && (
              <Alert className="mt-2">
                <AlertTriangle className="size-4" />
                <AlertDescription className="text-xs">
                  Email/Telegram delivery requires channel configuration. 
                  Contact administrator to set up external notifications.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>

      {subscriptions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Subscription Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-muted-foreground">Active Topics</div>
                <div className="text-2xl font-bold">{subscriptions.length}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Last Alert</div>
                <div className="flex items-center gap-1">
                  <Clock className="size-3 text-muted-foreground" />
                  <span>2 hours ago</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

