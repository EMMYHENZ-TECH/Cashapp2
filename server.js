const express = require("express")
const bodyParser = require("body-parser")
const path = require("path")
const fs = require("fs")

const app = express()
const PORT = process.env.PORT || 7860

// Middleware
app.use(bodyParser.json())
app.use(express.static(path.join(__dirname, "public")))

// Create data directory if it doesn't exist
const dataDir = path.join(__dirname, "data")
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir)
}

// Initialize users.json if it doesn't exist
const usersPath = path.join(dataDir, "users.json")
if (!fs.existsSync(usersPath)) {
  // Create initial users with 10-digit account numbers
  const initialUsers = [
    {
      id: 1,
      name: "Demo User",
      email: "demo@example.com",
      password: "password",
      accountNumber: "7849123456",
      routingNumber: "663",
      balance: 5652.46,
    },
    {
      id: 2,
      name: "Jack William",
      email: "jack@example.com",
      password: "password",
      accountNumber: "1234567890",
      routingNumber: "456",
      balance: 1000.0,
    },
    {
      id: 3,
      name: "Kellen Bates",
      email: "kellen@example.com",
      password: "password",
      accountNumber: "1234567890",
      routingNumber: "789",
      balance: 2500.0,
    },
    {
      id: 4,
      name: "Kate Howard",
      email: "kate@example.com",
      password: "password",
      accountNumber: "2345678901",
      routingNumber: "456",
      balance: 3200.0,
    },
    {
      id: 5,
      name: "Julia Wilson",
      email: "julia@example.com",
      password: "password",
      accountNumber: "3456789012",
      routingNumber: "123",
      balance: 1800.0,
    },
    {
      id: 6,
      name: "Michael Johnson",
      email: "michael@example.com",
      password: "password",
      accountNumber: "4567890123",
      routingNumber: "789",
      balance: 4200.0,
    },
    {
      id: 7,
      name: "Sarah Parker",
      email: "sarah@example.com",
      password: "password",
      accountNumber: "5678901234",
      routingNumber: "456",
      balance: 2800.0,
    },
  ]

  fs.writeFileSync(usersPath, JSON.stringify(initialUsers, null, 2))
}

// Initialize transactions.json if it doesn't exist
const transactionsPath = path.join(dataDir, "transactions.json")
if (!fs.existsSync(transactionsPath)) {
  fs.writeFileSync(transactionsPath, JSON.stringify([], null, 2))
}

// Helper functions
function getUsers() {
  const usersData = fs.readFileSync(usersPath, "utf8")
  return JSON.parse(usersData)
}

function saveUsers(users) {
  fs.writeFileSync(usersPath, JSON.stringify(users, null, 2))
}

function getTransactions() {
  const transactionsData = fs.readFileSync(transactionsPath, "utf8")
  return JSON.parse(transactionsData)
}

function saveTransactions(transactions) {
  fs.writeFileSync(transactionsPath, JSON.stringify(transactions, null, 2))
}

function generateToken() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

// Generate a 10-digit account number
function generateAccountNumber() {
  return Math.floor(1000000000 + Math.random() * 9000000000).toString()
}

// Check if an account is an admin account
function isAdminAccount(email) {
  return email === "admin@example.com" || email === "emmy@gmail.com"
}

// Middleware to verify token
function verifyToken(req, res, next) {
  const bearerHeader = req.headers["authorization"]

  if (typeof bearerHeader !== "undefined") {
    const bearer = bearerHeader.split(" ")
    const token = bearer[1]

    // In a real app, you would verify the token
    // For this demo, we'll just check if it exists
    req.token = token
    next()
  } else {
    res.status(403).json({ message: "Unauthorized" })
  }
}

// Routes
// Register user
app.post("/api/auth/register", (req, res) => {
  const { name, email, password } = req.body

  // Get users
  const users = getUsers()

  // Check if user already exists
  const existingUser = users.find((user) => user.email === email)
  if (existingUser) {
    return res.status(400).json({ message: "User already exists" })
  }

  // Generate 10-digit account number and routing number
  const accountNumber = generateAccountNumber()
  const routingNumber = Math.floor(100 + Math.random() * 900).toString()

  // Create new user
  const newUser = {
    id: users.length + 1,
    name,
    email,
    password, // In a real app, you would hash the password
    accountNumber,
    routingNumber,
    balance: 0.0,
  }

  // Add user to users array
  users.push(newUser)

  // Save users
  saveUsers(users)

  // Generate token
  const token = generateToken()

  // Return user data (excluding password)
  const { password: _, ...userData } = newUser

  res.status(201).json({
    message: "User registered successfully",
    user: userData,
    token,
  })
})

