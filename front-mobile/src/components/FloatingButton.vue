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
  bottom: 24px;
  right: 24px;
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background-color: #2563eb;
  color: white;
  border: none;
  box-shadow: 0 6px 16px rgba(37, 99, 235, 0.4);
  font-size: 32px;
  font-weight: 300;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  z-index: 999;
}

.floating-button:hover {
  background-color: #1d4ed8;
  transform: scale(1.05);
}

.floating-button:active {
  transform: scale(0.95);
}

.floating-button.cancel-mode {
  background-color: #dc2626;
  box-shadow: 0 6px 16px rgba(220, 38, 38, 0.4);
}

.floating-button.cancel-mode:hover {
  background-color: #b91c1c;
}

.icon {
  transition: transform 0.3s ease;
  line-height: 1;
}

.icon.rotate {
  transform: rotate(45deg);
}
</style>
