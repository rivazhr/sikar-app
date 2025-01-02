<script setup>
import { ref, onMounted, watch } from 'vue';
import { supabase } from '../supabase';
import * as XLSX from 'xlsx';

// Method untuk load tabel ke Excel
const exportTableToExcel = () => {
  const table = document.getElementById("reservationsTable");
  const ws = XLSX.utils.table_to_sheet(table);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Reservations');
  XLSX.writeFile(wb, 'reservations.xlsx');
};

// State untuk menyimpan data reservasi dan error
const reservations = ref([]);
const reservationsError = ref(null);

// State untuk menampilkan dialog
const showDialog = ref(false);
const newReservation = ref({
  vehicle_category: '', 
  vehicle_id: '', 
  start_date: '',
  end_date: '',
  status: 'Waiting',
  fuel_consumption: 0
});

// State untuk menyimpan daftar kendaraan dan kendaraan yang difilter
const vehicles = ref([]);
const filteredVehicles = ref([]);

// Ambil data kendaraan untuk dropdown
const fetchVehicles = async () => {
  const { data, error } = await supabase
    .from('vehicles')
    .select('*');

  if (error) {
    console.error('Error fetching vehicles:', error.message);
  } else {
    vehicles.value = data;
    filterVehicles();
  }
};

// Filter kendaraan berdasarkan kategori yang dipilih
const filterVehicles = () => {
  filteredVehicles.value = vehicles.value.filter(vehicle => vehicle.category === newReservation.value.vehicle_category && vehicle.status === 'Available');
};

// Fungsi untuk mengambil data reservasi
const fetchReservations = async () => {
  const { data, error } = await supabase
    .from('reservations')
    .select('id,start_date,end_date,status,fuel_consumption,users(name),vehicles(name, category)') 
    .order('start_date');

  if (error) {
    reservationsError.value = error.message || 'Terjadi kesalahan saat mengambil data.';
  } else {
    reservations.value = data;
  }
};

// Fungsi untuk menambah reservasi
const addReservation = async () => {
  const { data, error } = await supabase
    .from('reservations')
    .insert([{
      vehicle_id: newReservation.value.vehicle_id, 
      start_date: newReservation.value.start_date,
      end_date: newReservation.value.end_date,
      status: newReservation.value.status,
      fuel_consumption: newReservation.value.fuel_consumption,
    }]);

  if (error) {
    console.error('Error adding reservation:', error.message);
  } else {
    console.log('Reservation added successfully');
    fetchReservations();
    showDialog.value = false; 
  }
};

// Fungsi untuk menghapus item
const deleteItem = async (id) => {
  const { error } = await supabase
    .from('reservations')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting item:', error.message);
  } else {
    console.log('Item deleted successfully');
    fetchReservations();
  }
};

// Watch untuk memonitor perubahan kategori kendaraan dan memperbarui filteredVehicles
watch(() => newReservation.value.vehicle_category, filterVehicles);

// Ambil data saat komponen pertama kali dimuat
onMounted(() => {
  fetchReservations();
  fetchVehicles();
});
</script>

