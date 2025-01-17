<script setup>
import { ref, onMounted, watch } from 'vue';
import { supabase } from '../supabase';
import * as XLSX from 'xlsx';

// State untuk menyimpan data reservasi dan error
const reservations = ref([]);
const approverList = ref([]);
const reservationsError = ref(null);

// State untuk menyimpan data untuk dropdown
const approvers = ref([]);
const drivers = ref([]);

// State untuk edit data
const showDetailDialog = ref(false);
const showSelectApproversDialog = ref(false);
const showSelectDriverDialog = ref(false);
const detailReservation = ref(null);
const approverLevels = ref();
const selectedApprovers = ref([]);  
const selectedDriver = ref();  

// State untuk track perubahan status form
const showDialog = ref(false);
const newReservation = ref({
  vehicle_category: '', 
  vehicle_id: '', 
  start_date: '',
  end_date: '',
  status: 'Select Approvers',
  fuel_consumption: 0
});

// State untuk mengubah data
const isEditing = ref(false);
const hasApprovers = ref(false);

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
      driver:users!driver_id(name),
      approvals(id, is_approved) 
    `)
    .order('created_at');

  if (error) {
    console.error('Error fetching reservations data:', error.message);
  } else {
    reservations.value = data;
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
const fetchUsersForDrivers = async () => {
  const { data, error } = await supabase
    .from('users')
    .select('id, name')
    .eq('role_id', 3); 

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
        status: 'Select Approvers',
      })
      .select();

    if (reservationError) {
      console.error('Error inserting reservation:', reservationError.message);
      return;
    }
    
    // Perbarui data tabel
    await fetchReservations();
    showDialog.value = false;
  } catch (error) {
    console.error('Error adding reservation:', error);
  }
};

const fetchApprovers = async (itemId) => {
  const { data, error } = await supabase
    .from('approvals')
    .select('users(name), level, is_approved')
    .eq('reservation_id', itemId)
    .order('level');

  if (!error) {
    approverList.value = data;
  } 
};

// Handle opening detail dialog
const openDetailDialog = async (reservation) => {
  detailReservation.value = { ...reservation };
  selectedApprovers.value = []; 
  isEditing.value = false;
  
  // Ambil data approver dan perbarui hasApprovers
  await fetchApprovers(reservation.id);
  hasApprovers.value = approverList.value.length > 0;
  approverLevels.value = approverList.value.length;
  showDetailDialog.value = true;
};


// Handle open select approver dialog
const openSelectApproverDialog = async (reservation) => {
  detailReservation.value = { ...reservation };
  selectedApprovers.value = []; 
  isEditing.value = true;
  
  // Ambil data approver dan perbarui hasApprovers
  await fetchApprovers(reservation.id);
  hasApprovers.value = approverList.value.length > 0;
  approverLevels.value = approverList.value.length;
  showSelectApproversDialog.value = true;
};

// Handle open select approver dialog
const openSelectDriverDialog = async (reservation) => {
  detailReservation.value = { ...reservation };
  isEditing.value = true;
  
  showSelectDriverDialog.value = true;
};

// Watch for changes in approverLevels to update selectedApprovers
watch(approverLevels, (newVal) => {
  const diff = newVal - selectedApprovers.value.length;
  if (diff > 0) {
    selectedApprovers.value.push(...Array(diff).fill(null));
  } else if (diff < 0) {
    selectedApprovers.value.splice(diff);
  }
});

// Save the updated approvers and insert approvals
const saveEditedReservation = async () => {
  if (!detailReservation.value) return;

  // Validasi jumlah approver di antara 2 dan 5
  if (approverLevels.value < 2 || approverLevels.value > 5) {
    alert("Approver levels must be between 2 and 5");
    return; 
  }

  // Validasi untuk memastikan bahwa semua approvers yang dipilih tidak kosong
  if (selectedApprovers.value.some(approver => approver === null || approver === undefined)) {
    alert("Please select approvers for all levels.");
    return; 
  }

  try {
    // Update vehicle ID
    await supabase
      .from('reservations')
      .update({
        start_date: detailReservation.value.start_date,
        end_date: detailReservation.value.end_date,
        status: 'Waiting for Approvals'
      })
      .eq('id', detailReservation.value.id)

    // Update approvers
    for (let i = 0; i < approverLevels.value; i++) {
      const approverId = selectedApprovers.value[i];
      if (approverId) {
        await supabase.from('approvals').insert({
          reservation_id: detailReservation.value.id,
          level: i + 1,
          approver_id: approverId,
        });
      }
    }

    // Refresh data and close dialog
    await fetchReservations();
    showSelectApproversDialog.value = false;
    showDetailDialog.value = false;
  } catch (error) {
    console.error('Error saving edited reservation:', error);
  }
};

// Save the updated driver
const saveDriver = async () => {
  if (!detailReservation.value) return;

  // Validasi untuk memastikan bahwa semua approvers yang dipilih tidak kosong
  if (!selectedDriver.value) {
    alert("Please select driver.");
    return; 
  }

  try {
    // Update driver
    await supabase
      .from('reservations')
      .update({
        driver_id: selectedDriver.value
      })
      .eq('id', detailReservation.value.id)

    // Refresh data and close dialog
    await fetchReservations();
    showSelectDriverDialog.value = false;
    selectedDriver.value = null;
  } catch (error) {
    console.error('Error saving edited reservation:', error);
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
    fetchReservations();
  } catch (error) {
    console.error('Error deleting reservation:', error.message);
  }
};

// Method untuk load tabel ke Excel
const exportTableToExcel = () => {
  // Transform data dari reservations ke format JSON untuk ekspor
  const filteredData = reservations.value.map((item, index) => ({
    No: index + 1,
    "User Name": item.user?.name || 'N/A',
    "Vehicle Name": item.vehicles?.name || 'N/A',
    "Start Date": item.start_date,
    "End Date": item.end_date,
    Status: item.status,
    Driver: item.driver?.name || 'N/A'
  }));
  const ws = XLSX.utils.json_to_sheet(filteredData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Reservations');

  XLSX.writeFile(wb, 'reservations.xlsx');
};


// Watch untuk memonitor perubahan kategori kendaraan dan memperbarui filteredVehicles
watch(() => newReservation.value.vehicle_category, filterVehicles);

// Ambil data saat komponen pertama kali dimuat
onMounted(() => {
  fetchReservations();
  fetchVehicles();
  fetchUsersForApprovers();
  fetchUsersForDrivers();
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
      <button v-if="reservations" @click="exportTableToExcel" class="md:bg-green-500 bg-transparent opacity-90 hover:opacity-100 md:py-2 md:px-4 p-2 rounded mb-4">
        <img src="../assets/icon-excel.svg" class="max-w-7 inline md:hidden" alt=""/>
        <p class="text-white font-semibold hidden md:inline">Export to Excel</p>
      </button>
    </div>

    <!-- Add Dialog -->
    <div v-if="showDialog" class="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-50">
      <div class="bg-white rounded-lg shadow-lg p-6 w-4/5 min-h-fit h-3/4 sm:w-2/5 text-start text-black">
        <h2 class="text-xl font-bold mb-4 text-black text-center">Add Reservation</h2>
        <div class="overflow-y-auto max-h-[70%] ps-5 pt-5 pe-5 mb-5 md:mb-0">
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
            <div class="mb-4 md:flex md:space-x-4">
              <div class="w-full md:mb-0 mb-4">
                <label for="start_date" class="block text-sm font-medium text-gray-700">Start Date<span class="text-error"> (*)</span></label>
                <input v-model="newReservation.start_date" id="start_date" type="date" class="mt-1 p-2 w-full border bg-gray-100 text-black border-gray-300 rounded-md" required />
              </div>
              <div class="w-full">
                <label for="end_date" class="block text-sm font-medium text-gray-700">End Date<span class="text-error"> (*)</span></label>
                <input v-model="newReservation.end_date" id="end_date" type="date" class="mt-1 p-2 w-full border bg-gray-100 text-black border-gray-300 rounded-md" required />
              </div>
            </div>
          </form>
        </div>
        <div class="text-error mb-3 ps-5">(*) is required</div>
        <div class="flex justify-end">
          <button type="button" @click="showDialog = false" class="mr-2 text-gray-500 bg-gray-200 hover:bg-gray-300">
            Cancel
          </button>
          <button type="submit" @click="addReservation" class="bg-primary text-white py-2 px-4 rounded opacity-90 hover:opacity-100">
            Save
          </button>
        </div>
      </div>
    </div>

    <!-- Detail Dialog -->
    <div v-if="showDetailDialog" class="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-50">
      <div class="bg-white rounded-lg shadow-lg p-6 w-4/5 min-h-fit h-3/4 sm:w-2/5 text-start text-black">
        <h2 class="text-xl font-bold mb-4 text-black text-center">Reservation Details</h2>
        
        <!-- Scrollable Content -->
        <div class="overflow-y-scroll max-h-[70%] p-5">
          <!-- User -->
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700">User</label>
            <p class="mt-1 p-2 w-full bg-gray-100 text-black border-gray-300 rounded-md">{{ detailReservation?.user?.name || 'N/A' }}</p>
          </div>
          
          <!-- Vehicle -->
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700">Vehicle</label>
            <p class="mt-1 p-2 w-full bg-gray-100 text-black border-gray-300 rounded-md">{{ detailReservation?.vehicles?.name || 'N/A' }}</p>
          </div>

          <div class="mb-4 flex">
            <div class="w-full me-3">
              <!-- Start Date -->
              <label class="block text-sm font-medium text-gray-700">Start Date</label>
              <input v-if="isEditing" v-model="detailReservation.start_date" type="date" class="mt-1 p-2 w-full border bg-gray-100 text-black border-gray-300 rounded-md" />
              <p v-else class="mt-1 p-2 w-full bg-gray-100 text-black border-gray-300 rounded-md">{{ detailReservation?.start_date }}</p>
            </div>
            <!-- End Date -->
            <div class="w-full">
              <label class="block text-sm font-medium text-gray-700">End Date</label>
              <input v-if="isEditing" v-model="detailReservation.end_date" type="date" class="mt-1 p-2 w-full border bg-gray-100 text-black border-gray-300 rounded-md" />
              <p v-else class="mt-1 p-2 w-full bg-gray-100 text-black border-gray-300 rounded-md">{{ detailReservation?.end_date }}</p>
            </div>
          </div>

          <!-- Driver -->
          <div class="mb-4" v-if="detailReservation.driver">
            <label class="block text-sm font-medium text-gray-700">Driver</label>
            <p class="mt-1 p-2 w-full bg-gray-100 text-black border-gray-300 rounded-md">{{ detailReservation?.driver.name }}</p>
          </div>
          
          <!-- Approver Levels -->
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700">Number of Approver Levels</label>
            <input 
              v-if="isEditing" 
              v-model.number="approverLevels" 
              type="number" 
              min="2" 
              max="5"
              class="mt-1 p-2 w-full border bg-gray-100 text-black border-gray-300 rounded-md" 
            />
            <p v-else class="mt-1 p-2 w-full bg-gray-100 text-black border-gray-300 rounded-md">{{ approverLevels }}</p>
          </div>
          
          <!-- Approvers -->
          <!-- Tampilkan nama approver jika tidak sedang edit -->
          <div v-if="!isEditing" v-for="(approver, index) in approverList" :key="index" class="mb-4">
            <label :for="'approver-' + approver.level" class="text-sm font-medium flex flex-row items-center mb-2 text-gray-700">
              <div class="w-fit me-3">Approver {{ approver.level }}</div>
              <div>
                <p v-if="approver.is_approved === null" class="w-full p-1 px-3 text-xs bg-gray-200 text-black border-gray-300 rounded-full">{{ 'Waiting for Approvals' }}</p>
                <p v-else-if="approver.is_approved === true" class="w-full p-1 px-3 text-xs bg-green-200 text-green-600 border-gray-300 rounded-full">{{ 'Approved' }}</p>
                <p v-else class="w-full p-1 px-3 text-xs bg-red-200 text-red-600 border-gray-300 rounded-full">{{ 'Declined' }}</p>
              </div>
            </label>
            <p class="mt-1 me-3 p-2 w-full bg-gray-100 text-black border-gray-300 rounded-md">{{ approver.users.name || 'Not Assigned' }}</p>
          </div>
          <!-- Tampilkan dropdown saat edit -->
          <div v-else v-for="(level, index) in approverLevels" :key="'approver-level-' + index" class="mb-4">
            <label :for="'approver-' + (index + 1)" class="text-sm font-medium text-gray-700">
              Approver {{ level }}
            </label>
            <select
              v-model="selectedApprovers[index]"
              :id="'approver-' + (index + 1)"
              class="mt-1 p-2 w-full border bg-gray-100 text-black border-gray-300 rounded-md"
            required>
              <option :value="null">Select Approver</option>
              <option v-for="approver in approvers" :key="approver.id" :value="approver.id">
                {{ approver.name }}
              </option>
            </select>
          </div>

        </div>
        
        <!-- Actions -->
        <div class="flex justify-end mt-4">
          <button v-if="hasApprovers" class="hidden"></button>
          <button v-else-if="isEditing" @click="saveEditedReservation" class="bg-green-600 hover:bg-green-800 text-white me-2 py-2 px-4 rounded">Save</button>
          <button v-else @click="isEditing = true" class="bg-primary opacity-90 hover:opacity-100 text-white me-2 py-2 px-4 rounded">Select Approvers</button>
          <button @click="showDetailDialog = false" class="bg-gray-200 hover:bg-gray-300 text-gray-500 py-2 px-4 rounded">Close</button>
        </div>
      </div>
    </div>

    <!-- Select Approvers Dialog -->
    <div v-if="showSelectApproversDialog" class="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-50">
      <div class="bg-white h-fit max-h-[70%] rounded-lg shadow-lg p-6 w-4/5 sm:w-2/5 text-start text-black flex flex-col">
        <!-- Title -->
        <h2 class="text-xl font-bold mb-4 text-black text-center">Select Approvers</h2>
        
        <!-- Scrollable Content -->
        <div class="flex-shrink overflow-y-auto p-5">
          <!-- Approver Levels -->
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700">Number of Approver Levels</label>
            <input 
              v-if="isEditing" 
              v-model.number="approverLevels" 
              type="number" 
              min="2" 
              max="5"
              class="mt-1 p-2 w-full border bg-gray-100 text-black border-gray-300 rounded-md" 
            />
            <p v-else class="mt-1 p-2 w-full bg-gray-100 text-black border-gray-300 rounded-md">{{ approverLevels }}</p>
          </div>
          
          <!-- Approvers -->
          <div v-for="(level, index) in approverLevels" :key="'approver-level-' + index" class="mb-4">
            <label :for="'approver-' + (index + 1)" class="text-sm font-medium text-gray-700">
              Approver {{ level }}
            </label>
            <select
              v-model="selectedApprovers[index]"
              :id="'approver-' + (index + 1)"
              class="mt-1 p-2 w-full border bg-gray-100 text-black border-gray-300 rounded-md"
              required
            >
              <option :value="null">Select Approver</option>
              <option v-for="approver in approvers" :key="approver.id" :value="approver.id">
                {{ approver.name }}
              </option>
            </select>
          </div>
        </div>
        
        <!-- Actions -->
        <div class="flex justify-end mt-4">
          <button v-if="isEditing" @click="saveEditedReservation" class="bg-green-600 hover:bg-green-800 text-white me-2 py-2 px-4 rounded">Save</button>
          <button @click="showSelectApproversDialog = false" class="bg-gray-200 hover:bg-gray-300 text-gray-500 py-2 px-4 rounded">Close</button>
        </div>
      </div>
    </div>


    <!-- Select Driver Dialog -->
    <div v-if="showSelectDriverDialog" class="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-50">
      <div class="bg-white min-h-fit rounded-lg shadow-lg p-6 w-4/5 sm:w-2/5 text-start text-black">
        <h2 class="text-xl font-bold mb-4 text-black text-center">Select Driver</h2>
  
        <div class="flex-grow overflow-y-auto p-5">
          <!-- Drivers -->
          <label :for="'driver'" class="text-sm font-medium text-gray-700">Driver</label>
          <select
            v-model="selectedDriver"
            :id="'approver-' + (index + 1)"
            class="mt-1 p-2 w-full border bg-gray-100 text-black border-gray-300 rounded-md"
          required>
            <option :value="null">Select Driver</option>
            <option v-for="driver in drivers" :key="driver.id" :value="driver.id">
              {{ driver.name }}
            </option>
          </select>
        </div>
        
        <!-- Actions -->
        <div class="flex justify-end mt-4">
          <button v-if="isEditing" @click="saveDriver" class="bg-green-600 hover:bg-green-800 text-white me-2 py-2 px-4 rounded">Save</button>
          <button @click="showSelectDriverDialog = false" class="bg-gray-200 hover:bg-gray-300 text-gray-500 py-2 px-4 rounded">Close</button>
        </div>
      </div>
    </div>

    <!-- Tabel reservasi -->
    <div class="w-full overflow-x-auto flex-grow rounded-lg" v-if="reservations">
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
              <td class="px-4 py-2 text-sm bg-gray-200 text-black" v-else-if="item.status === 'Waiting for Approvals'">{{ item.status }}</td>
              <td @click="openSelectApproverDialog(item)" class="cursor-pointer px-4 py-2 text-sm bg-blue-200 text-black" v-else-if="item.status === 'Select Approvers'">{{ item.status }}</td>
              <td class="px-4 py-2 text-sm bg-blue-200 text-black" v-else>{{ item.status }}</td>
              
              <!-- Driver -->
              <td v-if="item.driver" class="px-4 py-2 text-sm text-black bg-green-100">{{ item.driver.name }}</td>
              <td v-else-if="item.status === 'Approved'" @click="openSelectDriverDialog(item)" class="cursor-pointer px-4 py-2 text-sm bg-blue-200 text-black">Select Driver</td>
              <td v-else class="px-4 py-2 text-sm text-gray-700">Not Assigned</td>

              <!-- Actions -->
              <td class="px-4 py-2 text-sm text-gray-700 flex justify-center">
                <button @click="openDetailDialog(item)" class="bg-blue-500 m-1 hover:bg-blue-700 text-white p-2 px-4">Detail</button>
                <button @click="deleteItem(item.id)" class="bg-red-500 m-1 hover:bg-red-700 text-white p-2 px-4">Delete</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    <div class="w-full flex-grow text-gray-600 my-auto" v-else>
      <p>No reservations found</p>
    </div>
  </div>
</template>