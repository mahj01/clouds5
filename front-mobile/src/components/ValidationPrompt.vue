<template>
  <Transition name="fade">
    <div class="validation-overlay" v-if="visible" @click.self="cancel">
      <div class="validation-card">
        <div class="location-icon">📍</div>
        <p class="message">{{ message }}</p>
        <div class="coordinates" v-if="latitude && longitude">
          <span>{{ latitude.toFixed(6) }}, {{ longitude.toFixed(6) }}</span>
        </div>
        <div class="button-group">
          <button @click="confirm" class="btn btn-confirm">
            <span class="btn-icon">✓</span>
            Confirmer
          </button>
          <button @click="cancel" class="btn btn-cancel">
            <span class="btn-icon">↺</span>
            Choisir ailleurs
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script>
export default {
  name: 'ValidationPrompt',
  props: {
    visible: {
      type: Boolean,
      required: true,
    },
    message: {
      type: String,
      default: 'Est-ce la bonne position ?'
    },
    latitude: {
      type: Number,
      default: null
    },
    longitude: {
      type: Number,
      default: null
    }
  },
  emits: ['confirm', 'cancel'],
  methods: {
    confirm() {
      this.$emit('confirm');
    },
    cancel() {
      this.$emit('cancel');
    }
  }
};
</script>

<style scoped>
.validation-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1001;
  padding: 24px;
}

.validation-card {
  background: #ffffff;
  padding: 32px 28px;
  border-radius: 24px;
  text-align: center;
  box-shadow: 0 24px 48px rgba(0, 0, 0, 0.16), 0 4px 12px rgba(0, 0, 0, 0.06);
  max-width: 340px;
  width: 100%;
}

.location-icon {
  font-size: 52px;
  margin-bottom: 18px;
  display: block;
  animation: pulse-pin 2s ease-in-out infinite;
}

@keyframes pulse-pin {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.08); }
}

.message {
  font-size: 19px;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 14px;
  letter-spacing: -0.02em;
  line-height: 1.4;
}

.coordinates {
  font-size: 13px;
  color: #64748b;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  margin-bottom: 26px;
  padding: 10px 14px;
  background: #f1f5f9;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
}

.button-group {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  border: none;
  padding: 16px 24px;
  border-radius: 14px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 700;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  letter-spacing: -0.01em;
  -webkit-tap-highlight-color: transparent;
}

.btn-icon {
  font-size: 18px;
}

.btn-confirm {
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  color: white;
  box-shadow: 0 4px 14px rgba(37, 99, 235, 0.35);
}

.btn-confirm:hover {
  box-shadow: 0 6px 20px rgba(37, 99, 235, 0.45);
  transform: translateY(-1px);
}

.btn-confirm:active {
  transform: translateY(0) scale(0.98);
  box-shadow: 0 2px 8px rgba(37, 99, 235, 0.3);
}

.btn-cancel {
  background: #f1f5f9;
  color: #475569;
  border: 1.5px solid #e2e8f0;
}

.btn-cancel:hover {
  background: #e2e8f0;
}

.btn-cancel:active {
  transform: scale(0.98);
}

/* Transition animations */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.fade-enter-active .validation-card,
.fade-leave-active .validation-card {
  transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.fade-enter-from .validation-card,
.fade-leave-to .validation-card {
  transform: scale(0.92) translateY(8px);
}

@media (prefers-color-scheme: dark) {
  .validation-card {
    background: #1e293b;
    box-shadow: 0 24px 48px rgba(0, 0, 0, 0.4);
  }

  .message {
    color: #f1f5f9;
  }

  .coordinates {
    background: #0f172a;
    border-color: #334155;
    color: #94a3b8;
  }

  .btn-cancel {
    background: #334155;
    border-color: #475569;
    color: #cbd5e1;
  }

  .btn-cancel:hover {
    background: #475569;
  }
}
</style>
