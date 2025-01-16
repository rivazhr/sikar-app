<script setup>
import { ref, onMounted } from 'vue';
import { supabase } from '../supabase';

// State untuk menyimpan data
const reservations = ref([]);
const reservationsError = ref(null);
const userData = ref();

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
const fetchApprovers = async () => {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;

    if (user) {
      const { data: approvalsData, error: approvalsError } = await supabase
        .from('approvals')
        .select(`
          id,
          is_approved,
          reservation_id,
          reservations(
            id,
            start_date,
            end_date,
            fuel_consumption,
            user:users!user_id(name),
            vehicles(name, category)
          )
        `)
        .or(`approver_id.eq.${user.id}`)
        .order('created_at');

      if (approvalsError) throw approvalsError;

      // Map data approvals untuk memasukkan status berdasarkan is_approved
      reservations.value = approvalsData.map(approval => ({
        ...approval.reservations,
        approvalId: approval.id,
        status: approval.is_approved === null
          ? 'Waiting'
          : approval.is_approved
          ? 'Approved'
          : 'Declined',
      }));
    }
  } catch (error) {
    console.error('Error fetching approvals:', error.message);
    reservationsError.value = 'Terjadi kesalahan saat mengambil data approvals.';
  }
};

// Fungsi untuk memperbarui status reservations berdasarkan approvals
const updateReservationStatus = async (reservationId) => {
  try {
    const { data: approvals, error: approvalError } = await supabase
      .from('approvals')
      .select('is_approved')
      .eq('reservation_id', reservationId);

    if (approvalError) throw approvalError;

    if (approvals.every(approval => approval.is_approved === true)) {
      // Semua approval adalah true
      await supabase
        .from('reservations')
        .update({ status: 'Approved' })
        .eq('id', reservationId);
    } else if (approvals.some(approval => approval.is_approved === false)) {
      // Salah satu approval adalah false
      await supabase
        .from('reservations')
        .update({ status: 'Declined' })
        .eq('id', reservationId);
    }
  } catch (error) {
    console.error('Error updating reservation status:', error.message);
  }
};

// Fungsi untuk mengubah status approval
const changeStatus = async (reservationId, is_approved) => {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;

    const { error } = await supabase
      .from('approvals')
      .update({ is_approved })
      .eq('reservation_id', reservationId)
      .eq('approver_id', user.id);
    if (error) throw error;

    console.log('Approval status updated successfully');
    await updateReservationStatus(reservationId); 
    fetchApprovers(); 
  } catch (error) {
    console.error('Error changing status:', error.message);
  }
};

// Inisialisasi saat komponen dimuat
onMounted(async () => {
  await getUserRole();
  fetchApprovers();
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
              'text-black': item.status === 'Waiting',
            }">
              {{ item.status }}
            </td>
            <td class="px-4 py-2 text-sm text-gray-700">{{ item.fuel_consumption }}L</td>
            <td class="px-4 py-2 text-sm text-gray-700 flex-col">
              <button v-if="userData?.roles?.name === 'Manager' && item.status === 'Waiting'" 
                @click="changeStatus(item.id, true)" 
                class="bg-green-500 m-1 hover:bg-green-700 text-white p-2 px-4">
                Approve
              </button>
              <button v-if="userData?.roles?.name === 'Manager' && item.status === 'Waiting'" 
                @click="changeStatus(item.id, false)" 
                class="bg-red-500 m-1 hover:bg-red-700 text-white p-2 px-4">
                Decline
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <p v-if="reservationsError" class="text-red-500 mt-4">{{ reservationsError }}</p>
  </div>
</template>
