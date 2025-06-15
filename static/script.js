document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const predictBtn = document.getElementById('predict-btn');
    const tickerSelect = document.getElementById('ticker-select');
    const resultEl = document.getElementById('prediction-result');
    const confidenceBar = document.getElementById('confidence-bar');
    const confidenceValue = document.getElementById('confidence-value');
    const predictionMeta = document.getElementById('prediction-meta');
    const themeToggle = document.getElementById('theme-toggle');
    const historyTable = document.getElementById('history-table');
    const newsHeadlines = document.getElementById('news-headlines');
    const sentimentBar = document.getElementById('sentiment-bar');
    const ctx = document.getElementById('history-chart').getContext('2d');

    // Configuration
    const API_KEY = "your-secret-key-here"; // Must match your backend API key
    let currentTicker = tickerSelect.value;
    let darkMode = false;

    // Initialize Chart
    const chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Historical Prices',
                data: [],
                borderColor: '#4361ee',
                backgroundColor: 'rgba(67, 97, 238, 0.1)',
                tension: 0.1,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { beginAtZero: false }
            }
        }
    });

    // Event Listeners
    predictBtn.addEventListener('click', predictPrice);
    tickerSelect.addEventListener('change', updateTicker);
    themeToggle.addEventListener('click', toggleTheme);

    // Initialize
    loadHistoricalData();
    fetchNewsSentiment();

    // Functions
    async function predictPrice() {
        predictBtn.disabled = true;
        predictBtn.textContent = 'Predicting...';
        resultEl.textContent = '...';
        confidenceValue.textContent = 'Calculating...';
        confidenceBar.style.width = '0%';

        try {
            // Prepare sample data (replace with real data collection)
            const sampleData = Array.from({length: 30}, () => [
                Math.random() * 100 + 150,  // Close
                Math.random() * 10000000,   // Volume
                Math.random() * 100 + 140,  // MA7
                Math.random() * 100 + 145,  // MA21
                Math.random() * 0.1,        // Volatility
                Math.random() * 30 + 40     // RSI
            ]);

            const response = await fetch(`/predict/${currentTicker}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-API-Key': API_KEY
                },
                body: JSON.stringify({
                    values: sampleData
                })
            });

            if (!response.ok) throw new Error(await response.text());

            const data = await response.json();
            displayPrediction(data);

        } catch (error) {
            console.error('Prediction failed:', error);
            resultEl.textContent = 'Error';
            confidenceValue.textContent = 'Prediction failed';
            predictionMeta.textContent = 'Please try again';
        } finally {
            predictBtn.disabled = false;
            predictBtn.textContent = 'Predict Tomorrow\'s Price';
        }
    }

    function displayPrediction(data) {
        resultEl.textContent = `$${data.prediction.toFixed(2)}`;
        const confidence = (data.confidence * 100).toFixed(0);
        confidenceValue.textContent = `${confidence}% confidence`;
        confidenceBar.style.width = `${confidence}%`;
        
        // Color confidence bar
        if (data.confidence < 0.7) {
            confidenceBar.style.backgroundColor = '#f94144'; // Red
        } else if (data.confidence < 0.85) {
            confidenceBar.style.backgroundColor = '#f8961e'; // Orange
        } else {
            confidenceBar.style.backgroundColor = '#43aa8b'; // Green
        }

        // Update prediction date
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        predictionMeta.textContent = `Predicted closing price for ${tomorrow.toLocaleDateString()}`;

        // Update chart
        chart.data.labels.push(tomorrow.toLocaleDateString());
        chart.data.datasets[0].data.push(data.prediction);
        chart.update();
    }

    function updateTicker() {
        currentTicker = tickerSelect.value;
        loadHistoricalData();
        fetchNewsSentiment();
    }

    async function loadHistoricalData() {
        try {
            // In a real app, replace with actual API call
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
                }[currentTicker];
                return (basePrice + (Math.random() * 20 - 10)).toFixed(2);
            });

            // Update chart
            chart.data.labels = mockDates;
            chart.data.datasets[0].data = mockPrices;
            chart.update();

        } catch (error) {
            console.error("Error loading history:", error);
        }
    }

    async function fetchNewsSentiment() {
        try {
            // Mock sentiment data
            const sentiment = Math.random() * 2 - 1; // -1 to 1
            const sentimentPercent = ((sentiment + 1) / 2) * 100;
            
            sentimentBar.style.width = `${sentimentPercent}%`;
            sentimentBar.style.backgroundColor = sentiment >= 0 ? '#43aa8b' : '#f94144';
            
            // Mock news items
            newsHeadlines.innerHTML = '';
            const mockNews = [
                `${currentTicker} announces new product launch`,
                `Analysts raise price target for ${currentTicker}`,
                `${currentTicker} faces regulatory challenges`
            ];
            
            mockNews.forEach(news => {
                const newsItem = document.createElement('div');
                newsItem.className = 'news-item';
                newsItem.textContent = news;
                newsHeadlines.appendChild(newsItem);
            });

        } catch (error) {
            console.error("Error fetching news:", error);
        }
    }

    function toggleTheme() {
        darkMode = !darkMode;
        document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : '');
        themeToggle.textContent = darkMode ? '☀️ Light Mode' : '🌓 Dark Mode';
        chart.update(); // Refresh chart colors
    }
});
