// Configuration
const API_URL = window.location.origin; // Use current host
const API_KEY = "your-secret-key-here"; // Match your backend key

// DOM Elements
const tickerSelect = document.getElementById('ticker-select');
const predictBtn = document.getElementById('predict-btn');
const resultEl = document.getElementById('prediction-result');
const metaEl = document.getElementById('prediction-meta');
let chart;

// Initialize Chart
function initChart() {
    const ctx = document.getElementById('history-chart').getContext('2d');
    chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Closing Price ($)',
                data: [],
                borderColor: '#4361ee',
                backgroundColor: 'rgba(67, 97, 238, 0.1)',
                tension: 0.1,
                fill: true,
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    title: {
                        display: true,
                        text: 'Price ($)'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Date'
                    }
                }
            }
        }
    });
}

// Fetch historical data
async function fetchHistory(ticker) {
    try {
        // In a real app, replace with actual API call
        // const response = await fetch(`/history/${ticker}`);
        // return await response.json();
        
        // Mock data for demonstration
        const mockDates = Array.from({length: 30}, (_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - (30 - i));
            return d.toLocaleDateString();
        });
        
        const mockPrices = Array.from({length: 30}, () => {
            const basePrice = {
                'Amazon': 180, 
                'Apple': 190,
                'Facebook': 350,
                'Google': 140,
                'Netflix': 600
            }[ticker];
            return (basePrice + (Math.random() * 20 - 10)).toFixed(2);
        });
        
        return {
            dates: mockDates,
            prices: mockPrices
        };
    } catch (error) {
        console.error("Error fetching history:", error);
        return { dates: [], prices: [] };
    }
}

// Make prediction
async function predictPrice() {
    const ticker = tickerSelect.value;
    
    // UI State
    predictBtn.disabled = true;
    predictBtn.textContent = 'Predicting...';
    resultEl.textContent = 'Calculating...';
    metaEl.textContent = '';
    
    try {
        // Get current chart data
        const currentData = chart.data.datasets[0].data;
        
        // Prepare input data (last 30 days)
        const inputData = currentData.slice(-30).map(price => [
            parseFloat(price),
            Math.random() * 1000000 + 5000000, // Volume
            parseFloat(price) * 0.99, // MA7
            parseFloat(price) * 1.01, // MA21
            Math.random() * 0.05, // Volatility
            Math.random() * 30 + 40 // RSI
        ]);
        
        const response = await fetch(`${API_URL}/predict/${ticker}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': API_KEY
            },
            body: JSON.stringify({
                values: inputData
            })
        });

        if (!response.ok) {
            throw new Error(await response.text());
        }
        
        const data = await response.json();
        resultEl.textContent = `$${data.prediction.toFixed(2)}`;
        metaEl.textContent = `Predicted ${ticker} closing price for next trading day`;
        
        // Update chart with prediction
        const lastDate = new Date();
        lastDate.setDate(lastDate.getDate() + 1);
        
        chart.data.labels.push(lastDate.toLocaleDateString());
        chart.data.datasets[0].data.push(data.prediction);
        chart.update();
        
    } catch (error) {
        console.error('Prediction failed:', error);
        resultEl.textContent = 'Error';
        metaEl.textContent = error.message || 'Failed to get prediction';
    } finally {
        predictBtn.disabled = false;
        predictBtn.textContent = 'Predict Tomorrow\'s Price';
    }
}

// Load data when ticker changes
async function loadTickerData() {
    const ticker = tickerSelect.value;
    const { dates, prices } = await fetchHistory(ticker);
    
    chart.data.labels = dates;
    chart.data.datasets[0].data = prices;
    chart.update();
    
    resultEl.textContent = '-';
    metaEl.textContent = '';
}

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    initChart();
    loadTickerData();
    
    tickerSelect.addEventListener('change', loadTickerData);
    predictBtn.addEventListener('click', predictPrice);
});
