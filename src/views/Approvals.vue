<script setup>
import { ref, onMounted } from 'vue';
import { supabase } from '../supabase';

// State untuk menyimpan data reservasi dan error
const reservations = ref([]);
const reservationsError = ref(null);
const userData = ref(null);

// Ambil data user dan role
const getUserRole = async () => {
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError) {
    console.error('Error fetching user:', userError.message);
    reservationsError.value = 'Terjadi kesalahan saat mengambil data user.';
    return;
  }

  if (user) {
    const { data, error } = await supabase
      .from('users')
      .select('roles(name)')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('Error fetching user role:', error.message);
      reservationsError.value = 'Terjadi kesalahan saat mengambil data role.';
    } else {
      userData.value = data;
    }
  }
};

// Fungsi untuk mengambil data reservations
const fetchReservations = async () => {
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError) {
    console.error('Error fetching user:', userError.message);
    reservationsError.value = 'Terjadi kesalahan saat mengambil data user.';
    return;
  }

  if (user) {
    const { data, error } = await supabase
      .from('approvals')
      .select(`
        id,
        reservations (
          id, 
          start_date,
          end_date,
          status,
          fuel_consumption,
          users (
            name
          ),
          vehicles (
            name,
            category
          )
        )
      `)
      .or(`approver1.eq.${user.id},approver2.eq.${user.id}`);

    if (error) {
      console.error('Error fetching reservations:', error.message);
      reservationsError.value = 'Terjadi kesalahan saat mengambil data reservasi.';
    } else {
      reservations.value = data;
    }
  }
};

// Fungsi untuk mengubah status reservasi (Approve / Decline)
const changeStatus = async (id, status) => {
  const { error } = await supabase
    .from('reservations')
    .update({ status })
    .eq('id', id);

  if (error) {
    console.error('Error changing status:', error.message);
  } else {
    console.log('Status updated successfully');
    fetchReservations(); 
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

// Ambil data user role dan reservasi saat komponen pertama kali dimuat
onMounted(async () => {
  await getUserRole();
  fetchReservations();
});
</script>

<template>
  <div class="w-full flex-grow rounded-lg">
    <h2 class="text-2xl font-extrabold text-start text-black pb-5">Approvals</h2>
    <div class="shadow-lg flex rounded-lg bg-white overflow-x-auto">
      <table class="w-full table-auto">
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
            <td class="px-4 py-2 text-sm text-gray-700">{{ item.reservations.users.name }}</td>
            <td class="px-4 py-2 text-sm text-gray-700">{{ item.reservations.vehicles.name }}</td>
            <td class="px-4 py-2 text-sm text-gray-700">{{ item.reservations.vehicles.category }}</td>
            <td class="px-4 py-2 text-sm text-gray-700">{{ item.reservations.start_date }}</td>
            <td class="px-4 py-2 text-sm text-gray-700">{{ item.reservations.end_date }}</td>
            <td class="px-4 py-2 text-sm bg-green-500 text-white" v-if="item.reservations.status === 'Approved'">{{ item.reservations.status }}</td>
            <td class="px-4 py-2 text-sm bg-red-500 text-white" v-else-if="item.reservations.status === 'Declined'">{{ item.reservations.status }}</td>
            <td class="px-4 py-2 text-sm text-gray-700" v-else>{{ item.reservations.status }}</td>
            <td class="px-4 py-2 text-sm text-gray-700">{{ item.reservations.fuel_consumption }}L</td>
            <td class="px-4 py-2 text-sm text-gray-700 flex-col" v-if="item.reservations.status==='Waiting'">
              <button v-if="userData?.roles?.name === 'Manager' && item.reservations.status !== 'Approved'" @click="changeStatus(item.reservations.id, 'Approved')" class="bg-green-500 m-1 hover:bg-green-700 text-white p-2 px-4">Approve</button>
              <button v-if="userData?.roles?.name === 'Manager' && item.reservations.status !== 'Declined'" @click="changeStatus(item.reservations.id, 'Declined')" class="bg-red-500 m-1 hover:bg-red-700 text-white p-2 px-4">Decline</button>
              <button v-if="userData?.roles?.name === 'Admin'" @click="deleteItem(item.reservations.id)" class="bg-red-500 m-1 hover:bg-red-700 text-white p-2 px-4">Delete</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <p v-if="reservationsError" class="text-red-500 mt-4">{{ reservationsError }}</p>
  </div>
</template>
