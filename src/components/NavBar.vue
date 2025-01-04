<script setup>
import SearchBar from './SearchBar.vue'
import { useRoute } from 'vue-router';

// Mengakses rute saat ini
const route = useRoute();

defineProps({
  name: String,
  role: String, 
})
</script>
<template>
  <nav class="sticky top-0 w-full bg-white p-6 shadow-sm flex items-center justify-between z-10">
    <!-- Kiri: Hamburger & SearchBar -->
    <div class="flex items-center space-x-4">
      <a @click="" href="">
        <img src="../assets/hamburger.svg" alt="Hamburger Menu" />
      </a>
      <SearchBar class="text-sm" />
      <router-link v-if="role !== 'Manager'" class="bg-primary rounded-full min-w-fit aspect-square sm:aspect-auto w-fit flex items-center p-2 sm:py-2 sm:px-4" :to="{ name: 'Reservations' }">
        <img src="../assets/add.svg" alt="Icon" class="h-fit inline" />
        <p class="md:inline hidden opacity-90 hover:opacity-100 text-white">New Reservations</p>
      </router-link>
    </div>

    <!-- Kanan: Profile -->
    <div class="flex items-center space-x-4">
      <a @click="" class="ps-4 inline-flex items-center" href="">
        <img src="../assets/photo-user.svg" class="h-full" alt="Photo" />
        <span class="ms-3 hidden lg:inline flex-row text-start text-black text-sm px-2">
          <h6 id="name" class="font-bold">{{ name }}</h6>
          <p id="role" class="text-xs">{{ role }}</p>
        </span>
        <div class="rounded-full flex ms-3 aspect-square hover:bg-slate-200 p-0">
          <img src="../assets/chevron-down.svg" class="w-full h-full" alt="" />
        </div>
      </a>
    </div>
  </nav>
</template>
