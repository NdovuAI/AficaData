import requests
import csv
import json
from io import StringIO

def fetch_and_process_csv():
    """Fetch CSV data from the provided URL and generate SQL insert statements"""
    
    csv_url = "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/knbs_medal_medquad_healthcare_en_1_35000_batch_8%20-%20Sheet1-ut56iABa2SAjCwAbNyJ7ZlYcq9EK34.csv"
    
    try:
        # Fetch the CSV data
        print("Fetching CSV data...")
        response = requests.get(csv_url)
        response.raise_for_status()
        
        # Parse CSV
        csv_content = StringIO(response.text)
        reader = csv.DictReader(csv_content)
        
        # Generate SQL insert statements
        sql_statements = []
        sql_statements.append("-- Insert Kalenjin healthcare translation data")
        sql_statements.append("INSERT INTO kalenjin_healthcare_data (serial_number, source, topic, original_english, kalenjin_translation, language_dialect) VALUES")
        
        values = []
        count = 0
        
        for row in reader:
            # Clean and escape the data
            serial_number = row.get('S. No.', '').replace("'", "''")
            source = row.get('Source', 'MedQuAD').replace("'", "''")
            topic = row.get('Topic', 'Healthcare').replace("'", "''")
            original_english = row.get('Original Kis/En', '').replace("'", "''")
            kalenjin_translation = row.get('Local Language Translation', '').replace("'", "''")
            language_dialect = row.get('Language Dialect', 'Nandi').replace("'", "''")
            
            # Skip empty rows
            if not original_english or not kalenjin_translation:
                continue
                
            value = f"('{serial_number}', '{source}', '{topic}', '{original_english}', '{kalenjin_translation}', '{language_dialect}')"
            values.append(value)
            count += 1
            
            # Batch insert every 100 records
            if count % 100 == 0:
                sql_statements.append(',\n'.join(values) + ';')
                sql_statements.append(f"\n-- Inserted {count} records so far...")
                sql_statements.append("INSERT INTO kalenjin_healthcare_data (serial_number, source, topic, original_english, kalenjin_translation, language_dialect) VALUES")
                values = []
        
        # Insert remaining records
        if values:
            sql_statements.append(',\n'.join(values) + ';')
        
        # Generate corresponding english_sentences entries
        sql_statements.append(f"\n-- Insert corresponding English sentences from healthcare data")
        sql_statements.append("""
INSERT INTO english_sentences (text_content, category, difficulty_level, source, topic, serial_number, is_active)
SELECT DISTINCT 
    original_english,
    'healthcare',
    'medium',
    source,
    topic,
    serial_number,
    true
FROM kalenjin_healthcare_data 
WHERE NOT EXISTS (
    SELECT 1 FROM english_sentences 
    WHERE text_content = kalenjin_healthcare_data.original_english
);
""")
        
        # Generate translations entries
        sql_statements.append(f"\n-- Create translation entries for the healthcare data")
        sql_statements.append("""
INSERT INTO translations (english_sentence_id, translator_id, translated_text, target_language, language_dialect, review_status)
SELECT 
    es.id,
    '00000000-0000-0000-0000-000000000001'::uuid, -- Sample translator ID
    khd.kalenjin_translation,
    'kalenjin',
    khd.language_dialect,
    'pending'
FROM kalenjin_healthcare_data khd
JOIN english_sentences es ON es.text_content = khd.original_english
WHERE NOT EXISTS (
    SELECT 1 FROM translations t 
    WHERE t.english_sentence_id = es.id 
    AND t.translated_text = khd.kalenjin_translation
);
""")
        
        # Mark data as processed
        sql_statements.append(f"\n-- Mark healthcare data as processed")
        sql_statements.append("UPDATE kalenjin_healthcare_data SET processed = true;")
        
        print(f"Successfully processed {count} records")
        return '\n'.join(sql_statements)
        
    except Exception as e:
        print(f"Error processing CSV: {e}")
        return f"-- Error processing CSV: {e}"

if __name__ == "__main__":
    sql_content = fetch_and_process_csv()
    
    # Write to SQL file
    with open('04-insert-kalenjin-data.sql', 'w', encoding='utf-8') as f:
        f.write(sql_content)
    
    print("SQL file generated: 04-insert-kalenjin-data.sql")
    print("Run this script to generate the SQL insert statements for the Kalenjin healthcare data.")
