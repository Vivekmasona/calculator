document.addEventListener("DOMContentLoaded", () => {
    // Check if user is logged in
    const currentUser = JSON.parse(localStorage.getItem("currentUser"));
    if (!currentUser) {
        window.location.href = "login.html";
        return;
    }
  
    // Set user name in header
    document.getElementById("userName").textContent = currentUser.name;
  
    // Set profile information
    document.getElementById("profileName").textContent = currentUser.name;
    document.getElementById("profileEmail").textContent = currentUser.email;
    document.getElementById("profileCreated").textContent = new Date(currentUser.createdAt).toLocaleDateString();
  
    // Tab switching
    const tabs = document.querySelectorAll(".sidebar-nav li:not(#logout)");
    tabs.forEach((tab) => {
        tab.addEventListener("click", function () {
            tabs.forEach((t) => t.classList.remove("active"));
            this.classList.add("active");
            document.querySelectorAll(".tab-content").forEach((content) => {
                content.classList.remove("active");
            });
            const tabId = this.getAttribute("data-tab");
            document.getElementById(`${tabId}-tab`).classList.add("active");
        });
    });
  
    // Logout functionality
    document.getElementById("logout").addEventListener("click", () => {
        localStorage.removeItem("currentUser");
        window.location.href = "login.html";
    });
  
    // Calculator functionality
    const calculatorInput = document.getElementById("calculatorInput");
    const calculateBtn = document.getElementById("calculateBtn");
    const calculatorResult = document.getElementById("calculatorResult");
    const historyList = document.getElementById("historyList");
  
    // Load calculation history
    loadHistory();
  
    // Calculator buttons
    const calcButtons = document.querySelectorAll(".calc-btn");
    calcButtons.forEach((button) => {
        button.addEventListener("click", function () {
            if (this.classList.contains("clear")) {
                calculatorInput.value = "";
            } else {
                const value = this.textContent;
                if (value === "×") {
                    calculatorInput.value += "*";
                } else if (value === "÷") {
                    calculatorInput.value += "/";
                } else {
                    calculatorInput.value += value;
                }
            }
        });
    });
  
    // Calculate button
    calculateBtn.addEventListener("click", () => {
        const expression = calculatorInput.value.trim();
        if (!expression) {
            calculatorResult.innerHTML = '<div class="result-placeholder">No input provided</div>';
            return;
        }
  
        // Show loading state
        calculatorResult.innerHTML = '<div class="result-placeholder">Calculating...</div>';
  
        // Call Wolfram Alpha API
        callWolframAPI(expression);
    });
  
  
  let lastRequestTime = 0;  // Track last API request time
  const REQUEST_LIMIT = 5000; // Limit: 5 seconds between requests
  const appId = "9YX2XY-VRUJYRVUJT"; // API - ID OF Wolfarm
  
  
  function callWolframAPI(query) {
      const apiUrl = `http://api.wolframalpha.com/v2/query?appid=${appId}&input=${encodeURIComponent(query)}&format=plaintext&output=json`;
      const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(apiUrl)}`;
  
      const now = Date.now();
  
      // ✅ Rate Limiting
      if (now - lastRequestTime < REQUEST_LIMIT) {
          console.warn("Rate limit exceeded: Please wait before making another request.");
          calculatorResult.innerHTML = `<div class="result">Please wait before making another request...⏱️</div>`;
          return;
      }
      lastRequestTime = now; // Update last request time
  
      // ✅ Check sessionStorage (Prevents unnecessary API calls)
      const cachedResult = sessionStorage.getItem(query);
      if (cachedResult) {
          console.log("Using cached result for:", query);
          calculatorResult.innerHTML = `<div class="result">${cachedResult}</div>`;
          return;
      }
  
      fetch(proxyUrl)
          .then(response => response.json())
          .then(data => {
              console.log("Full API Response:", data);
              const json = JSON.parse(data.contents);
              console.log("Parsed JSON:", json);
  
              if (json.queryresult && json.queryresult.success) {
                  console.log("Query Success!");
                  console.log("Available Pods:", json.queryresult.pods);
  
                  const pods = json.queryresult.pods;
                  let result = "No result found";
  
                  // Debugging: Print pod titles
                  pods.forEach(pod => console.log("Pod Title:", pod.title));
  
                  // ✅ Check multiple pod titles to extract the computed result
                  const resultPods = [
                      "Result", 
                      "Computation result", 
                      "Mathematical result", 
                      "Exact result", 
                      "Decimal approximation"
                  ];
  
                  for (let pod of pods) {
                      if (resultPods.some(title => pod.title.toLowerCase().includes(title.toLowerCase()))) {
                          result = pod.subpods[0]?.plaintext || "No result found!! 😔";
                          break;
                      }
                  }
  
                  // ✅ Handle complex results
                  if (result.includes("[") && result.includes(";")) {
                      result = "Complex result. Try another input.";
                  }
  
                  // ✅ Store in sessionStorage to reduce API calls
                  sessionStorage.setItem(query, result);
  
                  // ✅ Display result
                  calculatorResult.innerHTML = `<div class="result">${result}</div>`;
                  saveToHistory(query, result);
              } else {
                  console.log("Query Failed!", json);
                  calculatorResult.innerHTML = `<div class="result">No result found !! 😔</div>`;
              }
          })
          .catch(error => {
              console.error("API Error:", error);
              calculatorResult.innerHTML = `<div class="result">No Result Found !! 😔</div>`;
          });
  }
  
  
  
    
    function saveToHistory(expression, result) {
        const history = JSON.parse(localStorage.getItem("calculationHistory")) || [];
        history.unshift({ expression, result, timestamp: new Date().toISOString() });
  
        if (history.length > 20) {
            history.pop();
        }
  
        localStorage.setItem("calculationHistory", JSON.stringify(history));
        loadHistory();
    }
  
    // Function to load calculation history
    function loadHistory() {
        const history = JSON.parse(localStorage.getItem("calculationHistory")) || [];
  
        if (history.length === 0) {
            historyList.innerHTML = '<p class="empty-history">No calculations yet</p>';
            return;
        }
  
        let historyHTML = "";
        history.forEach((item) => {
            const date = new Date(item.timestamp);
            historyHTML += `
                <div class="history-item">
                    <div>
                        <div class="history-expression">${item.expression}</div>
                        <div class="history-result">${item.result}</div>
                    </div>
                    <div class="history-time">${date.toLocaleString()}</div>
                </div>
            `;
        });
  
        historyList.innerHTML = historyHTML;
    }
  });
