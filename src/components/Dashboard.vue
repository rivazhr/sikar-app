<template>
  <!-- Konten Dashboard -->
  <div class="flex-row w-full justify-start">
    <h2 class="text-2xl font-extrabold text-start text-black pb-5">Dashboard</h2>
    <div class="lg:grid grid-cols-3 gap-4">
      <div class="w-full h-full p-5 bg-white shadow-sm rounded-lg mb-4">
        <Card label="Users" :percentage="Number(userPercentage.toFixed(2))" :value="String(newUserCount)"></Card>
      </div>
      <div class="w-full h-full p-5 bg-white shadow-sm rounded-lg mb-4">
        <Card label="Reservations" :percentage="Number(reservationPercentage.toFixed(2))" :value="String(newReservationCount)"></Card>
      </div>
      <div class="w-full h-full p-5 bg-white shadow-sm rounded-lg mb-4">
        <Card label="Reserved Vehicles" :percentage="Number(vehiclePercentage.toFixed(2))" :value="String(newVehicleCount)"></Card>
      </div>
      <div class="sm:col-span-2 mb-4 lg:mb-0 h-fit w-full text-start bg-white shadow-sm rounded-lg p-5 overflow-auto">
        <h2 class="text-black font-bold">Reservations each Month</h2>
        <canvas id="reservationsByMonth" class="w-fit md:p-5"></canvas>
      </div>
      <div class="w-full h-full mb-4 lg:mb-0 text-start bg-white shadow-sm rounded-lg p-5 flex flex-col">
        <h2 class="text-black font-bold">Vehicles Composition</h2>
        <div class="flex flex-grow items-center">
          <canvas id="vehicleComposition" class="w-full h-full p-5"></canvas>
        </div>
      </div>
      <div class="sm:col-span-2 h-fit mb-4 lg:mb-0 w-full text-start bg-white shadow-sm rounded-lg p-5 order-2 lg:order-1">
        <h2 class="text-black font-bold">Reservation Details</h2>
        <div class="flex overflow-auto">
          <table id="resTable" class="w-full display text-black text-center">
            <thead>
              <tr>
                <th class="text-center">No</th>
                <th class="text-center">User Name</th>
                <th class="text-center">Vehicle Name</th>
                <th class="text-center">Start Date</th>
                <th class="text-center">End Date</th>
                <th class="text-center">Status</th>
                <th class="text-center">Driver</th>
              </tr>
            </thead>
  
            <tbody>
              <tr v-for="(item, index) in reservationList" :key="item.id">
                <td class="text-center">{{ index + 1 }}</td>
                <td class="text-center">{{ item.name }}</td>
                <td class="text-center">{{ item.vehicle }}</td>
                <td class="text-center">{{ item.start_date }}</td>
                <td class="text-center">{{ item.end_date }}</td>
                <td class="text-center">{{ item.status }}</td>
                <td class="text-center">{{ item.driver }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <div class="w-full h-fit p-5 text-start bg-white shadow-sm rounded-lg mb-4 md:mb-0 order-1 lg:order-2">
        <h2 class="text-black font-bold mb-4">Top Reserved Vehicles</h2>
        <ul>
          <li v-for="vehicle, index in topVehicles" :key="vehicle.name" class="flex justify-start">
            <span class="text-black w-fit me-4 font-extrabold">{{ index + 1 }}</span>
            <span class="flex flex-grow justify-between">
              <span class="text-black">{{ vehicle.name }}</span>
              <span class="text-black">{{ vehicle.count }}</span>
            </span>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup>
import { supabase } from '../supabase';
import Chart from 'chart.js/auto';
import Card from './Card.vue';
import DataTable from 'datatables.net-dt';
import 'datatables.net-responsive-dt';
import { onMounted, ref, nextTick } from 'vue';

const userCount = ref();
const userNewCount = ref();
const reservationCount = ref();
const vehicleReservedCount = ref();
const topVehicles = ref([]);
const companyCounts = ref({});
const reservationList = ref([]);

let table;

// Initialize DataTables
function initDataTable() {
  if (table) {
    table.destroy();
  }

  nextTick(() => {
    table = new DataTable('#resTable', {
      responsive: true,
      data: reservationList.value,
      columns: [
        { 
          data: null, 
          render: (data, type, row, meta) => meta.row + 1,
          title: "No"
        },
        { data: 'name', title: 'User Name' },
        { data: 'vehicle', title: 'Vehicle Name' },
        { data: 'start_date', title: 'Start Date' },
        { data: 'end_date', title: 'End Date' },
        { data: 'status', title: 'Status' },
        { data: 'driver', title: 'Driver' },
      ],
      language: {
        search: 'Search:',
        lengthMenu: 'Show _MENU_ entries',
        info: 'Showing _START_ to _END_ of _TOTAL_ entries',
        infoEmpty: 'No entries available',
        zeroRecords: 'No matching records found',
        paginate: {
          previous: 'Previous',
          next: 'Next'
        }
      }
    });
  });
}

const userPercentage = ref(0);
const reservationPercentage = ref(0);
const vehiclePercentage = ref(0);

// State jumlah bulan ini
const newUserCount = ref(0);
const newReservationCount = ref(0);
const newVehicleCount = ref(0);

// Method untuk menghitung persentase
const calculatePercentageChange = (current, previous) => {
  if (previous === 0) return current * 100; 
  return ((current - previous) / previous) * 100;
};

const fetchDashboardData = async () => {
  try {
    // Fetch User Data
    const { data: userCounts, error: userError } = await supabase.rpc('get_user_counts_by_month');
    if (userError) throw userError;

    if (userCounts.length > 0) {
      let [currentMonth, lastMonth] = userCounts.slice(0, 2); 
      if(!lastMonth) lastMonth = 0;
      newUserCount.value = currentMonth.user_count;
      userPercentage.value = calculatePercentageChange(
        currentMonth.user_count,
        lastMonth
      );
    }
    
    // Fetch Reservation Data
    const { data: reservationCounts, error: reservationError } = await supabase.rpc('get_reservation_counts_by_month');
    if (reservationError) throw reservationError;
    
    if (reservationCounts.length > 0) {
      const [currentMonth, lastMonth] = reservationCounts.slice(0, 2);
      newReservationCount.value = currentMonth.reservation_count;
      reservationPercentage.value = calculatePercentageChange(
        currentMonth.reservation_count,
        lastMonth.reservation_count
      );
    }

    // Fetch Company Vehicle Count
    const { data: vehicleCounts, error: vehicleError } = await supabase.rpc('get_company_vehicle_count');
    if (vehicleError) throw vehicleError;

    if (vehicleCounts.length > 0) {
      const [currentMonth, lastMonth] = vehicleCounts.slice(0, 2);
      newVehicleCount.value = currentMonth.vehicle_count;
      vehiclePercentage.value = calculatePercentageChange(
        currentMonth.vehicle_count,
        lastMonth.vehicle_count
      );
    }
  } catch (err) {
    console.error('Error fetching dashboard data:', err);
  }
};

async function fetchData() {
  
  // Fetch reservations data
  const { data: reservations, error: reservationsError } = await supabase
    .from('reservations')
    .select(`
      id,
      start_date, end_date, created_at, status, fuel_consumption, vehicle_id,
      vehicles(name),
      user:users!user_id(name),
      driver:users!driver_id(name),
      approvals(id, is_approved) 
    `)
    .order('created_at');

  // Process reservation data
  reservationList.value = reservations.map((item) => ({
    id: item.id,
    name: item.user.name, 
    vehicle: item.vehicles.name, 
    start_date: item.start_date,
    end_date: item.end_date,
    status: item.status,
    driver: item.driver?.name || 'Not Assigned',
  }));

  // Fetch other data (vehicles, users)
  const { data: vehicles, error: vehiclesError } = await supabase
    .from('vehicles')
    .select('company_id');
    
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('*');
    
  const { data: vehicleReserved, error: vehiclesReservedError } = await supabase
    .from('reservations')
    .select('vehicle_id, vehicles(company_id)'); 

  userCount.value = users.length;
  reservationCount.value = reservations.length;

  const filteredData = vehicleReserved.filter(item => item.vehicles?.company_id === 1);
  vehicleReservedCount.value = filteredData.length;

  // Handle data fetching errors
  if (reservationsError || vehiclesError || usersError || vehiclesReservedError) {
    console.error('Error fetching data:', reservationsError || vehiclesError || usersError || vehiclesReservedError);
    return;
  }

  // Process reservations and vehicles data
  const vehicleUsageCount = reservations.reduce((counts, row) => {
    const vehicleName = row.vehicles?.name || "Unknown Vehicle";
    counts[vehicleName] = (counts[vehicleName] || 0) + 1;
    return counts;
  }, {});

  topVehicles.value = Object.entries(vehicleUsageCount)
    .sort(([, countA], [, countB]) => countB - countA)
    .slice(0, 5)
    .map(([name, count]) => ({ name, count }));

  companyCounts.value = vehicles.reduce((counts, vehicle) => {
    if (vehicle.company_id === 1) {
      counts['Owned'] = (counts['Owned'] || 0) + 1;
    } else {
      counts['Others'] = (counts['Others'] || 0) + 1;
    }
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
        backgroundColor: 'rgba(37, 85, 155, 0.2)',
        borderColor: 'rgba(37, 85, 155, 1)',
        borderWidth: 2,
        fill: true
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            stepSize: 1 
          }
        }
      },
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
        backgroundColor: ['rgba(37, 85, 155, 0.8)', 'rgba(37, 85, 155, 0.2)', 'rgba(153, 102, 255, 0.2)'],
        borderColor: ['rgba(37, 85, 155, 1)', 'rgba(37, 85, 155, 0.3)', 'rgba(153, 102, 255, 1)'],
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
    }
  });

  initDataTable(); 
}

onMounted(() => {
  fetchData();
  fetchDashboardData();
});
</script>
