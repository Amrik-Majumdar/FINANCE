document.addEventListener('DOMContentLoaded', function() {
    // Configuration
    const API_KEY = "your-secret-key-here";
    const ANALYST_ESTIMATES = {
        'Amazon': 185.50,
        'Apple': 195.75,
        'Facebook': 375.20,
        'Google': 145.80,
        'Netflix': 610.30
    };
    
    // DOM Elements
    const elements = {
        tickerSelect: document.getElementById('ticker-select'),
        predictBtn: document.getElementById('predict-btn'),
        resultEl: document.getElementById('prediction-result'),
        confidenceBar: document.getElementById('confidence-bar'),
        confidenceValue: document.getElementById('confidence-value'),
        predictionMeta: document.getElementById('prediction-meta'),
        themeToggle: document.getElementById('theme-toggle'),
        weeklyAccuracy: document.getElementById('weekly-accuracy'),
        monthlyAccuracy: document.getElementById('monthly-accuracy'),
        alltimeAccuracy: document.getElementById('alltime-accuracy'),
        analystComparison: document.getElementById('analyst-comparison'),
        sentimentBar: document.getElementById('sentiment-bar'),
        newsHeadlines: document.getElementById('news-headlines'),
        historyTable: document.getElementById('history-table'),
        tabs: document.querySelectorAll('.tab'),
        tabContents: document.querySelectorAll('.tab-content')
    };
    
    // State
    let currentTicker = 'Apple';
    let predictionHistory = JSON.parse(localStorage.getItem('predictionHistory')) || [];
    let darkMode = localStorage.getItem('darkMode') === 'true';
    
    // Initialize Chart
    const ctx = document.getElementById('history-chart').getContext('2d');
    const chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [
                {
                    label: 'Actual Price',
                    data: [],
                    borderColor: '#4361ee',
                    backgroundColor: 'rgba(67, 97, 238, 0.1)',
                    tension: 0.1,
                    fill: true,
                    borderWidth: 2
                },
                {
                    label: 'Predictions',
                    data: [],
                    borderColor: '#43aa8b',
                    backgroundColor: 'rgba(67, 170, 139, 0.1)',
                    tension: 0.1,
                    fill: false,
                    borderWidth: 2,
                    borderDash: [5, 5]
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    title: {
                        display: true,
                        text: 'Price ($)'
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Date'
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)'
                    }
                }
            }
        }
    });
    
    // Initialize UI
    initTheme();
    updateTickerDisplay();
    loadHistoricalData();
    updateAccuracyMetrics();
    renderPredictionHistory();
    setupTabs();
    fetchNewsSentiment();
    
    // Event Listeners
    elements.tickerSelect.addEventListener('change', function() {
        currentTicker = this.value;
        updateTickerDisplay();
        loadHistoricalData();
        fetchNewsSentiment();
    });
    
    elements.predictBtn.addEventListener('click', predictPrice);
    elements.themeToggle.addEventListener('click', toggleTheme);
    
    // Functions
    function initTheme() {
        if (darkMode) {
            document.documentElement.setAttribute('data-theme', 'dark');
            elements.themeToggle.textContent = '☀️ Light Mode';
        } else {
            document.documentElement.removeAttribute('data-theme');
            elements.themeToggle.textContent = '🌓 Dark Mode';
        }
    }
    
    function toggleTheme() {
        darkMode = !darkMode;
        localStorage.setItem('darkMode', darkMode);
        initTheme();
        chart.update(); // Refresh chart colors
    }
    
    function updateTickerDisplay() {
        const tickerSymbol = elements.tickerSelect.options[elements.tickerSelect.selectedIndex].text
            .match(/\(([^)]+)\)/)[1];
        elements.analystComparison.textContent = `Analyst Avg: $${ANALYST_ESTIMATES[currentTicker]}`;
    }
    
    async function loadHistoricalData() {
        try {
            // In a real app, replace with actual API call
            // const response = await fetch(`/history/${currentTicker}`);
            // const data = await response.json();
            
            // Mock data for demonstration
            const mockDates = Array.from({length: 30}, (_, i) => {
                const d = new Date();
                d.setDate(d.getDate() - (30 - i));
                return d.toLocaleDateString();
            });
            
            const basePrice = {
                'Amazon': 180, 
                'Apple': 190,
                'Facebook': 350,
                'Google': 140,
                'Netflix': 600
            }[currentTicker];
            
            const mockPrices = Array.from({length: 30}, (_, i) => 
                (basePrice + (Math.random() * 20 - 10) + (i * 0.5)).toFixed(2)
            );
            
            // Update chart
            chart.data.labels = mockDates;
            chart.data.datasets[0].data = mockPrices;
            chart.data.datasets[1].data = [];
            chart.update();
            
        } catch (error) {
            console.error("Error loading historical data:", error);
        }
    }
    
    async function predictPrice() {
        elements.predictBtn.disabled = true;
        elements.predictBtn.textContent = 'Analyzing...';
        elements.resultEl.textContent = '...';
        elements.confidenceValue.textContent = 'Calculating...';
        elements.confidenceBar.style.width = '0%';
        
        try {
            // Simulate confidence calculation
            await new Promise(resolve => setTimeout(resolve, 1000));
            const confidence = Math.min(95, Math.max(60, Math.random() * 100));
            
            // Make prediction API call
            const response = await fetch(`/predict/${currentTicker}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-API-Key': API_KEY
                },
                body: JSON.stringify({
                    values: chart.data.datasets[0].data.map(price => [
                        parseFloat(price),
                        Math.random() * 10000000,
                        parseFloat(price) * 0.99,
                        parseFloat(price) * 1.01,
                        Math.random() * 0.05,
                        Math.random() * 30 + 40
                    ])
                })
            });
            
            if (!response.ok) throw new Error(await response.text());
            
            const data = await response.json();
            const prediction = data.prediction;
            const predictionConfidence = data.confidence || confidence;
            
            // Update UI
            elements.resultEl.textContent = `$${prediction.toFixed(2)}`;
            elements.confidenceValue.textContent = `${Math.round(predictionConfidence)}% confidence`;
            elements.confidenceBar.style.width = `${predictionConfidence}%`;
            
            // Color confidence bar
            if (predictionConfidence < 70) {
                elements.confidenceBar.style.background = `linear-gradient(90deg, var(--danger) ${predictionConfidence}%, transparent ${predictionConfidence}%)`;
            } else {
                elements.confidenceBar.style.background = `linear-gradient(90deg, var(--success) ${predictionConfidence}%, transparent ${predictionConfidence}%)`;
            }
            
            // Update prediction date
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            elements.predictionMeta.textContent = `Predicted closing price for ${tomorrow.toLocaleDateString()}`;
            
            // Add to prediction history
            const historyEntry = {
                date: new Date().toISOString(),
                ticker: currentTicker,
                prediction: prediction,
                actual: null, // Will be updated later
                confidence: predictionConfidence
            };
            
            predictionHistory.push(historyEntry);
            localStorage.setItem('predictionHistory', JSON.stringify(predictionHistory));
            
            // Update chart with prediction
            chart.data.datasets[1].data = [...chart.data.datasets[0].data.slice(-29), prediction];
            chart.data.labels.push(tomorrow.toLocaleDateString());
            chart.update();
            
            // Update accuracy metrics
            updateAccuracyMetrics();
            
        } catch (error) {
            console.error('Prediction failed:', error);
            elements.resultEl.textContent = 'Error';
            elements.confidenceValue.textContent = 'Prediction failed';
            elements.predictionMeta.textContent = 'Please try again later';
        } finally {
            elements.predictBtn.disabled = false;
            elements.predictBtn.textContent = 'Predict Tomorrow\'s Price';
        }
    }
    
    function updateAccuracyMetrics() {
        // Filter history for current ticker
        const tickerHistory = predictionHistory.filter(
            entry => entry.ticker === currentTicker
        );
        
        if (tickerHistory.length === 0) {
            elements.weeklyAccuracy.textContent = '-';
            elements.monthlyAccuracy.textContent = '-';
            elements.alltimeAccuracy.textContent = '-';
            return;
        }
        
        // Calculate accuracies (mock for demo)
        const weeklyAccuracy = Math.min(95, Math.max(70, Math.random() * 100));
        const monthlyAccuracy = Math.min(90, Math.max(65, Math.random() * 100));
        const alltimeAccuracy = Math.min(85, Math.max(60, Math.random() * 100));
        
        elements.weeklyAccuracy.textContent = `${Math.round(weeklyAccuracy)}%`;
        elements.monthlyAccuracy.textContent = `${Math.round(monthlyAccuracy)}%`;
        elements.alltimeAccuracy.textContent = `${Math.round(alltimeAccuracy)}%`;
    }
    
    function renderPredictionHistory() {
        elements.historyTable.innerHTML = '';
        
        if (predictionHistory.length === 0) {
            elements.historyTable.innerHTML = '<tr><td colspan="4">No predictions yet</td></tr>';
            return;
        }
        
        // Sort by date (newest first)
        const sortedHistory = [...predictionHistory].sort((a, b) => 
            new Date(b.date) - new Date(a.date)
        );
        
        sortedHistory.forEach(entry => {
            const row = document.createElement('tr');
            
            // Calculate accuracy (mock for demo)
            const accuracy = entry.actual 
                ? Math.round(100 - Math.abs(entry.prediction - entry.actual) / entry.actual * 100)
                : Math.min(95, Math.max(60, Math.random() * 100));
            
            // Create accuracy badge
            let accuracyClass = 'accuracy-medium';
            if (accuracy > 80) accuracyClass = 'accuracy-high';
            if (accuracy < 60) accuracyClass = 'accuracy-low';
            
            const accuracyBadge = entry.actual 
                ? `<span class="accuracy-badge ${accuracyClass}">${accuracy}%</span>`
                : '<span class="accuracy-badge">Pending</span>';
            
            row.innerHTML = `
                <td>${new Date(entry.date).toLocaleDateString()}</td>
                <td>$${entry.prediction.toFixed(2)}</td>
                <td>${entry.actual ? `$${entry.actual.toFixed(2)}` : '-'}</td>
                <td>${accuracyBadge}</td>
            `;
            
            elements.historyTable.appendChild(row);
        });
    }
    
    function setupTabs() {
        elements.tabs.forEach(tab => {
            tab.addEventListener('click', function() {
                // Remove active class from all tabs and contents
                elements.tabs.forEach(t => t.classList.remove('active'));
                elements.tabContents.forEach(c => c.classList.remove('active'));
                
                // Add active class to clicked tab and corresponding content
                this.classList.add('active');
                const tabId = this.getAttribute('data-tab');
                document.getElementById(`${tabId}-tab`).classList.add('active');
            });
        });
    }
    
    async function fetchNewsSentiment() {
        try {
            // In a real app, replace with actual API call
            // const response = await fetch(`/news/${currentTicker}`);
            // const data = await response.json();
            
            // Mock data for demonstration
            const mockSentiment = Math.random() * 2 - 1; // Between -1 and 1
            const mockNews = [
                {
                    headline: `${currentTicker} announces breakthrough in AI technology`,
                    sentiment: Math.min(0.9, Math.max(0.6, mockSentiment + Math.random() * 0.3))
                },
                {
                    headline: `Analysts raise price target for ${currentTicker}`,
                    sentiment: Math.min(0.8, Math.max(0.5, mockSentiment + Math.random() * 0.2))
                },
                {
                    headline: `${currentTicker} faces regulatory challenges in Q3`,
                    sentiment: Math.max(-0.7, Math.min(-0.3, mockSentiment - Math.random() * 0.4))
                }
            ];
            
            // Update sentiment meter
            const sentimentPercent = ((mockSentiment + 1) / 2) * 100;
            elements.sentimentBar.style.width = `${sentimentPercent}%`;
            elements.sentimentBar.style.marginLeft = '0%';
            
            // Update news headlines
            elements.newsHeadlines.innerHTML = '';
            mockNews.forEach(news => {
                const newsItem = document.createElement('div');
                newsItem.className = 'news-item';
                
                const sentimentClass = news.sentiment > 0 ? 'positive' : 'negative';
                const sentimentText = news.sentiment > 0 ? 'Positive' : 'Negative';
                
                newsItem.innerHTML = `
                    <h4>${news.headline}</h4>
                    <span class="sentiment ${sentimentClass}">${sentimentText} (${(news.sentiment * 100).toFixed(0)}%)</span>
                `;
                
                elements.newsHeadlines.appendChild(newsItem);
            });
            
        } catch (error) {
            console.error("Error fetching news sentiment:", error);
        }
    }
    
    // Simulate actual prices coming in later (for demo purposes)
    setInterval(() => {
        predictionHistory = predictionHistory.map(entry => {
            if (!entry.actual && Math.random() > 0.7) {
                return {
                    ...entry,
                    actual: entry.prediction * (0.95 + Math.random() * 0.1)
                };
            }
            return entry;
        });
        
        localStorage.setItem('predictionHistory', JSON.stringify(predictionHistory));
        renderPredictionHistory();
        updateAccuracyMetrics();
    }, 10000); // Check every 10 seconds
});
