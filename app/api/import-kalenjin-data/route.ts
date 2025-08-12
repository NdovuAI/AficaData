import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST() {
  try {
    const supabase = createClient()

    // Fetch CSV data
    const csvUrl =
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/knbs_medal_medquad_healthcare_en_1_35000_batch_8%20-%20Sheet1-ut56iABa2SAjCwAbNyJ7ZlYcq9EK34.csv"

    const response = await fetch(csvUrl)
    if (!response.ok) {
      throw new Error("Failed to fetch CSV data")
    }

    const csvText = await response.text()
    const lines = csvText.split("\n")
    const headers = lines[0].split(",").map((h) => h.replace(/"/g, "").trim())

    const records = []

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line) continue

      // Simple CSV parsing (assumes no commas in quoted fields)
      const values = line.split(",").map((v) => v.replace(/"/g, "").trim())

      if (values.length >= 6) {
        records.push({
          serial_number: values[0] || "",
          source: values[1] || "MedQuAD",
          topic: values[2] || "Healthcare",
          original_english: values[3] || "",
          kalenjin_translation: values[4] || "",
          language_dialect: values[5] || "Nandi",
        })
      }
    }

    // Filter out empty records
    const validRecords = records.filter((r) => r.original_english && r.kalenjin_translation)

    // Insert data in batches
    const batchSize = 100
    let insertedCount = 0

    for (let i = 0; i < validRecords.length; i += batchSize) {
      const batch = validRecords.slice(i, i + batchSize)

      const { error } = await supabase.from("kalenjin_healthcare_data").insert(batch)

      if (error) {
        console.error("Batch insert error:", error)
        // Continue with next batch
      } else {
        insertedCount += batch.length
      }
    }

    // Create corresponding English sentences
    const { error: sentenceError } = await supabase.rpc("create_sentences_from_healthcare_data")

    if (sentenceError) {
      console.error("Error creating sentences:", sentenceError)
    }

    return NextResponse.json({
      success: true,
      count: insertedCount,
      message: `Successfully imported ${insertedCount} healthcare translation records`,
    })
  } catch (error) {
    console.error("Import error:", error)
    return NextResponse.json({ error: "Failed to import data" }, { status: 500 })
  }
}
