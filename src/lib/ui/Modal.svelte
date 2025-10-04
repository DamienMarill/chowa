<script lang="ts">
    /**
     * Composant Modal générique réutilisable
     * Utilise les runes Svelte 5 et le snippet {@render children?.()}
     */

    interface Props {
        isOpen?: boolean;
        onClose: () => void;
        title?: string;
        maxWidth?: string;
        children?: import('svelte').Snippet;
    }

    let { isOpen = $bindable(false), onClose, title, maxWidth = '600px', children }: Props = $props();

    // Fermer avec Escape
    function handleKeydown(event: KeyboardEvent) {
        if (event.key === 'Escape' && isOpen) {
            onClose();
        }
    }
</script>

<svelte:window on:keydown={handleKeydown} />

{#if isOpen}
    <div
        class="modal-overlay"
        onclick={onClose}
        role="dialog"
        aria-modal="true"
    >
        <div
            class="modal-content"
            onclick={(e) => e.stopPropagation()}
            style:max-width={maxWidth}
        >
            {#if title}
                <h2 class="modal-title">{title}</h2>
            {/if}

            <button class="modal-close" onclick={onClose} aria-label="Fermer">
                ✕
            </button>

            <div class="modal-body">
                {@render children?.()}
            </div>
        </div>
    </div>
{/if}

<style>
    .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
        backdrop-filter: blur(4px);
    }

    .modal-content {
        background: white;
        border-radius: 12px;
        padding: 2rem;
        max-height: 90vh;
        overflow-y: auto;
        position: relative;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        animation: slideIn 0.3s ease-out;
    }

    @keyframes slideIn {
        from {
            opacity: 0;
            transform: translateY(-20px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    .modal-title {
        margin: 0 0 1.5rem 0;
        font-size: 1.5rem;
        color: #333;
    }

    .modal-close {
        position: absolute;
        top: 1rem;
        right: 1rem;
        background: none;
        border: none;
        font-size: 1.5rem;
        cursor: pointer;
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        transition: background 0.2s;
        color: #666;
    }

    .modal-close:hover {
        background: rgba(0, 0, 0, 0.1);
        color: #333;
    }

    .modal-body {
        color: #333;
    }
</style>
