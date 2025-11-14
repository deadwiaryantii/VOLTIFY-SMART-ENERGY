const express = require('express');
const app = express();

const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static('.'));

// --- State and Configuration ---
let relayState = false;
let cumulativeEnergyKWh = 0;
const COST_PER_KWH = 1444.70;
const DATA_INTERVAL_SECONDS = 2;

function getMockData() {
    const voltage = 220 + (Math.random() * 10 - 5);
    const current = relayState ? (1 + (Math.random() * 5)) : 0.01;
    const power = voltage * current;

    const energyWh = power * (DATA_INTERVAL_SECONDS / 3600);
    cumulativeEnergyKWh += energyWh / 1000;

    const uptimeSeconds = (Date.now() - serverStartTime) / 1000;
    const uptimeHours = uptimeSeconds / 3600;

    let estimatedDailyCost = 0;
    if (uptimeHours > 0) {
        const averagePowerKW = cumulativeEnergyKWh / uptimeHours;
        const estimatedDailyKWh = averagePowerKW * 24;
        estimatedDailyCost = estimatedDailyKWh * COST_PER_KWH;
    }

    const temperature = 25 + (Math.random() * 5 - 2.5);
    const humidity = 50 + (Math.random() * 10 - 5);
    const lightIntensity = Math.floor(Math.random() * 1024);

    let devices = [];
    if (relayState) {
        if (power > 1000) devices.push({ name: 'AC', power: power.toFixed(2), status: 'Aktif' });
        else if (power > 150) devices.push({ name: 'Kulkas', power: power.toFixed(2), status: 'Aktif' });
        else if (power > 50) devices.push({ name: 'Kipas Angin', power: power.toFixed(2), status: 'Aktif' });
        else if (power > 5) devices.push({ name: 'Lampu & Charger', power: power.toFixed(2), status: 'Aktif' });
    }

    let notification = null;
    let systemStatus = 'Normal';

    if (current > 10) {
        systemStatus = 'PROTECTION: OVERCURRENT';
        notification = 'Arus berlebih terdeteksi! Sistem proteksi diaktifkan.';
        relayState = false;
    } else if (voltage > 240 || voltage < 180) {
        systemStatus = 'PROTECTION: VOLTAGE';
        notification = 'Tegangan tidak stabil! Sistem proteksi diaktifkan.';
        relayState = false;
    }

    return {
        systemStatus,
        ipAddress: '192.168.1.100',
        sensors: { voltage, current, power, temperature, humidity, lightIntensity },
        energy: { cumulativeKWh: cumulativeEnergyKWh, estimatedDailyCost },
        devices,
        relayState,
        notification,
    };
}

app.get('/api/data', (req, res) => {
    res.json(getMockData());
});

app.post('/api/relay', (req, res) => {
    const { state } = req.body;
    if (typeof state === 'boolean') {
        relayState = state;
        res.json({ success: true, newState: relayState });
    } else {
        res.status(400).json({ success: false, message: 'Invalid state' });
    }
});

const serverStartTime = Date.now();
app.listen(port, () => {
    console.log(`Mock server running on port ${port}`);
});
