## Packages
framer-motion | For smooth page transitions and micro-interactions
wavesurfer.js | For the audio waveform visualization
clsx | Utility for constructing className strings conditionally
tailwind-merge | Utility for merging Tailwind CSS classes

## Notes
Tailwind Config - extend fontFamily:
fontFamily: {
  sans: ["'DM Sans'", "sans-serif"],
  display: ["'Space Grotesk'", "sans-serif"],
  mono: ["'Fira Code'", "monospace"],
}

Integration assumptions:
- Audio uploads via FormData
- Polling required for project status updates (every 2s)
