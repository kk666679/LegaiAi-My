declare module 'react-day-picker';
declare module 'recharts';
declare module '@base-ui/react';
declare module 'radix-ui';
declare module '@wrksz/themes' {
  export function useTheme(): { theme: string; setTheme: (theme: string) => void };
}

declare module 'ai' {
  export function streamText(options: any): any;
  export function generateText(options: any): Promise<any>;
  export function embed(options: any): Promise<any>;
  export function embedMany(options: any): Promise<any>;
  export function generateObject(options: any): Promise<any>;
  export function streamObject(options: any): any;
  export type CoreMessage = any;
  export type Message = any;
  export type LanguageModelUsage = any;
  export type Tool = any;
}

declare module '@ai-sdk/openai' {
  export function createOpenAI(options?: any): any;
  export const openai: any;
}

declare module '@trpc/react-query' {
  export const createTRPCReact: any;
  export const createTRPCQueryUtils: any;
}

declare module '@xyflow/react' {
  const _default: any;
  export = _default;
}

declare module 'react-hook-form' {
  export function useForm(options?: any): any;
  export function useController(props: any): any;
  export function useWatch(props?: any): any;
  export function Controller(props: any): any;
  export const FormProvider: any;
  export type FieldValues = any;
  export type FieldErrors<T = any> = any;
  export type Resolver<T = any> = any;
  export type UseFormReturn<T = any> = any;
}

declare module 'shiki' {
  export function codeToHtml(options: any): Promise<string>;
  export function codeToTokens(options: any): Promise<any>;
  export function getHighlighter(options: any): Promise<any>;
  export const bundledLanguages: any;
  export const bundledThemes: any;
}

declare module 'tailwind-merge' {
  export function twMerge(...inputs: string[]): string;
  export const twJoin: (...inputs: string[]) => string;
}