<script setup>
defineProps({
  label: String, 
  value: String,
  percentage: Number, 
})
</script>

<template>
  <div class="flex flex-col w-full h-full">
    <div class="flex items-center my-auto">
      <span class="text-start flex-grow">
        <p class="text-gray-600 mb-3">Total {{ label }}</p>
        <p class="text-black text-2xl font-bold">{{ value }}</p>
      </span>
      <span>
        <img v-if="label.includes('Users')" src="/assets/dashboard-users.svg" class="inline" alt="">
        <img v-else-if="label.includes('Reservations')" src="/assets/dashboard-reservations.svg" class="inline" alt="">
        <img v-else src="/assets/dashboard-vehicles.svg" class="inline" alt="">
      </span>
    </div>
    <div class="text-black text-start flex flex-row mt-3">
      <span class="me-1 gap-1 flex flex-row">
        <img src="/assets/dashboard-up.svg" alt="up" v-if="percentage>0">
        <img src="/assets/dashboard-0.svg" alt="up" v-else-if="percentage==0">
        <img src="/assets/dashboard-down.svg" alt="up" v-else>
        <p class="text-green-600 font-bold" v-if="percentage>0">{{ percentage }}%</p>
        <p class="text-yellow-600 font-bold" v-else-if="percentage==0">{{ percentage }}%</p>
        <p class="text-red-600 font-bold" v-else>{{ percentage }}%</p>
      </span>
      <span><p>from Last Month</p></span>
    </div>
  </div>
</template>
