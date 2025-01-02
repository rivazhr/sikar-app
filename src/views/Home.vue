<script setup>
import { ref } from 'vue';
import { supabase } from '../supabase';
import SideNav from '../components/SideNav.vue';
import NavBar from '../components/NavBar.vue';

// Menyimpan data pengguna
const user = ref(null);

const getUserData = async () => {
  const { data, error: authError } = await supabase.auth.getUser();
  if (authError || !data) {
    console.log('Pengguna belum login');
    return;
  }

  const uid = data.user.id; 

  const { data: userData, error: queryError } = await supabase
    .from('users')
    .select('name, roles(name)')
    .eq('id', uid)
    .single(); 

  if (queryError) {
    console.error('Error:', queryError);
  } else {
    user.value = userData
  }
};

getUserData();
</script>

<template>
  <div v-if="user" class="flex w-full h-screen">
    <SideNav :role="user.roles.name" logo="src/assets/logo.svg" class="sticky top-0 left-0 h-screen w-fit border-r overflow-y-auto hide-scrollbar border-gray-400" />
    <div class="flex-1 bg-grey overflow-y-auto ml-1/5">
      <NavBar :name="user.name" :role="user.roles.name"/>
      <div class="main-content flex w-full p-10">
        <router-view />
      </div>
    </div>
  </div>

  <div v-else class="flex justify-center items-center h-screen">
    <p>Loading...</p>
  </div>
</template>


<style scoped>
.hide-scrollbar {
  scrollbar-width: none;
  -ms-overflow-style: none;
  overflow-y: auto; 
}

.hide-scrollbar::-webkit-scrollbar {
  display: none; 
}
</style>
