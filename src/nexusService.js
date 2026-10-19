/**
 * nexusService.js
 * ---------------
 * This is a LOCAL DEMO service — no real AI backend is connected.
 * All responses are generated locally to demonstrate the interface.
 *
 * To connect a real AI backend, replace the `processQuery` function
 * with a fetch() call to your API endpoint.
 */

// Simulated demo responses keyed loosely by topic
const DEMO_RESPONSES = [
  {
    keywords: ['hello', 'hi', 'hey', 'greetings'],
    response: `Hello. I'm NEXUS — an experimental intelligence interface designed for precise, thoughtful interaction.\n\nI'm currently operating in demo mode. My responses are curated examples that demonstrate the interface, not live AI generation.\n\nWhat would you like to explore?`,
  },
  {
    keywords: ['what', 'are', 'you', 'nexus', 'who'],
    response: `NEXUS is an experimental AI interface built for the future of human-machine collaboration.\n\nCurrently running in **local demo mode** — no external API is connected. The interface demonstrates:\n\n• Living orb state transitions (idle → loading → success/error)\n• Keyboard-accessible interaction patterns\n• Responsive layout across all screen sizes\n• Clean separation between UI and request logic\n\nA real AI backend can be integrated by replacing the mock service layer.`,
  },
  {
    keywords: ['design', 'ui', 'interface', 'visual', 'css', 'style'],
    response: `The NEXUS visual system is built on a small set of deliberate design tokens:\n\n**Color palette** — Near-black base (#080b14) with cyan, blue, and violet accents. Every color is chosen for contrast and harmony, not decoration.\n\n**Typography** — Space Grotesk for display text, Inter for body. Both loaded from Google Fonts for a premium feel without heavy dependencies.\n\n**The orb** — Built entirely in CSS: layered radial gradients, SVG blur filters, and keyframe animations. No WebGL or canvas needed.\n\n**Motion philosophy** — Animations serve communication, not decoration. Every transition has a clear purpose.`,
  },
  {
    keywords: ['react', 'vite', 'code', 'build', 'tech', 'stack', 'how'],
    response: `NEXUS is built with:\n\n• **React 18** — functional components, hooks for state management\n• **Vite** — fast development server and optimized production builds\n• **Pure CSS** — no Tailwind or component libraries; custom design tokens\n• **No external UI libraries** — every component is hand-built and readable\n\nThe project structure is intentionally simple so a first-year CS student can read and modify any part of it.\n\nState machine: idle → loading → success | error → idle`,
  },
  {
    keywords: ['accessibility', 'a11y', 'keyboard', 'screen reader', 'aria'],
    response: `Accessibility in NEXUS:\n\n• **Keyboard navigation** — Tab, Enter, Shift+Enter, and Escape are all handled\n• **Focus indicators** — Visible cyan outlines on all interactive elements\n• **ARIA labels** — The orb announces its current state to screen readers\n• **Reduced motion** — All animations respect prefers-reduced-motion\n• **Color contrast** — Text meets WCAG AA minimums against the dark background\n\nThese aren't afterthoughts — they're built into the design system from the start.`,
  },
  {
    keywords: ['hackathon', 'demo', 'project', 'present'],
    response: `For a hackathon demonstration, NEXUS shows:\n\n**What works right now:**\n• Full state machine (idle / loading / success / error)\n• Retry and reset flows\n• Copy response to clipboard\n• Responsive layout: desktop, tablet, mobile\n• Living orb reacts to every interaction state\n\n**How to extend it:**\n• Swap the mock service for a real AI API\n• Add conversation history below the orb\n• Persist sessions with localStorage\n\nThe clean architecture makes each of these a targeted change, not a rewrite.`,
  },
]

const FALLBACK_RESPONSE = `I received your message. In full deployment, NEXUS would route this to an AI model and return a contextual response.\n\nFor this demonstration, I'm responding with curated examples that show the interface working end-to-end.\n\nYou can ask me about: the design system, the tech stack, accessibility, or the project itself.`

/**
 * Finds the best matching response for a given query.
 * @param {string} query
 * @returns {string}
 */
function findResponse(query) {
  const lower = query.toLowerCase()
  let bestMatch = null
  let bestScore = 0

  for (const item of DEMO_RESPONSES) {
    const score = item.keywords.filter(k => lower.includes(k)).length
    if (score > bestScore) {
      bestScore = score
      bestMatch = item
    }
  }

  return bestMatch ? bestMatch.response : FALLBACK_RESPONSE
}

/**
 * Simulates a network delay between min and max milliseconds.
 * @param {number} min
 * @param {number} max
 */
function simulateDelay(min = 1200, max = 2400) {
  const ms = Math.floor(Math.random() * (max - min + 1)) + min
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Main request handler.
 * Replace this function body to connect a real AI backend.
 *
 * @param {string} query - The user's prompt
 * @param {AbortSignal} [signal] - Optional AbortController signal
 * @returns {Promise<{ text: string }>}
 */
export async function processQuery(query, signal) {
  if (!query || !query.trim()) {
    throw new Error('Query cannot be empty.')
  }

  // Respect abort signal (e.g. component unmount or manual cancel)
  if (signal?.aborted) {
    throw new DOMException('Request was cancelled.', 'AbortError')
  }

  await simulateDelay()

  // Check again after delay
  if (signal?.aborted) {
    throw new DOMException('Request was cancelled.', 'AbortError')
  }

  // Simulate a 10% error rate to demonstrate error handling
  if (Math.random() < 0.1) {
    throw new Error('Demo: Simulated transient error. Please retry.')
  }

  const text = findResponse(query.trim())
  return { text }
}
