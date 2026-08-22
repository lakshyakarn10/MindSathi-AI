# MindSaathi UI Direction

## Three stylistic approaches

### Theme Name: Quiet Observatory
Very brief intro: A calm, editorial wellness dashboard built around soft off-white surfaces, deep ink typography, and measured teal signals. It should feel like a trusted place to notice patterns without turning wellbeing into a score-chasing game.
Probability: 0.07

### Theme Name: Tideglass
Very brief intro: A luminous, glassy interface with cool blue gradients, translucent layers, and ambient motion inspired by water and breathing. It feels optimistic and soothing, but risks becoming too decorative for a serious safety product.
Probability: 0.03

### Theme Name: Campus Field Notes
Very brief intro: A warm, tactile student-support system using paper-like surfaces, annotation marks, muted citrus accents, and human editorial cues. It feels approachable and grounded, though less premium for institutional analytics.
Probability: 0.09

## Selected approach: Quiet Observatory

### Design Movement
Contemporary editorial wellness software: the composure of Swiss information design softened with the warmth of modern mental-health products. The interface should feel like a quiet room with excellent lighting—clear enough for decisions, gentle enough for vulnerable moments.

### Core Principles
1. **Signal, never spectacle.** Visual emphasis follows the importance of a wellness signal or support action, not decoration.
2. **Warm precision.** Data is legible and structured, but copy and color remain humane and non-clinical.
3. **Progress without pressure.** Trends are shown as observations and invitations, never as streaks, failures, or gamified performance.
4. **Human support stays visible.** The path from check-in to counselor is always easy to understand and reach.

### Color Philosophy
The base is a warm mineral white (#F7F8F5) with deep ink (#18314A) for trust and readability. A signature sea-glass teal (#2F9C95) represents steady support rather than “success.” Mist blue and pale lavender provide calm secondary layers, while amber is reserved for attention and a muted coral-red only for genuinely high-risk safety states. Color is paired with icons and labels so risk is never communicated by color alone.

### Layout Paradigm
Use an asymmetric observatory layout: a persistent left rail anchors navigation; the main column carries the student story; a narrow right rail holds contextual support, privacy, and session details. Large cards should be interrupted by editorial dividers, chart-led modules, and quiet whitespace rather than a uniform dashboard grid. On mobile, the structure collapses into a single narrative column with a fixed bottom navigation and a compact top utility row.

### Signature Elements
1. **Signal rail:** thin vertical teal and amber markers beside insight and risk modules, echoing an instrument readout.
2. **Observatory rings:** circular progress rings with a small offset tick that shows trend direction rather than a generic gauge.
3. **Field labels:** compact uppercase labels with generous letter spacing, used sparingly above section titles to create calm hierarchy.

### Interaction Philosophy
Every interaction should reduce uncertainty. Buttons use direct language such as “Complete check-in,” “View insights,” and “Request a session.” Important actions receive clear confirmation; simple actions use restrained toasts. Privacy badges are always actionable and explain what is visible to whom. High-risk flows slow the interface down visually and make human support more prominent, without flashing or dramatizing the state.

### Animation
Motion is quiet and purposeful: cards enter with a 180ms upward fade, chart lines reveal left-to-right, score numbers count smoothly once, and modals use a 220ms fade-and-scale from 0.97 to 1. Exercise breathing uses a slow ring expansion independent of the rest of the UI. Hover states lift interactive cards by 2px and deepen the shadow. Reduced-motion preferences disable non-essential reveals and number animations.

### Typography System
Use **DM Sans** for body copy and controls, with **Fraunces** for occasional editorial emphasis in hero or wellbeing statements. Headings are compact, dark, and weight 650–750; body copy is 15–16px with a generous 1.55 line height; labels are 10–11px uppercase with 0.12em tracking. Avoid using the display face for dense data or safety instructions.

### Brand Essence
MindSaathi is a privacy-first wellbeing companion for college students and the people who support them, helping teams notice meaningful changes early without pretending to diagnose. Personality: **steady, observant, humane**.

### Brand Voice
Headlines are quietly confident. CTAs are specific and low-pressure. Microcopy explains what is happening and why, using “you” language without implying certainty. Avoid generic filler and clinical claims.

Example lines:

> “Notice what your week is telling you.”

> “Support is available when you want it.”

### Wordmark & Logo
The mark is a simple offset observatory ring: an open circular form with a small sea-glass dot orbiting its upper-right edge, suggesting a signal being noticed and held with care. The wordmark pairs a sturdy DM Sans “Mind” with a softer italic “Saathi,” but the symbol must remain recognizable without text and work as the favicon.

### Signature Brand Color
**Sea-glass teal — #2F9C95.** It owns the brand because it sits between clinical blue and wellness green: calm, legible, and human without reading as a “positive score” badge.

## Implementation reminders

- Keep the student dashboard, check-in, explainable risk view, escalation, counselor queue, and aggregate admin view as the primary narrative.
- Use realistic mock data, but clearly label prototype-only flows where appropriate.
- Never present AI output as diagnosis, treatment, or professional counseling.
- Keep journal content private by default and show aggregate-only boundaries on admin views.
- Use shared session-request, notification, toast, and confirmation patterns across all entry points.
- Ask of every design choice: **Does this reinforce or dilute Quiet Observatory?**

## Style Decisions

- The app shell must always express the observatory layout: a recognizable MindSaathi/observatory-ring identity rail on the left, the student wellbeing narrative in the main column, and support/privacy/session context in a narrower right column.
- MindSaathi’s logo mark is mandatory in primary navigation: an open offset ring with a sea-glass dot, paired with the “MindSaathi” wordmark, so brand identity is never reduced to a generic avatar or label.
- Cards should not form a uniform SaaS grid; hierarchy should come from editorial breaks, signal rails, chart-led modules, and quiet whitespace, with rounded white cards used selectively rather than as the default visual answer.
