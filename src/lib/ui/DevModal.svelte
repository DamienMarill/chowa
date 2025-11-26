<script lang="ts">
    import { onDestroy } from 'svelte';
    import Modal from './Modal.svelte';
    import { TYPING_SPEED } from '../config/constants';

    interface Props {
        isOpen?: boolean;
        onClose?: () => void;
    }

    let { isOpen = $bindable(false), onClose }: Props = $props();

    // Variables pour l'animation SVG
    let codeContainer = $state(undefined as HTMLElement | undefined);
    let svgContainer = $state(undefined as HTMLElement | undefined);
    let typingTimeout = $state(undefined as NodeJS.Timeout | undefined);

    const svgCode = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400">
    <!-- Corps principal -->
    <ellipse cx="200" cy="220" rx="100" ry="80" fill="#fff4d6"/>
    <!-- Aile -->
    <path d="M220 200 C250 180 240 160 210 190" fill="#ffeba3" stroke="#ffeba3" stroke-width="15" stroke-linecap="round"/>
    <!-- Petite queue -->
    <path d="M290 200 C310 220 300 240 280 230" fill="#ffeba3"/>
    <!-- Tête -->
    <circle cx="140" cy="160" r="60" fill="#fff4d6"/>
    <!-- Bec -->
    <path d="M100 160 L80 165 L100 170 Z" fill="#ffb347"/>
    <!-- Œil -->
    <circle cx="120" cy="150" r="10" fill="#333"/>
    <!-- Reflet de l'œil -->
    <circle cx="125" cy="145" r="3" fill="white"/>
    <!-- Joue rose -->
    <circle cx="130" cy="165" r="10" fill="#ffcece" opacity="0.6"/>
    <!-- Pattes -->
    <path d="M180 290 L200 310" stroke="#ffb347" stroke-width="8" stroke-linecap="round"/>
    <path d="M200 290 L220 310" stroke="#ffb347" stroke-width="8" stroke-linecap="round"/>
    <!-- Petites bulles décoratives -->
    <circle cx="90" cy="120" r="4" fill="#fff4d6"/>
    <circle cx="100" cy="100" r="3" fill="#fff4d6"/>
    <circle cx="80" cy="140" r="3" fill="#fff4d6"/>
    <!-- Effet brillant -->
    <path d="M180 100 L190 90 M185 85 L195 95" stroke="#fffae5" stroke-width="3" stroke-linecap="round"/>
</svg>`;

    export function startAnimation() {
        if (codeContainer) codeContainer.textContent = '';
        if (svgContainer) svgContainer.innerHTML = '';
        if (typingTimeout) clearTimeout(typingTimeout);

        let charIndex = 0;
        function typeNextChar() {
            if (charIndex < svgCode.length && codeContainer) {
                codeContainer.textContent += svgCode.charAt(charIndex);
                codeContainer.scrollTop = codeContainer.scrollHeight;
                charIndex++;
                typingTimeout = setTimeout(typeNextChar, TYPING_SPEED);
            } else if (svgContainer) {
                svgContainer.innerHTML = svgCode;
                const svgElement = svgContainer.querySelector('svg');
                if (svgElement) {
                    svgElement.classList.add('appear-animation');
                }
            }
        }
        typeNextChar();
    }

    onDestroy(() => {
        if (typingTimeout) {
            clearTimeout(typingTimeout);
        }
    });
</script>

<Modal bind:isOpen={isOpen} onClose={onClose} title="SVG Animation Kawaii" maxWidth="900px">
    <div class="flex flex-col space-y-4">
        <div class="flex flex-col md:flex-row gap-4">
            <div class="mockup-code bg-base-200 text-base-content flex-1 overflow-x-auto text-sm">
                <pre><code bind:this={codeContainer}></code></pre>
            </div>
            <div class="flex-1 flex items-center justify-center p-4 bg-base-200 rounded-lg">
                <div bind:this={svgContainer} class="w-full h-full flex items-center justify-center"></div>
            </div>
        </div>
    </div>
</Modal>
