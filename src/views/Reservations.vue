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

// State untuk menyimpan data untuk dropdown
const approvers = ref([]);
const drivers = ref([]);

// State untuk track perubahan status form
const editingId = ref(null);
const showDialog = ref(false);
const newReservation = ref({
  vehicle_category: '', 
  vehicle_id: '', 
  start_date: '',
  end_date: '',
  status: 'Waiting',
  fuel_consumption: 0,
  approver1: null,
  approver2: null,
  driver_id: null
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

// Fetch data reservasi
const fetchReservations = async () => {
  const { data, error } = await supabase
    .from('reservations')
    .select(`
      id,
      start_date, end_date, status, fuel_consumption,
      vehicles(name),
      user:users!user_id(name),
      driver:users!driver_id(name)
    `);

  if (error) {
    console.error('Error fetching reservations data:', error.message);
  } else {
    // Menyimpan data reservations yang diambil
    const reservationsData = data;
    console.log('Fetched reservations:', reservationsData);

    const { data: approvalsData, error: approvalsError } = await supabase
      .from('approvals')
      .select(`
        id,
        approver_1:users!approver1(name, id),
        approver_2:users!approver2(name, id),
        reservation_id
      `)
      .order('reservation_id');

    if (approvalsError) {
      console.error('Error fetching approvals data:', approvalsError.message);
    } else {
      // Menyimpan data approvals yang diambil
      console.log('Fetched approvals:', approvalsData);

      // Gabungkan data reservations dengan approvals berdasarkan reservation_id
      const mergedReservations = reservationsData.map(reservation => {
        const approval = approvalsData.find(approval => approval.reservation_id === reservation.id);
        return {
          ...reservation,
          approval_1: approval?.approver_1,
          approval_2: approval?.approver_2
        };
      });

      // Simpan data yang sudah digabung ke dalam state reservations
      reservations.value = mergedReservations;
    }
  }
};

// Ambil data pengguna yang bisa menjadi approver
const fetchUsersForApprovers = async () => {
  const { data, error } = await supabase
    .from('users')
    .select('id, name, role_id, company_id')
    .eq('role_id', 2); 

  if (error) {
    console.error('Error fetching users for approvers:', error.message);
  } else {
    approvers.value = data;
  }
};

// Ambil data driver yang sesuai dengan vehicle
const fetchDriversForVehicle = async (vehicleId) => {
  const { data, error } = await supabase
    .from('users')
    .select('id, name')
    .eq('role_id', 3) 
    .eq('company_id', vehicleId); 

  if (error) {
    console.error('Error fetching drivers:', error.message);
  } else {
    drivers.value = data;
  }
};

const addReservation = async () => {
  try {
    // Tambahkan data reservasi ke tabel reservations
    const { data: reservationData, error: reservationError } = await supabase
      .from('reservations')
      .insert({
        vehicle_id: newReservation.value.vehicle_id,
        start_date: newReservation.value.start_date,
        end_date: newReservation.value.end_date,
        status: newReservation.value.status,
      })
      .select();

    if (reservationError) {
      console.error('Error inserting reservation:', reservationError.message);
      return;
    }

    // Ambil ID reservasi baru
    const reservationId = reservationData[0].id;

    // Tambahkan data approval ke tabel approvals
    const { error: approvalError } = await supabase
      .from('approvals')
      .insert({
        reservation_id: reservationId,
        approver1: newReservation.value.approver1,
        approver2: newReservation.value.approver2,
      });

    if (approvalError) {
      console.error('Error inserting approval:', approvalError.message);
      return;
    }

    // Perbarui data tabel
    await fetchReservations();
    showDialog.value = false;
  } catch (error) {
    console.error('Error adding reservation:', error);
  }
};

// Update status dan driver pada reservasi
const updateReservation = async (reservation) => {
  try {
    // Update approval data
    await supabase
      .from('approvals')
      .update({
        approver1: reservation.approver1,
        approver2: reservation.approver2,
      })
      .eq('id', reservation.id);

    // Update driver data jika driver_id ada
    if (reservation.driver_id) {
      await supabase
        .from('reservations')
        .update({
          driver_id: reservation.driver_id,
        })
        .eq('id', reservation.id);
    }

    fetchReservations();
    editingId.value = null;
  } catch (error) {
    console.error('Error updating reservation:', error.message);
  }
};

// Menghapus data dari tabel reservasi
const deleteItem = async (reservationId) => {
  try {
    await supabase
      .from('reservations')
      .delete()
      .eq('id', reservationId);
    console.log('Reservation deleted successfully');
    fetchReservations(); // Refresh data setelah menghapus
  } catch (error) {
    console.error('Error deleting reservation:', error.message);
  }
};

// Watch untuk memonitor perubahan kategori kendaraan dan memperbarui filteredVehicles
watch(() => newReservation.value.vehicle_category, filterVehicles);

// Ambil data saat komponen pertama kali dimuat
onMounted(() => {
  fetchReservations();
  fetchVehicles();
  fetchUsersForApprovers();
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
        <img src="../assets/icon-excel.svg" class="max-w-7 inline md:hidden" alt=""/>
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
              Save
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Tabel dengan scroll hanya untuk tabel -->
    <div class="w-full overflow-x-auto flex-grow rounded-lg">
      <div class="shadow-lg flex rounded-lg bg-white">
        <table class="w-fit table-auto flex-grow" id="reservationsTable">
          <!-- Tabel Header -->
          <thead class="bg-primary">
            <tr>
              <th class="px-4 py-2 text-center text-sm font-semibold text-white">No</th>
              <th class="px-4 py-2 text-center text-sm font-semibold text-white">User Name</th>
              <th class="px-4 py-2 text-center text-sm font-semibold text-white">Vehicle Name</th>
              <th class="px-4 py-2 text-center text-sm font-semibold text-white">Start Date</th>
              <th class="px-4 py-2 text-center text-sm font-semibold text-white">End Date</th>
              <th class="px-4 py-2 text-center text-sm font-semibold text-white">Status</th>
              <th class="px-4 py-2 text-center text-sm font-semibold text-white">Approver 1</th>
              <th class="px-4 py-2 text-center text-sm font-semibold text-white">Approver 2</th>
              <th class="px-4 py-2 text-center text-sm font-semibold text-white">Driver</th>
              <th class="px-4 py-2 text-center text-sm font-semibold text-white">Actions</th>
            </tr>
          </thead>

          <!-- Tabel Body -->
          <tbody>
            <tr v-for="(item, index) in reservations" :key="item.id">
              <td class="px-4 py-2 text-center text-sm text-gray-700">{{ index + 1 }}</td>

              <!-- User Name -->
              <td class="px-4 py-2 text-sm text-gray-700">{{ item.user?.name || 'N/A' }}</td>
              
              <!-- Vehicle Name -->
              <td class="px-4 py-2 text-sm text-gray-700">{{ item.vehicles?.name || 'N/A' }}</td>
              
              <!-- Start Date -->
              <td class="px-4 py-2 text-sm text-gray-700">{{ item.start_date }}</td>
              
              <!-- End Date -->
              <td class="px-4 py-2 text-sm text-gray-700">{{ item.end_date }}</td>
              
              <!-- Status -->
              <td class="px-4 py-2 text-sm bg-green-500 text-white" v-if="item.status === 'Approved'">{{ item.status }}</td>
              <td class="px-4 py-2 text-sm bg-error100 text-error" v-else-if="item.status === 'Declined'">{{ item.status }}</td>
              <td class="px-4 py-2 text-sm bg-gray-200 text-black" v-else="item.status === 'Waiting'">{{ item.status }}</td>

              <td class="px-4 py-2 text-sm text-gray-700">
                <div v-if="editingId === item.id">
                  <select v-model="item.approver1" class="mt-1 p-2 w-full border bg-gray-100 text-black border-gray-300 rounded-md">
                    <option v-for="approver in approvers" :key="approver.id" :value="approver.id">
                      {{ approver.name }}
                    </option>
                  </select>
                </div>
                <div v-else>
                  {{ item.approval_1?.name || 'N/A' }}
                </div>
              </td>

              <td class="px-4 py-2 text-sm text-gray-700">
                <div v-if="editingId === item.id">
                  <select v-model="item.approver2" class="mt-1 p-2 w-full border bg-gray-100 text-black border-gray-300 rounded-md">
                    <option v-for="approver in approvers" :key="approver.id" :value="approver.id">
                      {{ approver.name }}
                    </option>
                  </select>
                </div>
                <div v-else>
                  {{ item.approval_2?.name || 'N/A' }}
                </div>
              </td>

              <td class="px-4 py-2 text-sm text-gray-700">
                <div v-if="editingId === item.id && item.is_approved1 && item.is_approved2">
                  <select v-model="item.driver_id" class="mt-1 p-2 w-full border bg-gray-100 text-black border-gray-300 rounded-md">
                    <option v-for="driver in drivers" :key="driver.id" :value="driver.id">
                      {{ driver.name }}
                    </option>
                  </select>
                </div>
                <div v-else>
                  {{ item.driver?.name || 'Not Assigned' }}
                </div>
              </td>

              <!-- Actions -->
              <td class="px-4 py-2 text-sm text-gray-700 flex">
                <button @click="editingId === item.id ? updateReservation(item) : editingId = item.id" class="bg-blue-500 m-1 hover:bg-blue-700 text-white p-2 px-4">
                  {{ editingId === item.id ? 'Save' : 'Edit' }}
                </button>
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
