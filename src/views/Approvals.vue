<script setup>
import { ref, onMounted } from 'vue';
import { supabase } from '../supabase';

// State untuk menyimpan data
const reservations = ref([]);
const reservationsError = ref(null);
const userData = ref(null);

// Ambil data user dan role
const getUserRole = async () => {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;

    if (user) {
      const { data, error } = await supabase
        .from('users')
        .select('roles(name)')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      userData.value = data;
    }
  } catch (error) {
    console.error('Error fetching user or role:', error.message);
    reservationsError.value = 'Terjadi kesalahan saat mengambil data user atau role.';
  }
};

// Ambil data reservasi dan approval
const fetchReservations = async () => {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;

    if (user) {
      const { data: approvalsData, error: approvalsError } = await supabase
        .from('approvals')
        .select(`
          id,
          reservation_id,
          approver_1:users!approver1(name),
          approver_2:users!approver2(name)
        `)
        .or(`approver1.eq.${user.id},approver2.eq.${user.id}`);

      if (approvalsError) throw approvalsError;

      const { data: reservationsData, error: reservationsError } = await supabase
        .from('reservations')
        .select(`
          id,
          start_date,
          end_date,
          status,
          fuel_consumption,
          user:users!user_id(name),
          vehicles(name, category)
        `);
        
      if (reservationsError) throw reservationsError;

      // Gabungkan data approvals dan reservations
      reservations.value = (reservationsData || []).map(reservation => {
        const approval = (approvalsData || []).find(a => a.reservation_id === reservation.id);
        return {
          ...reservation,
          approval_1: approval?.approver_1 || null,
          approval_2: approval?.approver_2 || null,
        };
      });
    }
  } catch (error) {
    console.error('Error fetching reservations:', error.message);
    reservationsError.value = 'Terjadi kesalahan saat mengambil data reservasi.';
  }
};

// Fungsi untuk mengubah status reservasi
const changeStatus = async (id, status) => {
  try {
    const { error } = await supabase
      .from('reservations')
      .update({ status })
      .eq('id', id);

    if (error) throw error;

    console.log('Status updated successfully');
    fetchReservations();
  } catch (error) {
    console.error('Error changing status:', error.message);
  }
};

// Fungsi untuk menghapus item
const deleteItem = async (id) => {
  try {
    const { error } = await supabase
      .from('reservations')
      .delete()
      .eq('id', id);

    if (error) throw error;

    console.log('Item deleted successfully');
    fetchReservations();
  } catch (error) {
    console.error('Error deleting item:', error.message);
  }
};

// Inisialisasi saat komponen dimuat
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
            <td class="px-4 py-2 text-sm text-gray-700">{{ item.user.name }}</td>
            <td class="px-4 py-2 text-sm text-gray-700">{{ item.vehicles.name }}</td>
            <td class="px-4 py-2 text-sm text-gray-700">{{ item.vehicles.category }}</td>
            <td class="px-4 py-2 text-sm text-gray-700">{{ item.start_date }}</td>
            <td class="px-4 py-2 text-sm text-gray-700">{{ item.end_date }}</td>
            <td class="px-4 py-2 text-sm" :class="{
              'bg-green-500 text-white': item.status === 'Approved',
              'bg-red-500 text-white': item.status === 'Declined',
            }">
              {{ item.status }}
            </td>
            <td class="px-4 py-2 text-sm text-gray-700">{{ item.fuel_consumption }}L</td>
            <td class="px-4 py-2 text-sm text-gray-700 flex-col">
              <button v-if="userData?.roles?.name === 'Manager' && item.status === 'Waiting'" 
                @click="changeStatus(item.id, 'Approved')" 
                class="bg-green-500 m-1 hover:bg-green-700 text-white p-2 px-4">
                Approve
              </button>
              <button v-if="userData?.roles?.name === 'Manager' && item.status === 'Waiting'" 
                @click="changeStatus(item.id, 'Declined')" 
                class="bg-red-500 m-1 hover:bg-red-700 text-white p-2 px-4">
                Decline
              </button>
              <button v-if="userData?.roles?.name === 'Admin'" 
                @click="deleteItem(item.id)" 
                class="bg-red-500 m-1 hover:bg-red-700 text-white p-2 px-4">
                Delete
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <p v-if="reservationsError" class="text-red-500 mt-4">{{ reservationsError }}</p>
  </div>
</template>