<template>
  <div class="flex-1 w-full">
    <div class="flex items-center">
      <h2 class="text-2xl font-extrabold text-start flex-grow text-black pb-5">Reservations</h2>
      <button @click="showDialog = true" class="bg-primary h-fit opacity-90 hover:opacity-100 inline-flex p-2 md:py-2 md:px-4 rounded-full md:rounded aspect-square md:aspect-auto mb-4 me-2">
        <img src="../assets/add.svg" class="inline md:hidden" alt="">
        <p class="text-white font-semibold hidden md:inline">Add Reservation</p>
      </button>
      <button @click="exportTableToExcel" class="md:bg-green-500 bg-transparent opacity-90 hover:opacity-100 md:py-2 md:px-4 p-2 rounded mb-4">
        <img src="../assets/icon-excel.svg" class="max-w-7 inline md:hidden" alt="">
        <p class="text-white font-semibold hidden md:inline">Export to Excel</p>
      </button>
    </div>

    <!-- Dialog Box -->
    <div v-if="showDialog" class="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-50">
      <div class="bg-white rounded-lg shadow-lg p-6 w-4/5 sm:w-2/5 text-start">
        <h2 class="text-xl font-bold mb-4 text-black text-center">Add Reservation</h2>
        <form @submit.prevent="addReservation">
          <!-- Vehicle Category Dropdown -->
          <div class="mb-4">
            <label for="vehicle_category" class="block text-sm font-medium text-gray-700">Vehicle Category<span class="text-error"> (*)</span></label>
            <select v-model="newReservation.vehicle_category" id="vehicle_category" class="mt-1 p-2 w-full border bg-gray-100 text-black border-gray-300 rounded-md" required>
              <option value="Passenger">Passenger</option>
              <option value="Cargo">Cargo</option>
            </select>
          </div>

          <!-- Vehicle Dropdown -->
          <div class="mb-4">
            <label for="vehicle" class="block text-sm font-medium text-gray-700">Vehicle<span class="text-error"> (*)</span></label>
            <select v-model="newReservation.vehicle_id" id="vehicle" class="mt-1 p-2 w-full border bg-gray-100 text-black border-gray-300 rounded-md" required>
              <option v-for="vehicle in filteredVehicles" :key="vehicle.id" :value="vehicle.id">{{ vehicle.name }}</option>
            </select>
          </div>

          <!-- Inline Date Pickers -->
          <div class="mb-4 flex space-x-4">
            <div class="w-full">
              <label for="start_date" class="block text-sm font-medium text-gray-700">Start Date<span class="text-error"> (*)</span></label>
              <input v-model="newReservation.start_date" id="start_date" type="date" class="mt-1 p-2 w-full border bg-gray-100 text-black border-gray-300 rounded-md" required />
            </div>
            <div class="w-full">
              <label for="end_date" class="block text-sm font-medium text-gray-700">End Date<span class="text-error"> (*)</span></label>
              <input v-model="newReservation.end_date" id="end_date" type="date" class="mt-1 p-2 w-full border bg-gray-100 text-black border-gray-300 rounded-md" required />
            </div>
          </div>
          <p class="text-error mb-3">(*) is required</p>

          <div class="flex justify-end">
            <button type="button" @click="showDialog = false" class="mr-2 text-gray-500 bg-gray-200 hover:bg-gray-300">
              Cancel
            </button>
            <button type="submit" class="bg-primary text-white py-2 px-4 rounded opacity-90 hover:opacity-100">
              Add
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Tabel dengan scroll hanya untuk tabel -->
    <div class="w-full overflow-x-auto">
      <div class="w-fit shadow-lg rounded-lg bg-white">
        <table class="w-fit table-auto" id="reservationsTable">
          <!-- Tabel Header -->
          <thead class="bg-primary">
            <tr>
              <th class="px-4 py-2 text-center text-sm font-semibold text-white">No</th>
              <th class="px-4 py-2 text-center text-sm font-semibold text-white">User Name</th>
              <th class="px-4 py-2 text-center text-sm font-semibold text-white">Vehicle Name</th>
              <th class="px-4 py-2 text-center text-sm font-semibold text-white">Vehicle Type</th>
              <th class="px-4 py-2 text-center text-sm font-semibold text-white">Start Date</th>
              <th class="px-4 py-2 text-center text-sm font-semibold text-white">End Date</th>
              <th class="px-4 py-2 text-center text-sm font-semibold text-white">Status</th>
              <th class="px-4 py-2 text-center text-sm font-semibold text-white">Fuel</th>
              <th class="px-4 py-2 text-center text-sm font-semibold text-white">Actions</th>
            </tr>
          </thead>

          <!-- Tabel Body -->
          <tbody>
            <tr v-for="(item, index) in reservations" :key="item.id">
              <td class="px-4 py-2 text-center text-sm text-gray-700">{{ index + 1 }}</td>
              <td class="px-4 py-2 text-sm text-gray-700">{{ item.users.name }}</td>
              <td class="px-4 py-2 text-sm text-gray-700">{{ item.vehicles.name }}</td>
              <td class="px-4 py-2 text-sm text-gray-700">{{ item.vehicles.category }}</td>
              <td class="px-4 py-2 text-sm text-gray-700">{{ item.start_date }}</td>
              <td class="px-4 py-2 text-sm text-gray-700">{{ item.end_date }}</td>
              <td class="px-4 py-2 text-sm bg-green-500 text-white" v-if="item.status === 'Approved'">{{ item.status }}</td>
              <td class="px-4 py-2 text-sm bg-red-500 text-white" v-else-if="item.status === 'Declined'">{{ item.status }}</td>
              <td class="px-4 py-2 text-sm text-gray-700" v-else>{{ item.status }}</td>
              <td class="px-4 py-2 text-sm text-gray-700">{{ item.fuel_consumption }}</td>
              <td class="px-4 py-2 text-sm text-gray-700 flex">
                <button @click="editItem(item)" class="bg-blue-500 m-1 hover:bg-blue-700 text-white p-2 px-4">Edit</button>
                <button @click="deleteItem(item.id)" class="bg-red-500 m-1 hover:bg-red-700 text-white p-2 px-4">Delete</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <p v-if="reservationsError" class="text-red-500 mt-4">{{ reservationsError }}</p>
  </div>
</template>
