export function renderDoughnutChart(distribution) {
    const canvasEl = document.getElementById('emissions-doughnut');
    if (!canvasEl) return;
    const ctx = canvasEl.getContext('2d');
    if (window.emissionsChart) {
        window.emissionsChart.destroy();
    }
    const data = {
        labels: ['Transport', 'Energy', 'Food', 'Waste', 'Consumption'],
        datasets: [{
            data: [
                distribution.transport || 0,
                distribution.energy || 0,
                distribution.food || 0,
                distribution.waste || 0,
                distribution.consumption || 0
            ],
            backgroundColor: [
                'var(--mint)',
                'var(--blue)',
                'var(--purple)',
                'var(--yellow)',
                'var(--text-muted)'
            ],
            borderWidth: 1
        }]
    };
    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { position: 'bottom' },
            tooltip: { enabled: true }
        }
    };
    window.emissionsChart = new Chart(ctx, {
        type: 'doughnut',
        data: data,
        options: options
    });
}

export function renderCalcCharts(res) {
    const calcBreakdown = document.getElementById("calc-breakdown");
    const calcBarChart = document.getElementById("calc-bar-chart");
    if (!calcBreakdown || !calcBarChart) return;

    calcBreakdown.classList.remove("hidden");
    calcBarChart.innerHTML = "";

    const categories = [
        { key: "transport", label: "Transportation", val: res.transport, fillClass: "fill-transport" },
        { key: "energy", label: "Utilities / Energy", val: res.energy, fillClass: "fill-energy" },
        { key: "diet", label: "Diet & Food", val: res.diet, fillClass: "fill-diet" },
        { key: "waste", label: "Waste", val: res.waste, fillClass: "fill-waste" },
        { key: "consumption", label: "Shopping", val: res.consumption, fillClass: "fill-consumption" }
    ];

    const maxVal = Math.max(...categories.map(c => c.val), 1);

    categories.forEach(c => {
        const row = document.createElement("div");
        row.className = "chart-row";
        const pctWidth = (c.val / maxVal) * 100;
        row.innerHTML = `
            <div class="chart-label-row">
                <span>${c.label}</span>
                <strong>${c.val.toFixed(1)} kg</strong>
            </div>
            <div class="chart-bar-bg">
                <div class="chart-bar-fill ${c.fillClass}" style="width: 0%"></div>
            </div>
        `;
        calcBarChart.appendChild(row);
        setTimeout(() => {
            const fill = row.querySelector(".chart-bar-fill");
            if (fill) fill.style.width = `${pctWidth}%`;
        }, 50);
    });

    const totalDiv = document.createElement("div");
    totalDiv.style.textAlign = "right";
    totalDiv.style.marginTop = "10px";
    totalDiv.style.fontSize = "0.95rem";
    totalDiv.innerHTML = `Total Footprint Estimate: <strong style="color: var(--mint);">${res.total.toFixed(1)} kg/month</strong>`;
    calcBarChart.appendChild(totalDiv);
}
