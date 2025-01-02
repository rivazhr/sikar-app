<script setup>
import { ref, onMounted } from 'vue';
import { supabase } from '../supabase';

// State untuk menyimpan data kendaraan
const vehicles = ref([]);
const vehiclesError = ref(null);

// Fungsi untuk mengambil data kendaraan
const fetchVehicles = async () => {
  const { data, error } = await supabase.from('vehicles').select();

  if (error) {
    console.error('Error fetching vehicles:', error.message);
    vehiclesError.value = error.message;
  } else {
    vehicles.value = data;
  }
};

// Ambil data kendaraan saat komponen dimuat
onMounted(() => {
  fetchVehicles();
});
</script>

<template>
  <div class="flex-1">
    <h2 class="text-2xl font-extrabold text-start text-black pb-5">Vehicles</h2>
    <div v-if="vehiclesError" class="text-red-500">{{ vehiclesError }}</div>
    <div v-else class="overflow-x-auto w-full shadow-lg rounded-lg bg-white">
      <table class="w-full table-auto">
        <!-- Tabel Header -->
        <thead class="bg-primary">
          <tr>
            <th class="px-4 py-2 text-center text-sm font-semibold text-white">No</th>
            <th class="px-4 py-2 text-center text-sm font-semibold text-white">Name</th>
            <th class="px-4 py-2 text-center text-sm font-semibold text-white">Fuel</th>
            <th class="px-4 py-2 text-center text-sm font-semibold text-white">Type</th>
            <th class="px-4 py-2 text-center text-sm font-semibold text-white">Category</th>
            <th class="px-4 py-2 text-center text-sm font-semibold text-white">Status</th>
          </tr>
        </thead>

        <!-- Tabel Body -->
        <tbody>
          <tr v-for="(item, index) in vehicles" :key="item.id">
            <td class="px-4 py-2 text-sm text-gray-700">{{ index + 1 }}</td>
            <td class="px-4 py-2 text-sm text-gray-700">{{ item.name }}</td>
            <td class="px-4 py-2 text-sm text-gray-700">{{ item.fuel_current }} / {{ item.fuel }} L</td>
            <td class="px-4 py-2 text-sm text-gray-700">{{ item.type }}</td>
            <td class="px-4 py-2 text-sm text-gray-700">{{ item.category }}</td>
            <td class="px-4 py-2 text-sm bg-green-400 text-black" v-if="item.status === 'Available'">{{ item.status }}</td>
            <td class="px-4 py-2 text-sm bg-gray-500 text-white" v-else-if="item.status === 'On Leave'">{{ item.status }}</td>
            <td class="px-4 py-2 text-sm bg-red-500 text-white" v-else-if="item.status === 'Booked'">{{ item.status }}</td>
            <td class="px-4 py-2 text-sm bg-yellow-400 text-black" v-else-if="item.status === 'On Maintenance'">{{ item.status }}</td>
            <td class="px-4 py-2 text-sm text-gray-700" v-else>{{ item.status }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
</style>
