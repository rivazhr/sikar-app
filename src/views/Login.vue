<template>
  <div class="flex items-center justify-center w-full h-screen bg-primary p-5">
    <div class="flex flex-col md:flex-row w-full max-w-4xl bg-white shadow-lg rounded-lg overflow-hidden">
      <!-- Left Section -->
      <div class="flex flex-1 flex-col items-center justify-between p-10 bg-white">
        <div class="flex flex-col items-center text-black py-10">
          <img src="../assets/logo.svg" class="w-60 mb-6" alt="Logo" />
          <p class="text-gray-700 text-md font-semibold">
            Website Application to Manage Transportation Reservations for the Company
          </p>
        </div>
        <p class="text-primary">Rifa Fairuz Zahra</p>
      </div>

      <!-- Right Section -->
      <div class="flex flex-1 flex-col items-center justify-center bg-blue-100 p-10">
        <p class="text-2xl font-bold text-gray-800 mb-6 text-center">Login</p>
        <form
          class="w-full max-w-sm rounded-lg px-10 max-h-full"
          @submit.prevent="handleSignin"
        >
          <div class="mb-3">
            <label class="block text-gray-700 text-sm text-start font-bold mb-2" for="email">
              Email
            </label>
            <input
              class="w-full py-2 px-3 bg-gray-100 text-gray-700 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              id="email"
              type="email"
              placeholder="Enter your email"
              v-model="email"
            />
          </div>
          <div class="mb-6">
            <label class="block text-gray-700 text-start text-sm font-bold mb-2" for="password">
              Password
            </label>
            <input
              class="w-full py-2 px-3 bg-gray-100 text-gray-700 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              id="password"
              type="password"
              placeholder="Enter your password"
              v-model="password"
            />
          </div>
          <div class="flex justify-center">
            <button
              class="w-full bg-secondary hover:opacity-100 opacity-80 transition-opacity text-white font-bold py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline"
              type="submit"
            >
              Sign In
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import router from "../router/index";
import { supabase } from "../supabase";

const email = ref("");
const password = ref("");

const handleSignin = async () => {
  try {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.value,
      password: password.value,
    });
    if (error) throw error;

    const uid = (await supabase.auth.getUser()).data.user.id; 

    const { data: userData, error: queryError } = await supabase
      .from('users')
      .select('name, roles(name)')
      .eq('id', uid)
      .single(); 
    if(queryError) throw error

    if(userData.roles.name === 'Admin')
    router.push("/");
    else router.push("/approvals")
  } catch (error) {
    alert(error.error_description || error.message);
  }
};
</script>

<style scoped>
@media (max-width: 768px) {
  .flex-col {
    flex-direction: column !important;
  }
}
</style>
