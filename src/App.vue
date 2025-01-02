<script setup>
import {supabase} from './supabase'
import router from './router/index'

  supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_IN' && router.currentRoute.value.path === '/login') {
    router.push('/'); 
  }
  if (event === 'SIGNED_OUT') {
    router.push('/login');
  }
});
</script>

<template>
  <RouterView/>
</template>
