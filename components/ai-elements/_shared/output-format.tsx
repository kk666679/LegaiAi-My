"use client";

import type { ReactNode } from "react";
import { CodeBlock } from "../code-block";

export type OutputRenderable =
  | string
  | object
  | ReactNode
  | null
  | undefined;

export function renderOutputToNode(output: OutputRenderable, language: any = "json") {
  if (output === null || output === undefined) return null;

  // React elements (or any valid ReactNode) should be rendered directly.
  // We keep this check intentionally permissive to avoid pulling in react-is.
  if (typeof output !== "string" && typeof output !== "object") {
    return output as unknown as ReactNode;
  }

  if (typeof output === "string") {
    return <CodeBlock code={output} language={language} />;
  }

  // Objects: render as JSON.
  try {
    return <CodeBlock code={JSON.stringify(output, null, 2)} language={language} />;
  } catch {
    return <CodeBlock code={String(output)} language={language} />;
  }
}

