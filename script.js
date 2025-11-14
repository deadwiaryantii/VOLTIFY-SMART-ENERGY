firebaseconfig
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyA8gKcpMnIWxnGYEuOKNtGeteeAcAoRgX8",
  authDomain: "voltify-smart-home.firebaseapp.com",
  databaseURL: "https://voltify-smart-home-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "voltify-smart-home",
  storageBucket: "voltify-smart-home.firebasestorage.app",
  messagingSenderId: "225603241202",
  appId: "1:225603241202:web:dc7a5e1e3e90d54e9c7c6b",
  measurementId: "G-6XT4C0YK0K"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// --- DOM Element References ---
const voltageEl = document.getElementById('voltage');
const currentEl = document.getElementById('current');
const powerEl = document.getElementById('power');
const energyEl = document.getElementById('energy');
const tempEl = document.getElementById('temp');
const costEl = document.getElementById('cost');
const protectionAlertEl = document.getElementById('protection-alert');
const relayControlsEl = document.getElementById('relay-controls');
const resetProtectionBtn = document.getElementById('reset-protection-btn');

// --- Firebase Database References ---
const sensorDataRef = database.ref('voltify/sensors');
const relayStatesRef = database.ref('voltify/relays/states');
const controlRef = database.ref('voltify/control');
const statusRef = database.ref('voltify/status');

// --- Functions ---

/**
 * Updates the sensor value cards in the UI.
 * @param {object} sensorData - The sensor data object from Firebase.
 */
function updateSensorUI(sensorData) {
    voltageEl.innerText = `${(sensorData.voltage || 0).toFixed(1)} V`;
    currentEl.innerText = `${(sensorData.current || 0).toFixed(2)} A`;
    powerEl.innerText = `${(sensorData.power || 0).toFixed(1)} W`;
    energyEl.innerText = `${(sensorData.energy || 0).toFixed(3)} kWh`;
    tempEl.innerHTML = `${(sensorData.temperature || 0).toFixed(1)} &deg;C`;
    costEl.innerText = `Rp ${(sensorData.estimated_cost || 0).toFixed(2)}`;
}

/**
 * Generates and updates the relay control buttons.
 * @param {object} relayStates - The relay states object from Firebase.
 */
function updateRelayUI(relayStates) {
    relayControlsEl.innerHTML = ''; // Clear existing buttons
    if (!relayStates) {
        // Create 6 default off buttons if no state exists
        relayStates = {0:false, 1:false, 2:false, 3:false, 4:false, 5:false};
    }

    for (let i = 0; i < 6; i++) {
        const state = relayStates[i] || false;
        const btn = document.createElement('button');
        btn.id = `btn-${i}`;
        btn.className = `relay-btn ${state ? 'on' : ''}`;
        btn.innerText = `Channel ${i + 1}`;
        btn.onclick = () => toggleRelay(i, !state);
        relayControlsEl.appendChild(btn);
    }
}

/**
 * Sends a command to toggle a relay's state.
 * @param {number} channel - The relay channel index (0-5).
 * @param {boolean} newState - The desired new state (true for ON, false for OFF).
 */
function toggleRelay(channel, newState) {
    console.log(`Setting relay ${channel} to ${newState}`);
    relayStatesRef.child(channel).set(newState);
}

/**
 * Sends a command to reset the protection system.
 */
function resetProtection() {
    console.log("Sending reset protection command...");
    controlRef.child('reset_protection').set(true);
}

/**
 * Updates the protection status alert in the UI.
 * @param {object} statusData - The status object from Firebase.
 */
function updateStatusUI(statusData) {
    if (statusData && statusData.protection_active) {
        protectionAlertEl.style.display = 'block';
        protectionAlertEl.innerText = `PROTECTION ACTIVE: ${statusData.protection_reason || 'Unknown'}`;
        resetProtectionBtn.style.display = 'block';
    } else {
        protectionAlertEl.style.display = 'none';
        resetProtectionBtn.style.display = 'block'; // Or 'none' if you want to hide it when not protected
    }
}

// --- Event Listeners ---

// Listen for real-time changes in sensor data
sensorDataRef.on('value', (snapshot) => {
    const data = snapshot.val();
    if (data) {
        updateSensorUI(data);
    }
});

// Listen for real-time changes in relay states
relayStatesRef.on('value', (snapshot) => {
    const data = snapshot.val();
    updateRelayUI(data);
});

// Listen for real-time changes in system status
statusRef.on('value', (snapshot) => {
    const data = snapshot.val();
    updateStatusUI(data);
});

// Add click listener for the reset button
resetProtectionBtn.addEventListener('click', resetProtection);

// --- Initial Load ---
// Fetch initial data once to populate the UI quickly
sensorDataRef.once('value').then(snapshot => updateSensorUI(snapshot.val() || {}));
relayStatesRef.once('value').then(snapshot => updateRelayUI(snapshot.val() || {}));
statusRef.once('value').then(snapshot => updateStatusUI(snapshot.val() || {}));
