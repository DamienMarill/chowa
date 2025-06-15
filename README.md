# Chōwa - Web AR Application

Chōwa is an augmented reality application built with Svelte, A-Frame, and AR.js. It uses image tracking (NFT - Natural Feature Tracking) to detect a specific image marker and overlay a 3D model in the camera view.

## AR Functionality

The application utilizes AR.js for its Natural Feature Tracking capabilities. When the camera is activated and pointed at the correct target image (defined by the descriptor files in `public/`), a 3D model is rendered on top of it.

The target image marker is configured via `public/chowa.iset` and associated files. The 3D model displayed is intended to be referenced in `src/lib/ARView.svelte` (currently, there's a placeholder/potential typo for the model path).

## Technologies Used

- **Svelte:** A reactive JavaScript framework for building user interfaces.
- **Vite:** A fast build tool and development server.
- **TypeScript:** For static typing and improved code quality.
- **A-Frame:** A web framework for building virtual reality (VR) and augmented reality (AR) experiences.
- **AR.js:** An open-source library for AR on the web, specifically used here for image tracking.
- **TailwindCSS:** A utility-first CSS framework.
- **DaisyUI:** A component library for TailwindCSS.

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (LTS version recommended)
- [pnpm](https://pnpm.io/) (packet manager)

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd <repository-directory>
   ```
2. Install the dependencies:
   ```bash
   pnpm install
   ```

### Running the Development Server

To start the development server:
```bash
pnpm dev
```
The application will typically be available at `https://localhost:5173/`.
Note: This project uses `vite-plugin-mkcert` to automatically generate SSL certificates for local development, as HTTPS is required for camera access in modern browsers. You might need to trust the generated certificate in your browser the first time you run it.

### Building for Production

To create a production build:
```bash
pnpm build
```
The output files will be in the `dist/` directory.

### Previewing the Production Build

To preview the production build locally:
```bash
pnpm preview
```
This will serve the `dist/` directory.

## How to Use

1.  **Start the application:** Follow the instructions in the "Getting Started" section to run the development server (`pnpm dev`).
2.  **Open the application in your browser:** Navigate to the provided local URL (usually `https://localhost:5173/`).
3.  **Welcome Screen:** You will see the Chōwa welcome screen with a title and a button "Activer la caméra" (Activate camera).
4.  **Activate Camera:** Click the "Activer la caméra" button. Your browser will likely ask for permission to access your webcam. Grant permission.
5.  **AR Experience:**
    *   Once the camera feed is active, point your device's camera at the target image marker.
    *   The target image is defined by the NFT descriptor located at `public/chowa.iset` (and its associated `.fset3` file). You will need to have a physical or digital version of this marker image. (Note: The actual image `chowa.png` in the `public` directory is likely the intended visual marker).
    *   When the marker is detected, the 3D model configured in the application should appear overlaid on or near the marker in your camera view.
6.  **Exit AR View:** To return to the welcome screen, click the "Quitter" (Exit) button, which is usually displayed overlaying the camera view.

## Project Structure

Here's an overview of the key files and directories in the Chōwa project:

```
.
├── public/               # Static assets accessible from the web root
│   ├── chowa.iset        # AR.js NFT marker descriptor file
│   ├── chowa.fset3       # AR.js NFT marker feature set file (binary)
│   └── chowa.png         # Likely the visual image marker corresponding to the .iset descriptor
├── src/                  # Application source code
│   ├── assets/           # Static assets like images, fonts (if any, currently svelte.svg)
│   ├── lib/              # Library components
│   │   └── ARView.svelte # Svelte component for the A-Frame AR scene
│   ├── App.svelte        # Main Svelte application component (handles view switching)
│   ├── app.css           # Global styles for the application
│   └── main.ts           # Main TypeScript entry point, initializes the Svelte app
├── index.html            # HTML entry point, loads A-Frame and AR.js scripts
├── package.json          # Project metadata, dependencies, and scripts
├── svelte.config.js      # Svelte compiler configuration
├── tsconfig.json         # TypeScript compiler configuration
├── vite.config.ts        # Vite build tool configuration
└── README.md             # This documentation file
```

-   **`public/`**: Contains static assets.
    -   `chowa.iset`, `chowa.fset3`: These are the AR.js Natural Feature Tracking (NFT) marker files. `chowa.iset` is the descriptor and `chowa.fset3` contains the feature set.
    -   `chowa.png`: This is likely the actual image that the AR system will look for. You need to display this image (e.g., on a screen or printout) and point your device's camera at it.
-   **`src/`**: Contains all the Svelte application code.
    -   `App.svelte`: The root Svelte component. It manages the display of either the welcome page or the AR camera view.
    -   `lib/ARView.svelte`: This component sets up and manages the A-Frame scene required for the augmented reality experience. It defines the AR marker to track and the 3D content to display.
    -   `main.ts`: The entry point of the application. It instantiates the main Svelte component (`App.svelte`) and mounts it to the DOM.
-   **`index.html`**: The main HTML page that gets served to the browser. It includes necessary script tags for A-Frame and AR.js and provides the root element for the Svelte application.
-   **`vite.config.ts`**: Configuration file for Vite, the build tool used by the project. It includes settings for the development server, build process, and plugins (like the Svelte plugin and mkcert for HTTPS).
-   **`package.json`**: Standard Node.js manifest file that lists project dependencies, scripts (for building, developing, etc.), and other metadata.

# Svelte + TS + Vite

This template should help get you started developing with Svelte and TypeScript in Vite.

## Recommended IDE Setup

[VS Code](https://code.visualstudio.com/) + [Svelte](https://marketplace.visualstudio.com/items?itemName=svelte.svelte-vscode).

## Need an official Svelte framework?

Check out [SvelteKit](https://github.com/sveltejs/kit#readme), which is also powered by Vite. Deploy anywhere with its serverless-first approach and adapt to various platforms, with out of the box support for TypeScript, SCSS, and Less, and easily-added support for mdsvex, GraphQL, PostCSS, Tailwind CSS, and more.

## Technical considerations

**Why use this over SvelteKit?**

- It brings its own routing solution which might not be preferable for some users.
- It is first and foremost a framework that just happens to use Vite under the hood, not a Vite app.

This template contains as little as possible to get started with Vite + TypeScript + Svelte, while taking into account the developer experience with regards to HMR and intellisense. It demonstrates capabilities on par with the other `create-vite` templates and is a good starting point for beginners dipping their toes into a Vite + Svelte project.

Should you later need the extended capabilities and extensibility provided by SvelteKit, the template has been structured similarly to SvelteKit so that it is easy to migrate.

**Why `global.d.ts` instead of `compilerOptions.types` inside `jsconfig.json` or `tsconfig.json`?**

Setting `compilerOptions.types` shuts out all other types not explicitly listed in the configuration. Using triple-slash references keeps the default TypeScript setting of accepting type information from the entire workspace, while also adding `svelte` and `vite/client` type information.

**Why include `.vscode/extensions.json`?**

Other templates indirectly recommend extensions via the README, but this file allows VS Code to prompt the user to install the recommended extension upon opening the project.

**Why enable `allowJs` in the TS template?**

While `allowJs: false` would indeed prevent the use of `.js` files in the project, it does not prevent the use of JavaScript syntax in `.svelte` files. In addition, it would force `checkJs: false`, bringing the worst of both worlds: not being able to guarantee the entire codebase is TypeScript, and also having worse typechecking for the existing JavaScript. In addition, there are valid use cases in which a mixed codebase may be relevant.

**Why is HMR not preserving my local component state?**

HMR state preservation comes with a number of gotchas! It has been disabled by default in both `svelte-hmr` and `@sveltejs/vite-plugin-svelte` due to its often surprising behavior. You can read the details [here](https://github.com/rixo/svelte-hmr#svelte-hmr).

If you have state that's important to retain within a component, consider creating an external store which would not be replaced by HMR.

```ts
// store.ts
// An extremely simple external store
import { writable } from 'svelte/store'
export default writable(0)
```
