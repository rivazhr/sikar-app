<script setup>
import { ref } from 'vue';

const isFocused = ref(false);

function handleFocus() {
  isFocused.value = true;
}

function handleBlur() {
  isFocused.value = false;
}
</script>

<template>
  <div 
    :class="{'border-2': isFocused, 'border-primary': isFocused, 'border-gray-400': !isFocused}"
    class="flex items-center border-2 bg-gray-100 text-gray-400 px-4 py-2 mx-4 rounded-full transition-all">
    
    <img src="../assets/search.svg" class="h-5 w-5 mr-2 flex-shrink-0" alt="Search Icon" />
    <input type="text" placeholder="Search" class="bg-transparent border-none outline-none text-gray-500 focus:text-black flex-grow" @focus="handleFocus" @blur="handleBlur"/>
  </div>
</template>
