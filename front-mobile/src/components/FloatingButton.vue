<template>
  <button
    class="floating-button"
    :class="{ 'cancel-mode': isCancel }"
    @click="$emit('click')"
  >
    <span class="icon" :class="{ 'rotate': isCancel }">{{ isCancel ? '×' : '+' }}</span>
  </button>
</template>

<script>
export default {
  name: 'FloatingButton',
  props: {
    isCancel: {
      type: Boolean,
      default: false
    }
  },
  emits: ['click']
};
</script>

<style scoped>
.floating-button {
  position: fixed;
  bottom: 28px;
  right: 24px;
  width: 60px;
  height: 60px;
  border-radius: 18px;
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  color: white;
  border: none;
  box-shadow: 0 6px 20px rgba(37, 99, 235, 0.4), 0 2px 6px rgba(0, 0, 0, 0.08);
  font-size: 30px;
  font-weight: 300;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 999;
  -webkit-tap-highlight-color: transparent;
}

.floating-button:hover {
  background: linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%);
  transform: scale(1.05);
  box-shadow: 0 8px 28px rgba(37, 99, 235, 0.5), 0 2px 8px rgba(0, 0, 0, 0.1);
}

.floating-button:active {
  transform: scale(0.93);
  box-shadow: 0 2px 8px rgba(37, 99, 235, 0.3);
}

.floating-button.cancel-mode {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  box-shadow: 0 6px 20px rgba(239, 68, 68, 0.4), 0 2px 6px rgba(0, 0, 0, 0.08);
  border-radius: 50%;
}

.floating-button.cancel-mode:hover {
  background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
  box-shadow: 0 8px 28px rgba(239, 68, 68, 0.5);
}

.icon {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  line-height: 1;
  font-weight: 400;
}

.icon.rotate {
  transform: rotate(45deg);
}
</style>
