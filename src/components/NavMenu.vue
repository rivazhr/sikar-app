<script setup>
import { useRoute } from 'vue-router';
import { computed } from 'vue';

const props = defineProps({
  icon: String,
  label: String,
  link: String,
});

const route = useRoute();
const isActive = computed(() => route.path === props.link); 
const iconSrc = computed(() => {
  return `${props.icon}${isActive.value ? '-active' : ''}.svg`;
});
</script>

<template>
  <li class="flex">
    <router-link 
      :to="link" 
      :class="[ 
        'rounded-md text-sm w-full px-4 py-3 sm:p-4 flex items-center transition-all font-semibold', 
        isActive ? 'bg-primary text-white hover:text-white' : 'hover:bg-primary-100 hover:text-black text-black' 
      ]"
    >
      <img :src="iconSrc" class="sm:me-2 me-0 visible h-full" alt="" />
      <span class="hidden sm:inline">{{ label }}</span>  
    </router-link>
  </li>
</template>