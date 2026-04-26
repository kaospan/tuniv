export type PromptPreset = {
  id: string;
  label: string;
  description: string;
  prompt: string;
};

export const PROMPT_PRESETS: PromptPreset[] = [
  {
    id: "none",
    label: "No preset",
    description: "Start from a blank visual prompt.",
    prompt: "",
  },
  {
    id: "cartoon-wall-character",
    label: "Cartoon Wall Character",
    description: "Keep your character visible as wall art in every scene.",
    prompt:
      "Create a full-length stylized cartoon music video. My character must appear as wall art in every scene: poster, mural, graffiti, painted portrait, neon sign illustration, framed cartoon print, or stencil on the wall. Keep the character visually consistent across all scenes. Bright cinematic cartoon look, clean outlines, expressive lighting, bold color design, dynamic camera moves, and strong scene variety. Every location must clearly include my character on a visible wall in the background or midground without disappearing from any shot.",
  },
];

export function getPromptPreset(presetId: string): PromptPreset {
  return PROMPT_PRESETS.find((preset) => preset.id === presetId) ?? PROMPT_PRESETS[0];
}

export function composePromptFromPreset(presetId: string, customPrompt: string): string {
  const preset = getPromptPreset(presetId);
  const extra = customPrompt.trim();

  if (!preset.prompt) {
    return extra;
  }
  if (!extra) {
    return preset.prompt;
  }

  return `${preset.prompt}\n\nAdditional direction: ${extra}`;
}
