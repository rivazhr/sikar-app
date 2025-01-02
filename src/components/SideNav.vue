<script setup>
import router from '../router'
import { supabase } from '../supabase'  
import NavMenu from './NavMenu.vue'  

// Menu items data
const menuItems = [
  { icon: '/src/assets/icon-dashboard.svg', label: 'Dashboard', link: '/' },
  { icon: '/src/assets/icon-users.svg', label: 'Users', link: '/users' },
  { icon: '/src/assets/icon-reservations.svg', label: 'Reservations', link: '/reservations' },
  { icon: '/src/assets/icon-reservations.svg', label: 'Approvals', link: '/approvals' },
  { icon: '/src/assets/icon-vehicles.svg', label: 'Vehicles', link: '/vehicles' },
]

const menuOthers = [
  { icon: '/src/assets/icon-schedule.svg', label: 'Schedule', link: '/schedule' },
  { icon: '/src/assets/icon-todo.svg', label: 'To-Do', link: '#todo' },
  { icon: '/src/assets/icon-contact.svg', label: 'Contact', link: '#contact' },
]

const menuOpt = [
  { icon: '/src/assets/icon-settings.svg', label: 'Settings', link: '#settings' },
]

defineProps({
  logo: String,  
  msg: String, 
  role: String,
})

async function signOut() {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Logout error:', error.message);
      return;
    }
    await router.push('/login'); 
  } catch (err) {
    console.error('Unexpected error during sign out:', err);
  }
}
</script>

<template>
  <nav class="bg-white menu sm:p-4 w-64 sm:w-fit h-l00vh z-50 flex flex-col items-center">
    <!-- Logo Section -->
    <router-link class="flex sm:w-fit justify-center mt-8" :to="{ name: 'Dashboard' }">
      <img :src="logo" alt="Logo" class="hidden sm:block w-full max-w-28" />
      <img src="../assets/logo-shrink.svg" alt="Logo" class="block sm:hidden w-full max-w-[30px]" />
    </router-link>

    <!-- Main Menu -->
    <div class="mt-8 flex-grow sm:w-fit">
      <!-- Admin sees all menu items -->
      <ul v-if="role === 'Admin'">
        <NavMenu 
          v-for="(item, index) in menuItems.filter(item => item.label !== 'Approvals')" 
          :key="index" 
          :label="item.label" 
          :link="item.link" 
          :icon="item.icon"
        />
      </ul>

      <!-- Manager sees only Reservations menu item -->
      <ul v-if="role === 'Manager'">
        <NavMenu 
          v-for="(item, index) in menuItems.filter(item => item.label === 'Approvals')" 
          :key="index" 
          :label="item.label" 
          :link="item.link" 
          :icon="item.icon"
        />
      </ul>
      
      <ul v-if="role === 'Admin'">
        <div class="relative flex py-5 items-center">
          <div class="flex-grow border-t border-gray-400"></div>
        </div>
        <NavMenu 
          v-for="(item, index) in menuOthers" 
          :key="index" 
          :label="item.label" 
          :link="item.link" 
          :icon="item.icon"
        />
      </ul>
    </div>

    <!-- Bottom Menu (Settings & Logout) -->
    <div class="mt-8 w-full">
      <div class="relative flex py-5 items-center">
        <div class="flex-grow border-t border-gray-400"></div>
      </div>
      
      <!-- Settings & Logout available for both Admin and Manager -->
      <ul>
        <NavMenu 
          v-for="(item, index) in menuOpt" 
          :key="index" 
          :label="item.label" 
          :link="item.link" 
          :icon="item.icon"
        />
        <li>
          <button @click="signOut" type="submit" class="logout hover:bg-error p-4 w-full bg-error100 rounded-md px-4 py-3 sm:p-4 flex items-center text-error transition-all font-semibold hover:text-error100">
            <img src="/src/assets/icon-logout.svg" class="me-0 sm:me-2" alt="Logout Icon" />
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
</style>
