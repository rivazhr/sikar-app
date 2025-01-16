<script setup>
import router from '../router'
import { supabase } from '../supabase'  
import NavMenu from './NavMenu.vue'  

// Data menu utama yang akan ditampilkan
const menuItems = [
  { icon: '/assets/icon-dashboard', label: 'Dashboard', link: '/' },
  { icon: '/assets/icon-reservations', label: 'Reservations', link: '/reservations' },
  { icon: '/assets/icon-todo', label: 'To-Do', link: '/todo' },
  { icon: '/assets/icon-reservations', label: 'Approvals', link: '/approvals' },
]

// Data menu tambahan yang bisa diakses di bagian "OTHERS"
const menuOthers = [
  { icon: '/assets/icon-users', label: 'Users', link: '/users' },
  { icon: '/assets/icon-vehicles', label: 'Vehicles', link: '/vehicles' },
  { icon: '/assets/icon-schedule', label: 'Schedule', link: '/schedule' },
  { icon: '/assets/icon-contact', label: 'Contact', link: '/contact' },
]

// Data menu untuk pengaturan dan logout
const menuOpt = [
  { icon: '/assets/icon-settings', label: 'Settings', link: '#settings' },
]

// Menerima properti dari komponen induk
defineProps({
  logo: String,  
  msg: String, 
  role: String,
})

// Fungsi untuk logout
async function signOut() {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Logout error:', error.message);
      return;
    }
    await router.push('/login'); 
  } catch (err) {
    console.error('Terjadi kesalahan saat logout:', err);
  }
}
</script>

<template>
  <nav class="bg-white menu sm:p-4 w-64 sm:w-fit h-l00vh z-50 flex flex-col items-center">
    <!-- Bagian Logo -->
    <router-link class="flex sm:w-fit justify-center mt-8" :to="{ name: 'Dashboard' }">
      <img src="../assets/logo.svg" alt="Logo" class="hidden sm:block w-full max-w-28" />
      <img src="../assets/logo-shrink.svg" alt="Logo" class="block sm:hidden w-full max-w-[30px]" />
    </router-link>

    <!-- Menu Utama -->
    <div class="mt-8 flex-grow sm:w-fit">
      <!-- Menu untuk Admin, Admin melihat semua menu -->
      <ul v-if="role === 'Admin'">
        <NavMenu 
          v-for="(item, index) in menuItems.filter(item => item.label !== 'Approvals' && item.label !== 'To-Do')" 
          :key="index" 
          :label="item.label" 
          :link="item.link" 
          :icon="item.icon"
        />
      </ul>

      <!-- Menu untuk Manager, Manager hanya melihat Approvals dan To-Do -->
      <ul v-if="role === 'Manager'">
        <NavMenu 
          v-for="(item, index) in menuItems.filter(item => item.label === 'Approvals' || item.label === 'To-Do')" 
          :key="index" 
          :label="item.label" 
          :link="item.link" 
          :icon="item.icon"
        />
      </ul>
      
      <!-- Menu "MANAGEMENTS" hanya untuk Admin -->
      <ul v-if="role === 'Admin'">
        <div class="relative flex py-3 items-center">
          <div class="flex-grow border-t border-gray-400"></div>
        </div>
        <div class="hidden sm:flex text-gray-500 text-xs font-semibold text-start px-4 my-1">MANAGEMENT</div>
        <NavMenu 
          v-for="(item, index) in menuOthers" 
          :key="index" 
          :label="item.label" 
          :link="item.link" 
          :icon="item.icon"
        />
      </ul>
    </div>

    <!-- Menu Bawah (Pengaturan & Logout) -->
    <div class="w-full">
      <div class="relative flex py-5 items-center">
        <div class="flex-grow border-t border-gray-400"></div>
      </div>
      <div class="hidden sm:flex text-gray-500 text-xs font-semibold text-start px-4 my-1">PREFERENCES</div>
      <!-- Menu Pengaturan & Logout tersedia untuk Admin dan Manager -->
      <ul>
        <NavMenu 
          v-for="(item, index) in menuOpt" 
          :key="index" 
          :label="item.label" 
          :link="item.link" 
          :icon="item.icon"
        />
        <li>
          <!-- Tombol Logout -->
          <button @click="signOut" type="submit" class="logout hover:bg-error hover:text-red-100 p-4 w-full bg-error100 rounded-md px-4 py-3 sm:p-4 flex items-center text-error transition-all font-semibold">
            <!-- Gambar logout -->
            <img src="/src/assets/icon-logout.svg" class="logout-icon me-0 sm:me-2" alt="Logout Icon" />
            <span class="hidden sm:inline">Logout</span>
          </button>
        </li>
      </ul>
    </div>
  </nav>
</template>

<style scoped>
.logout{
  min-width: 50px;
}

.menu {
min-width: fit-content;
}

.logout-icon {
  transition: all 0.3s ease;
}

.logout:hover .logout-icon {
  content: url('/src/assets/icon-logout-active.svg');
}
</style>