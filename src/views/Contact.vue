<script setup>
import { ref, onMounted } from 'vue';
import { supabase } from '../supabase';

const data = ref([]);

onMounted(async () => {
  const { data: companies } = await supabase.from('companies').select('name, tel');
  data.value = companies;
});
</script>

<template>
  <div class="flex-1 w-full">
    <h2 class="text-2xl font-extrabold text-start text-black pb-5">Contact</h2>
    <div class="overflow-x-auto w-full shadow-lg rounded-lg bg-white">
      <table class="w-full table-auto">
        <thead class="bg-primary">
          <tr>
            <th class="px-4 py-2 text-center text-sm font-semibold text-white">No</th>
            <th class="px-4 py-2 text-start text-sm font-semibold text-white">Name</th>
            <th class="px-4 py-2 text-start text-sm font-semibold text-white">Telephone</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, index) in data" :key="index" class="text-start">
            <td class="px-4 py-2 text-sm text-black text-center">{{ index + 1 }}</td>
            <td class="px-4 py-2 text-sm text-black">{{ item.name }}</td>
            <td class="px-4 py-2 text-sm text-black">{{ item.tel }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
