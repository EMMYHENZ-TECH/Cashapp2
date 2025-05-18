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

// Load user data and initialize withdraw page
function initWithdrawPage() {
  // Check if user is logged in
  const userJson = localStorage.getItem("user")
  if (!userJson) {
    window.location.href = "/index.html"
    return
  }

  const user = JSON.parse(userJson)
  const balance = user.balance
  const isAdmin = user.email === "admin@example.com" || user.email === "emmy@gmail.com"

  // Update UI with user data
  document.getElementById("balance-amount").textContent = "$" + formatCurrency(balance)
  document.getElementById("withdraw-available").textContent = "$" + formatCurrency(balance) + " AVAILABLE"
  document.getElementById("withdraw-amount").textContent = "$" + formatCurrency(balance)

  // Set slider max value to balance (in cents to avoid floating point issues)
  // For extremely large balances, cap at a reasonable maximum
  const slider = document.getElementById("amount-slider")

  // For admin accounts, set a high but reasonable max
  // For regular users, use their actual balance
  const maxSliderValue = isAdmin
    ? 1000000000 * 100
    : // Cap at 1 billion for admin
      Math.min(balance * 100, 1000000000 * 100) // Cap at user balance or 1 billion, whichever is smaller

  slider.max = maxSliderValue
  slider.value = maxSliderValue

  // Update amount when slider changes
  slider.addEventListener("input", () => {
    const amount = slider.value / 100
    document.getElementById("withdraw-amount").textContent = "$" + formatCurrency(amount)
  })
}

// Process withdrawal
async function processWithdrawal(amount) {
  try {
    const token = localStorage.getItem("token")
    const user = JSON.parse(localStorage.getItem("user"))

    // Make API call to process the withdrawal
    const response = await fetch("/api/withdraw", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        amount,
        email: user.email,
      }),
    })

    const data = await response.json()

    if (response.ok) {
      // Update user balance in localStorage
      user.balance = data.userBalance
      localStorage.setItem("user", JSON.stringify(user))

      // Store withdrawal amount for success page
      sessionStorage.setItem("withdrawAmount", amount)

      // Record the transaction time
      const now = new Date()
      sessionStorage.setItem("withdrawTime", now.toISOString())

      return { success: true }
    } else {
      return { success: false, message: data.message }
    }
  } catch (error) {
    console.error("Withdrawal error:", error)
    return { success: false, message: "An error occurred. Please try again." }
  }
}

// Event listeners
document.addEventListener("DOMContentLoaded", () => {
  // Initialize page
  initWithdrawPage()

  // Back button
  const backBtn = document.getElementById("back-btn")
  if (backBtn) {
    backBtn.addEventListener("click", () => {
      window.location.href = "/dashboard.html"
    })
  }

  // Withdraw button
  const withdrawBtn = document.getElementById("withdraw-btn")
  if (withdrawBtn) {
    withdrawBtn.addEventListener("click", async () => {
      const slider = document.getElementById("amount-slider")
      const amount = slider.value / 100

      if (amount <= 0) {
        alert("Please enter an amount greater than 0")
        return
      }

      // Show loading state
      withdrawBtn.textContent = "Processing..."
      withdrawBtn.disabled = true

      const result = await processWithdrawal(amount)

      if (result.success) {
        window.location.href = "/withdraw-success.html"
      } else {
        alert(result.message || "Withdrawal failed. Please try again.")
        withdrawBtn.textContent = "Cash Out"
        withdrawBtn.disabled = false
      }
    })
  }
})
