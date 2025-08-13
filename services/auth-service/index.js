const express = require("express")
const cors = require("cors")
const { createClient } = require("@supabase/supabase-js")

const app = express()
const port = process.env.PORT || 3001

// Middleware
app.use(cors())
app.use(express.json())

// Supabase client
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "healthy", service: "auth-service" })
})

// Authentication endpoints
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      return res.status(400).json({ error: error.message })
    }

    res.json({ user: data.user, session: data.session })
  } catch (error) {
    res.status(500).json({ error: "Internal server error" })
  }
})

app.post("/register", async (req, res) => {
  try {
    const { email, password, metadata } = req.body

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
      },
    })

    if (error) {
      return res.status(400).json({ error: error.message })
    }

    res.json({ user: data.user, session: data.session })
  } catch (error) {
    res.status(500).json({ error: "Internal server error" })
  }
})

app.post("/logout", async (req, res) => {
  try {
    const { error } = await supabase.auth.signOut()

    if (error) {
      return res.status(400).json({ error: error.message })
    }

    res.json({ message: "Logged out successfully" })
  } catch (error) {
    res.status(500).json({ error: "Internal server error" })
  }
})

app.listen(port, () => {
  console.log(`Auth service running on port ${port}`)
})
