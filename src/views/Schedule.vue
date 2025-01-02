<script setup>
import { ref, onMounted } from 'vue';
import { supabase } from '../supabase';
import CardSchedule from '../components/CardSchedule.vue';

const maintenanceSchedules = ref([]);
const errorMessage = ref('');

// Ambil data maintenance schedule
onMounted(async () => {
  const { data, error } = await supabase
    .from('vehicles')
    .select('name, maintenance_schedule')
    .order('maintenance_schedule');

  if (error) {
    errorMessage.value = 'Terjadi kesalahan saat mengambil data.';
    console.error(error.message);
  } else {
    maintenanceSchedules.value = data;
  }
});
</script>

<template>
  <div class="w-full">
    <!-- Tampilkan error jika ada -->
    <p v-if="errorMessage" class="text-red-500 mb-4">{{ errorMessage }}</p>
    
    <!-- Tampilkan card untuk setiap kendaraan -->
    <div class="flex flex-col space-y-4">
      <h2 class="text-2xl font-extrabold text-start text-black pb-5">Maintenance Schedule</h2>
      <CardSchedule
        v-for="(schedule, index) in maintenanceSchedules"
        :key="index"
        :vehicleName="schedule.name"
        :maintenanceSchedule="schedule.maintenance_schedule"
      />
    </div>
  </div>
</template>

<style scoped>
.px-4 {
  padding-left: 16px;
  padding-right: 16px;
}
</style>
