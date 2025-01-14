<script setup>
import { ref, onMounted } from 'vue';
import { supabase } from '../supabase';

// State untuk menyimpan data pengguna
const users = ref([]);
const usersError = ref(null);

// Fungsi untuk mengambil data users
const fetchUsers = async () => {
  const { data, error } = await supabase
    .from('users')
    .select('name, roles(name), companies(name)')
  
  if (error) {
    usersError.value = error;
  } else {
    users.value = data;
  }
};

// Fungsi untuk mengedit item
const editItem = (item) => {
  console.log('Edit item:', item);
};

// Ambil data saat komponen pertama kali dimuat
onMounted(fetchUsers);
</script>

<template>
  <div class="flex-1 w-full">
    <h2 class="text-2xl font-extrabold text-start text-black pb-5">Users</h2>
    <div class="overflow-x-auto w-full shadow-lg rounded-lg bg-white">
      <table class="w-full table-auto">
        <!-- Tabel Header -->
        <thead class="bg-primary">
          <tr>
            <th class="px-4 py-2 text-center text-sm font-semibold text-white">No</th>
            <th class="px-4 py-2 text-center text-sm font-semibold text-white">Name</th>
            <th class="px-4 py-2 text-center text-sm font-semibold text-white">Role</th>
            <th class="px-4 py-2 text-center text-sm font-semibold text-white">Company</th>
            <th class="px-4 py-2 text-center text-sm font-semibold text-white">Actions</th>
          </tr>
        </thead>

        <!-- Tabel Body -->
        <tbody>
          <!-- Menampilkan data users -->
          <tr v-for="(item, index) in users" :key="item.id">
            <td class="px-4 py-2 text-sm text-gray-700">{{ index + 1 }}</td>
            <td class="px-4 py-2 text-sm text-gray-700">{{ item.name }}</td>
            <td class="px-4 py-2 text-sm text-gray-700">{{ item.roles.name }}</td>
            <td class="px-4 py-2 text-sm text-gray-700">{{ item.companies.name }}</td>
            <td class="px-4 py-2 text-sm text-gray-700">
              <button @click="editItem(item)" class="bg-blue-500 hover:bg-blue-700 text-white p-2 px-4">Edit</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
  
</template>
