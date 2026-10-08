"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  FileText,
  Users,
  Gavel,
  Plus,
  X,
  AlertTriangle,
} from "lucide-react";
import type { DraftRequest } from "@/lib/lawmate/draft/types";

const documentTypes = [
  { value: "WRIT", label: "Writ of Summons" },
  { value: "AFFIDAVIT", label: "Affidavit" },
  { value: "SUBMISSION", label: "Written Submission" },
  { value: "COMPLAINT", label: "Civil Complaint" },
] as const;

const toneOptions = [
  { value: "neutral", label: "Neutral" },
  { value: "adversarial", label: "Adversarial" },
  { value: "persuasive", label: "Persuasive" },
] as const;

const formatOptions = [
  { value: "markdown", label: "Markdown" },
  { value: "docx", label: "Word Document (.docx)" },
  { value: "pdf", label: "PDF" },
] as const;

const formSchema = z.object({
  docType: z.enum(["WRIT", "AFFIDAVIT", "SUBMISSION", "COMPLAINT"]),
  parties: z.object({
    plaintiff: z.string().min(1, "Plaintiff name is required"),
    defendant: z.string().min(1, "Defendant name is required"),
    court: z.string().min(1, "Court name is required"),
    caseNumber: z.string().optional(),
  }),
  facts: z.string().min(50, "Please provide at least 50 characters of material facts"),
  reliefSought: z.string().optional(),
  tone: z.enum(["neutral", "adversarial", "persuasive"]).default("neutral"),
  format: z.enum(["markdown", "docx", "pdf"]).default("markdown"),
}).refine((data) => data.facts.length >= 50, {
  message: "Facts must be at least 50 characters",
  path: ["facts"],
});

type FormData = z.infer<typeof formSchema>;

interface DraftFormProps {
  initialData?: Partial<DraftRequest>;
  onSubmit: (data: DraftRequest) => void;
  onCitationsChange: (citations: string[]) => void;
}

export function DraftForm({ initialData = {}, onSubmit, onCitationsChange }: DraftFormProps) {
  const [citations, setCitations] = useState<string[]>([]);
  const [citationInput, setCitationInput] = useState("");
  const [citationError, setCitationError] = useState("");

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      docType: (initialData.docType as any) || "WRIT",
      tone: (initialData.tone as any) || "neutral",
      format: (initialData.format as any) || "markdown",
      parties: {
        plaintiff: "",
        defendant: "",
        court: "",
        caseNumber: "",
      },
      facts: "",
      reliefSought: "",
    },
  });

  const addCitation = () => {
    if (!citationInput.trim()) return;

    if (citations.includes(citationInput)) {
      setCitationError("Citation already added");
      return;
    }

    const newCitations = [...citations, citationInput];
    setCitations(newCitations);
    onCitationsChange(newCitations);
    setCitationInput("");
    setCitationError("");
  };

  const removeCitation = (index: number) => {
    const updated = citations.filter((_, i) => i !== index);
    setCitations(updated);
    onCitationsChange(updated);
  };

  const handleFormSubmit = form.handleSubmit((data: FormData) => {
    onSubmit({
      title: `${data.docType} — ${data.parties.plaintiff} v ${data.parties.defendant}`,
      ...data,
      citations,
    } as unknown as DraftRequest);
  });

  return (
    <Form {...form}>
      <form onSubmit={handleFormSubmit} className="space-y-6">
        {/* Document Type */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="size-4" />
              Document Type
            </CardTitle>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control as any}
              name="docType"
              render={({ field }) => (
                <FormItem>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select document type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {documentTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Parties */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="size-4" />
              Parties
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control as any}
              name="parties.plaintiff"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Plaintiff / Applicant</FormLabel>
                  <FormControl>
                    <Input placeholder="Full name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control as any}
              name="parties.defendant"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Defendant / Respondent</FormLabel>
                  <FormControl>
                    <Input placeholder="Full name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control as any}
              name="parties.court"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1">
                    <Gavel className="size-3" />
                    Court
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., High Court of Malaya at Kuala Lumpur"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control as any}
              name="parties.caseNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Case Number (optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Leave blank if not assigned" {...field} />
                  </FormControl>
                  <FormDescription>
                    If not yet assigned, leave blank
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Facts */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Material Facts</CardTitle>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control as any}
              name="facts"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea
                      placeholder="Summarise the material facts of the case..."
                      className="min-h-[150px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    {field.value?.length || 0} / 50 characters minimum
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Relief Sought */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Relief Sought (Optional)</CardTitle>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control as any}
              name="reliefSought"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea
                      placeholder="What the plaintiff is asking for..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Citations */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Legal Citations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <Input
                placeholder="Case Name [YYYY] N MLJ NNN"
                value={citationInput}
                onChange={(e) => setCitationInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCitation())}
                className={citationError ? "border-destructive" : ""}
              />
              <Button type="button" onClick={addCitation} size="sm">
                <Plus className="size-4" />
                Add
              </Button>
            </div>

            {citationError && (
              <Alert variant="destructive">
                <AlertTriangle className="size-4" />
                <AlertDescription>{citationError}</AlertDescription>
              </Alert>
            )}

            {citations.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {citations.map((citation, index) => (
                  <Badge key={index} variant="secondary" className="gap-1">
                    {citation}
                    <button
                      type="button"
                      onClick={() => removeCitation(index)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="size-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Options */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Document Options</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control as any}
              name="tone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tone</FormLabel>
                  <FormControl>
                    <div className="flex gap-4">
                      {toneOptions.map((option) => (
                        <label
                          key={option.value}
                          className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm cursor-pointer transition-colors ${
                            field.value === option.value
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border hover:bg-muted/50"
                          }`}
                        >
                          <input
                            type="radio"
                            className="sr-only"
                            name="tone"
                            value={option.value}
                            checked={field.value === option.value}
                            onChange={() => field.onChange(option.value)}
                          />
                          {option.label}
                        </label>
                      ))}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control as any}
              name="format"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Format</FormLabel>
                  <FormControl>
                    <div className="flex gap-4">
                      {formatOptions.map((option) => (
                        <label
                          key={option.value}
                          className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm cursor-pointer transition-colors ${
                            field.value === option.value
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border hover:bg-muted/50"
                          }`}
                        >
                          <input
                            type="radio"
                            className="sr-only"
                            name="format"
                            value={option.value}
                            checked={field.value === option.value}
                            onChange={() => field.onChange(option.value)}
                          />
                          {option.label}
                        </label>
                      ))}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Ethics Notice */}
        <Alert>
          <AlertTriangle className="size-4" />
          <AlertDescription>
            ⚠️ AI-generated documents require review and signature by a qualified
            Malaysian lawyer before use in any legal proceeding.
          </AlertDescription>
        </Alert>

        {/* Submit */}
        <Button type="submit" className="w-full">
          Generate Draft
        </Button>
      </form>
    </Form>
  );
}
