# NEXUS 2.0 — Spatial Intelligence Interface

An interactive, spatial AI web interface featuring a living 3D orb built with **React**, **Vite**, **Three.js**, **React Three Fiber (@react-three/fiber)**, and **Drei (@react-three/drei)**.

![NEXUS 2.0 Preview](public/vite.svg)

---

## ✨ Features

- **Living 3D WebGL Orb**:
  - Distorted mesh core with real-time vertex deformation and breathing scale animation.
  - Interactive orbiting 3D particle cloud.
  - State-reactive lighting, speeds, and emissive color dynamics across 5 system states:
    - `idle`: Deep cosmic cyan, calm breathing
    - `active`: Heightened luminescence responding to composer focus
    - `loading`: Rapid pulsing blue core with accelerated particle spin
    - `success`: Calming emerald green glow with stabilized orbit
    - `error`: Crimson warning pulse
  - Built-in fallback to 2D CSS orb for environments without WebGL support.
- **Spatial Intelligence Workspace**:
  - **Telemetry Nav**: Real-time status badge ("Standby", "Processing", "Ready") and mode indicator.
  - **Left Rail with Session History**: Recent queries automatically persist to `localStorage` with one-click recall into the composer.
  - **Command Composer**: Ergonomic bottom dock with keyboard shortcuts (`Enter` to submit, `Shift+Enter` for newline) and quick suggestion chips.
  - **Inline Response & Error Handling**: Glassmorphic cards with copy-to-clipboard, retry triggers, and reset actions.
  - **Responsive Design**: Adapts smoothly across desktop, tablet, and mobile displays.

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+ recommended)
- [npm](https://www.npmjs.com/)

### Installation

```bash
# Clone the repository
git clone https://github.com/ridhamsharma231-hub/nexus-ai-interface.git

# Navigate into the project directory
cd nexus-ai-interface

# Install dependencies
npm install --legacy-peer-deps
```

### Running Locally

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser to experience NEXUS.

### Building for Production

```bash
npm run build
```

---

## 🛠 Tech Stack

- **Framework**: [React 18](https://react.dev/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **3D Graphics**: [Three.js](https://threejs.org/) + [@react-three/fiber](https://r3f.docs.pmnd.rs/) + [@react-three/drei](https://github.com/pmndrs/drei)
- **Styling**: Vanilla CSS (CSS Variables, Glassmorphism, Micro-interactions)

---

## 📄 License

MIT License. Free to use and modify for your projects!
