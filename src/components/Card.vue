<script setup>
defineProps({
  icon: String,
  label: String, 
  value: String,
  percentage: Number, 
})
</script>

<template>
  <div class="flex items-center mb-5">
    <span class="text-start flex-grow">
      <p class="text-gray-600 mb-3">{{ label }}</p>
      <p class="text-black text-2xl font-bold">{{ value }}</p>
    </span>
    <span>
      <img :src="icon" class="hidden lg:inline" alt="">
    </span>
  </div>
  <div class="text-black text-start  lg:flex lg:flex-row">
    <span class="me-1 gap-1 flex flex-row">
      <img src="/assets/dashboard-up.svg" alt="up" v-if="percentage>0">
      <p class="text-green-600 font-bold" v-if="percentage>0">{{ percentage }}%</p>
      <p class="text-red-600 font-bold" v-else>{{ percentage }}%</p>
    </span>
    <span><p>from Last Month</p></span>
  </div>
</template>
