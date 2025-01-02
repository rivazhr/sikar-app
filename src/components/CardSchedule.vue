<template>
  <div
    class="card flex w-full bg-white shadow-md rounded-lg p-4 cursor-pointer hover:shadow-lg hover:bg-gray-200 transition duration-300"
    @click="goToVehiclePage"
  >
    <div class="flex-1 text-start">
      <h3 class="text-lg font-semibold text-black">{{ vehicleName }}</h3>
      <p class="text-gray-600">{{ maintenanceSchedule }}</p>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router';

const props = defineProps({
  vehicleName: String,
  maintenanceSchedule: String,
});

const router = useRouter();

// Fungsi untuk mengarahkan ke halaman /vehicle
const goToVehiclePage = () => {
  router.push('/vehicle'); 
};
</script>

<style scoped>
.card {
  border: 1px solid #e0e0e0;
  margin-bottom: 10px;
}
</style>
