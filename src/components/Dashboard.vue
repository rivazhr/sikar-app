<template>
  <!-- Konten Dashboard -->
  <div class="flex-row w-full justify-start">
    <h2 class="text-2xl font-extrabold text-start text-black pb-5">Dashboard</h2>
    <div class="grid grid-cols-3 gap-4">
      <div class="w-full h-full p-5 bg-white shadow-sm rounded-lg">
        <Card icon="src/assets/dashboard-users.svg" label="Total User" percentage="8.5%" percentageIcon="/src/assets/dashboard-up.svg" :value="String(userCount)"></Card>
      </div>
      <div class="w-full h-full p-5 bg-white shadow-sm rounded-lg">
        <Card icon="src/assets/dashboard-reservations.svg" label="Total Reservations" percentage="8.5%" percentageIcon="/src/assets/dashboard-up.svg" :value="String(reservationCount)"></Card>
      </div>
      <div class="w-full h-full p-5 bg-white shadow-sm rounded-lg">
        <Card icon="src/assets/dashboard-vehicles.svg" label="Total Rented Vehicles" percentage="8.5%" percentageIcon="/src/assets/dashboard-up.svg" :value="String(vehicleReservedCount)"></Card>
      </div>
      <div class="col-span-2 h-fit w-full text-start bg-white shadow-sm rounded-lg p-5 overflow-auto">
        <h2 class="text-black font-extrabold text-lg">Reservations each Month</h2>
        <canvas id="reservationsByMonth" class="w-fit p-10"></canvas>
      </div>
      <div class="h-fit w-full text-start bg-white shadow-sm rounded-lg p-5 overflow-auto">
        <h2 class="text-black font-extrabold text-lg">Vehicles Composition</h2>
        <canvas id="vehicleComposition" class="w-fit p-10"></canvas>
      </div>
    </div>
  </div>
</template>

<script setup>
import Menubar from './SideNav.vue' 
import SearchBar from './SearchBar.vue';
import { supabase } from '../supabase'
import Chart from 'chart.js/auto'
import Card from './Card.vue'
import { onMounted, ref } from 'vue';

const userCount = ref();
const reservationCount = ref();
const vehicleReservedCount = ref();
const topVehicles = ref([]);
const companyCounts = ref({});

async function fetchData() {
  
  // Fetch reservations data
  const { data: reservations, error: reservationsError } = await supabase
    .from('reservations')
    .select();

  // Fetch vehicles data
  const { data: vehicles, error: vehiclesError } = await supabase
    .from('vehicles')
    .select('company_id');

  // Fetch users data
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('*');

  const { data: vehicleReserved, error: vehiclesReservedError } = await supabase
  .from('reservations')
  .select('vehicle_id, vehicles(company_id)')
  .eq('vehicles.company_id', 1);

  userCount.value = users.length;
  reservationCount.value = reservations.length;
  vehicleReservedCount.value = vehicleReserved.length;

  // Check for errors in fetching data
  if (reservationsError || vehiclesError || usersError || vehiclesReservedError) {
    console.error('Error fetching data:', reservationsError || vehiclesError || usersError || vehiclesReservedError);
    return;
  }

  // Process reservations and vehicles data
  const vehicleUsageCount = reservations.reduce((counts, row) => {
    counts[row.vehicle_id] = (counts[row.vehicle_id] || 0) + 1;
    return counts;
  }, {});

  topVehicles.value = Object.entries(vehicleUsageCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([vehicleId, count]) => ({ vehicleId, count }));

  companyCounts.value = vehicles.reduce((counts, vehicle) => {
    const companyKey = vehicle.company_id === 1 ? 'Owned' : 'Other Companies';
    counts[companyKey] = (counts[companyKey] || 0) + 1;
    return counts;
  }, {});

  // Generate Chart for Reservations each Month
  const monthlyCounts = {};
  reservations.forEach(row => {
    const month = new Date(row.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    monthlyCounts[month] = (monthlyCounts[month] || 0) + 1;
  });

  const labels = Object.keys(monthlyCounts);
  const counts = Object.values(monthlyCounts);

  new Chart(document.getElementById('reservationsByMonth'), {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'Reservations per Month',
        data: counts,
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 2,
        tension: 0.4,
        fill: true
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  });

  // Generate Pie Chart for Vehicle Composition
  const vehicleLabels = Object.keys(companyCounts.value);
  const vehicleData = Object.values(companyCounts.value);

  new Chart(document.getElementById('vehicleComposition'), {
    type: 'pie',
    data: {
      labels: vehicleLabels,
      datasets: [{
        label: 'Vehicle Composition by Company',
        data: vehicleData,
        backgroundColor: ['rgba(255, 99, 132, 0.2)', 'rgba(75, 192, 192, 0.2)', 'rgba(153, 102, 255, 0.2)'],
        borderColor: ['rgba(255, 99, 132, 1)', 'rgba(75, 192, 192, 1)', 'rgba(153, 102, 255, 1)'],
        borderWidth: 1
      }]
    },
    options: {
      responsive: true
    }
  });
}

onMounted(() => {
  fetchData();
});

</script>
