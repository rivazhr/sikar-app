<script setup>
defineProps({
  icon: String,
  label: String, 
  value: String,
  percentage: String, 
  percentageIcon: String 
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
  <div class="text-black text-start hidden lg:flex lg:flex-row">
    <span class="me-1 gap-1 flex flex-row text-green-600 font-bold">
      <img :src="percentageIcon" alt="">
      <p>{{ percentage }}</p>
    </span>
    <span><p>from Last Month</p></span>
  </div>
</template>
