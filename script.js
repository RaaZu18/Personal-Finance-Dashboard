const addBtn = document.getElementById("add-btn");
const description = document.getElementById("description");
const amount = document.getElementById("amount");
const type = document.getElementById("type");
const dateInput = document.getElementById("date");
const transactionList = document.getElementById("transaction-list");
const incomeDisplay = document.getElementById("income");
const expenseDisplay = document.getElementById("expense");
const balanceDisplay = document.getElementById("balance");
const darkModeToggle = document.getElementById("dark-mode-toggle");
const exportCsvBtn = document.getElementById("export-btn");
const exportPdfBtn = document.getElementById("export-pdf-btn");

let transactions = JSON.parse(localStorage.getItem("transactions")) || [];

// Doughnut Chart with Balance Center
const chartCtx = document.getElementById("myChart").getContext("2d");
let chart = new Chart(chartCtx, {
  type: "doughnut",
  data: {
    labels: ["Income", "Expense"],
    datasets: [{
      data: [0, 0],
      backgroundColor: [
        "rgba(76, 175, 80, 0.9)",
        "rgba(244, 67, 54, 0.9)"
      ],
      borderWidth: 3,
      borderColor: "#fff",
      hoverOffset: 15,
      cutout: "70%"
    }]
  },
  options: {
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: function(ctx) {
            let label = ctx.label || '';
            let value = ctx.parsed;
            let total = ctx.chart._metasets[0].total;
            let percent = ((value / total) * 100).toFixed(1);
            return `${label}: $${value} (${percent}%)`;
          }
        }
      }
    },
    animation: { animateRotate: true, animateScale: true }
  },
  plugins: [{
    id: "centerText",
    afterDraw: (chart) => {
      const { ctx, width, height } = chart;
      ctx.save();

      const income = chart.data.datasets[0].data[0];
      const expense = chart.data.datasets[0].data[1];
      const balance = income - expense;

      ctx.font = "bold 18px Poppins";
      ctx.fillStyle = document.body.classList.contains("dark-mode") ? "#fff" : "#333";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(`Balance: $${balance.toFixed(2)}`, width / 2, height / 2);
      ctx.restore();
    }
  }]
});

// Custom Legend
const chartSection = document.querySelector(".chart-section");
const legend = document.createElement("div");
legend.classList.add("chart-legend");
legend.innerHTML = `
  <div class="legend-item"><div class="legend-color income-color"></div>Income</div>
  <div class="legend-item"><div class="legend-color expense-color"></div>Expense</div>
`;
chartSection.prepend(legend);

// Add Transaction
addBtn.addEventListener("click", () => {
  const desc = description.value.trim();
  const amt = parseFloat(amount.value);
  const tType = type.value;
  const date = dateInput.value;

  if (!desc || isNaN(amt) || amt <= 0 || !date) {
    alert("Please fill all fields correctly.");
    return;
  }

  const transaction = {
    id: Date.now(),
    description: desc,
    amount: amt,
    type: tType,
    date: date
  };

  transactions.push(transaction);
  transactions.sort((a, b) => new Date(b.date) - new Date(a.date));

  localStorage.setItem("transactions", JSON.stringify(transactions));
  renderTransactions();
  updateSummary();
  resetForm();
});

// Render Transactions
function renderTransactions() {
  transactionList.innerHTML = "";
  transactions.forEach(t => {
    const li = document.createElement("li");
    li.innerHTML = `
      <span>${t.description} (${t.date})</span>
      <span>${t.type === "income" ? "+" : "-"}$${t.amount.toFixed(2)}</span>
      <button class="delete-btn" onclick="deleteTransaction(${t.id})">Delete</button>
    `;
    transactionList.appendChild(li);
  });
}

// Delete Transaction
function deleteTransaction(id) {
  transactions = transactions.filter(t => t.id !== id);
  localStorage.setItem("transactions", JSON.stringify(transactions));
  renderTransactions();
  updateSummary();
}

// Update Summary + Chart
function updateSummary() {
  const income = transactions.filter(t => t.type === "income").reduce((a, b) => a + b.amount, 0);
  const expense = transactions.filter(t => t.type === "expense").reduce((a, b) => a + b.amount, 0);
  const balance = income - expense;

  incomeDisplay.textContent = `$${income.toFixed(2)}`;
  expenseDisplay.textContent = `$${expense.toFixed(2)}`;
  balanceDisplay.textContent = `$${balance.toFixed(2)}`;

  chart.data.datasets[0].data = [income, expense];
  chart.update();
}

// Reset Form
function resetForm() {
  description.value = "";
  amount.value = "";
  dateInput.value = "";
  type.value = "income";
}

// Dark Mode Toggle
darkModeToggle.addEventListener("change", () => {
  document.body.classList.toggle("dark-mode");
  localStorage.setItem("darkMode", document.body.classList.contains("dark-mode"));
  chart.update();

  // Adjust export buttons dynamically
  document.querySelectorAll(".export-section button").forEach(btn => {
    if(document.body.classList.contains("dark-mode")){
      btn.style.background = "#0d6efd";
      btn.style.color = "#fff";
    } else {
      btn.style.background = "#1976d2";
      btn.style.color = "#fff";
    }
  });
});

if (localStorage.getItem("darkMode") === "true") {
  document.body.classList.add("dark-mode");
  darkModeToggle.checked = true;
}

// Export CSV
exportCsvBtn.addEventListener("click", () => {
  if (transactions.length === 0) return alert("No data to export.");
  const rows = ["Description,Amount,Type,Date"];
  transactions.forEach(t => rows.push(`${t.description},${t.amount},${t.type},${t.date}`));
  const blob = new Blob([rows.join("\n")], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "transactions.csv";
  a.click();
});

// Export PDF
exportPdfBtn.addEventListener("click", () => {
  if (transactions.length === 0) return alert("No data to export.");
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  doc.text("Personal Finance Report", 14, 16);
  doc.autoTable({
    startY: 25,
    head: [["Description", "Amount", "Type", "Date"]],
    body: transactions.map(t => [t.description, `$${t.amount}`, t.type, t.date])
  });
  doc.save("Finance_Report.pdf");
});

// Initial Load
renderTransactions();
updateSummary();
