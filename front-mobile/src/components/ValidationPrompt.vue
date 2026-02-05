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
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1001;
  padding: 20px;
}

.validation-card {
  background: white;
  padding: 28px;
  border-radius: 16px;
  text-align: center;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
  max-width: 340px;
  width: 100%;
}

.location-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.message {
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 12px;
}

.coordinates {
  font-size: 13px;
  color: #6b7280;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  margin-bottom: 24px;
  padding: 8px 12px;
  background: #f3f4f6;
  border-radius: 8px;
}

.button-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: none;
  padding: 14px 24px;
  border-radius: 12px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 600;
  transition: all 0.2s ease;
}

.btn-icon {
  font-size: 18px;
}

.btn-confirm {
  background-color: #2563eb;
  color: white;
}

.btn-confirm:hover {
  background-color: #1d4ed8;
  transform: translateY(-1px);
}

.btn-confirm:active {
  transform: translateY(0);
}

.btn-cancel {
  background-color: #f3f4f6;
  color: #4b5563;
}

.btn-cancel:hover {
  background-color: #e5e7eb;
}

/* Transition animations */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.fade-enter-active .validation-card,
.fade-leave-active .validation-card {
  transition: transform 0.2s ease;
}

.fade-enter-from .validation-card,
.fade-leave-to .validation-card {
  transform: scale(0.95);
}
</style>
