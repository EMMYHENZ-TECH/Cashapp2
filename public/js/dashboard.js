// Format currency
function formatCurrency(amount) {
  // Check if user is admin
  const user = JSON.parse(localStorage.getItem("user") || "{}")
  const isAdmin = user.email === "admin@example.com" || user.email === "emmy@gmail.com"

  // For admin accounts with extremely large numbers, show infinity symbol
  if (isAdmin && amount > 999999999999) {
    return "∞"
  }

  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

// Format currency for short display (e.g. $5.6K)
function formatShortCurrency(amount) {
  // Check if user is admin
  const user = JSON.parse(localStorage.getItem("user") || "{}")
  const isAdmin = user.email === "admin@example.com" || user.email === "emmy@gmail.com"

  // For admin accounts with extremely large numbers, show infinity symbol
  if (isAdmin && amount > 999999999999) {
    return "$∞" // Show infinity symbol for extremely large values
  } else if (amount >= 1000) {
    return "$" + (amount / 1000).toFixed(1) + "K"
  }
  return "$" + amount.toFixed(0)
}

// Load user data
async function loadUserData() {
  // Check if user is logged in
  const userJson = localStorage.getItem("user")
  if (!userJson) {
    window.location.href = "/index.html"
    return
  }

  const user = JSON.parse(userJson)

  // Update UI with user data
  document.getElementById("balance-amount").textContent = "$" + formatCurrency(user.balance)
  document.getElementById("account-number").textContent = "Account•" + user.accountNumber.slice(-4)
  document.getElementById("routing-number").textContent = "Routing•" + user.routingNumber
  document.getElementById("balance-short").textContent = formatShortCurrency(user.balance)

  // Update profile dropdown
  document.getElementById("profile-name").textContent = user.name
  document.getElementById("profile-email").textContent = user.email

  // Fetch latest balance from server
  try {
    const token = localStorage.getItem("token")
    const response = await fetch(`/api/user/balance?email=${encodeURIComponent(user.email)}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (response.ok) {
      const data = await response.json()

      // Update user data in localStorage
      user.balance = data.balance
      localStorage.setItem("user", JSON.stringify(user))

      // Update UI
      document.getElementById("balance-amount").textContent = "$" + formatCurrency(data.balance)
      document.getElementById("balance-short").textContent = formatShortCurrency(data.balance)
    }
  } catch (error) {
    console.error("Error fetching balance:", error)
  }
}

// Event listeners
document.addEventListener("DOMContentLoaded", () => {
  // Load user data
  loadUserData()

  // Profile dropdown toggle
  const profilePic = document.getElementById("profile-pic")
  const profileDropdown = document.getElementById("profile-dropdown")

  if (profilePic && profileDropdown) {
    profilePic.addEventListener("click", () => {
      profileDropdown.classList.toggle("active")
    })

    // Close dropdown when clicking outside
    document.addEventListener("click", (event) => {
      if (!profilePic.contains(event.target) && !profileDropdown.contains(event.target)) {
        profileDropdown.classList.remove("active")
      }
    })
  }

  // Logout button
  const logoutBtn = document.getElementById("logout-btn")
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      localStorage.removeItem("token")
      localStorage.removeItem("user")
      window.location.href = "/index.html"
    })
  }

  // Add money button
  const addMoneyBtn = document.getElementById("add-money-btn")
  if (addMoneyBtn) {
    addMoneyBtn.addEventListener("click", () => {
      window.location.href = "/404.html"
    })
  }

  // Withdraw button
  const withdrawBtn = document.getElementById("withdraw-btn")
  if (withdrawBtn) {
    withdrawBtn.addEventListener("click", () => {
      window.location.href = "/withdraw.html"
    })
  }
})