// Login user
app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body

  // Get users
  const users = getUsers()

  // Find user
  const user = users.find((user) => user.email === email && user.password === password)

  if (!user) {
    return res.status(401).json({ message: "Invalid credentials" })
  }

  // Generate token
  const token = generateToken()

  // Return user data (excluding password)
  const { password: _, ...userData } = user

  res.json({
    message: "Login successful",
    user: userData,
    token,
  })
})

// Get user balance
app.get("/api/user/balance", verifyToken, (req, res) => {
  // Get user email from query
  const email = req.query.email

  // Get users
  const users = getUsers()

  // Find user by email
  const user = users.find((user) => user.email === email)

  if (!user) {
    return res.status(404).json({ message: "User not found" })
  }

  res.json({ balance: user.balance })
})

// Get user by account number
app.get("/api/user/account/:accountNumber", verifyToken, (req, res) => {
  const { accountNumber } = req.params

  // Get users
  const users = getUsers()

  // Find user by account number
  const user = users.find((user) => user.accountNumber === accountNumber)

  if (!user) {
    return res.status(404).json({ message: "User not found" })
  }

  // Return limited user data
  const userData = {
    id: user.id,
    name: user.name,
    accountNumber: user.accountNumber,
  }

  res.json({ user: userData })
})

// Transfer funds
app.post("/api/transfer", verifyToken, (req, res) => {
  const { amount, recipientAccountNumber, senderEmail, note } = req.body

  // Get users
  const users = getUsers()

  // Find sender by email
  const sender = users.find((user) => user.email === senderEmail)

  if (!sender) {
    return res.status(404).json({ message: "Sender not found" })
  }

  // Find recipient by account number
  const recipient = users.find((user) => user.accountNumber === recipientAccountNumber)

  if (!recipient) {
    return res.status(404).json({ message: "Recipient not found" })
  }

  // Check if sender is an admin account
  const senderIsAdmin = isAdminAccount(sender.email)

  // For non-admin accounts, check if they have enough balance
  if (!senderIsAdmin && sender.balance < Number.parseFloat(amount)) {
    return res.status(400).json({ message: "Insufficient balance" })
  }

  // Update balances
  // For admin accounts, don't reduce their balance
  if (!senderIsAdmin) {
    sender.balance -= Number.parseFloat(amount)
  }

  // For all recipients, add the exact amount transferred (not infinite)
  recipient.balance += Number.parseFloat(amount)

  // Save users
  saveUsers(users)

  // Get transactions
  const transactions = getTransactions()

  // Create transaction record
  const transaction = {
    id: transactions.length + 1,
    senderId: sender.id,
    senderName: sender.name,
    senderEmail: sender.email,
    recipientId: recipient.id,
    recipientName: recipient.name,
    recipientEmail: recipient.email,
    amount: Number.parseFloat(amount),
    timestamp: new Date().toISOString(),
    note: note || "Transfer",
  }

  // Add transaction to transactions array
  transactions.push(transaction)

  // Save transactions
  saveTransactions(transactions)

  res.json({
    message: "Transfer successful",
    transaction,
    senderBalance: sender.balance,
  })
})

// Process withdrawal
app.post("/api/withdraw", verifyToken, (req, res) => {
  const { amount, email } = req.body

  // Get users
  const users = getUsers()

  // Find user by email
  const user = users.find((user) => user.email === email)

  if (!user) {
    return res.status(404).json({ message: "User not found" })
  }

  // Check if user is an admin account
  const userIsAdmin = isAdminAccount(user.email)

  // For non-admin accounts, check if they have enough balance
  if (!userIsAdmin && user.balance < Number.parseFloat(amount)) {
    return res.status(400).json({ message: "Insufficient balance" })
  }

  // Update balance - for admin accounts, don't reduce their balance
  if (!userIsAdmin) {
    user.balance -= Number.parseFloat(amount)
  }

  // Save users
  saveUsers(users)

  // Get transactions
  const transactions = getTransactions()

  // Create transaction record
  const transaction = {
    id: transactions.length + 1,
    senderId: user.id,
    senderName: user.name,
    senderEmail: user.email,
    recipientId: null,
    recipientName: "Bank Withdrawal",
    recipientEmail: null,
    amount: Number.parseFloat(amount),
    timestamp: new Date().toISOString(),
    type: "withdrawal",
  }

  // Add transaction to transactions array
  transactions.push(transaction)

  // Save transactions
  saveTransactions(transactions)

  res.json({
    message: "Withdrawal successful",
    transaction,
    userBalance: user.balance,
  })
})

// Get user transactions
app.get("/api/transactions", verifyToken, (req, res) => {
  const { email } = req.query

  // Get transactions
  const transactions = getTransactions()

  // Filter transactions for the user
  const userTransactions = transactions.filter(
    (transaction) => transaction.senderEmail === email || transaction.recipientEmail === email,
  )

  res.json({ transactions: userTransactions })
})

// Catch-all route to serve the index.html
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"))
})

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
  console.log(`Visit http://localhost:${PORT} to view the app`)
})
