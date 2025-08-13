import pandas as pd
import requests
import json
from io import StringIO

def fetch_and_process_bbc_data():
    """Fetch BBC news data and process it for database insertion"""
    
    # Fetch the CSV data
    url = "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/bbc_news_en_swa_revised_8001_95220_batch_17.xlsx%20-%20Sheet1-V0WYDvFFShQR6UH2rMaMLqo4YTQlFm.csv"
    
    try:
        response = requests.get(url)
        response.raise_for_status()
        
        # Read CSV data
        df = pd.read_csv(StringIO(response.text))
        
        print(f"Loaded {len(df)} rows of BBC news data")
        print("Columns:", df.columns.tolist())
        print("\nFirst few rows:")
        print(df.head())
        
        # Process the data
        processed_data = []
        
        for index, row in df.iterrows():
            # Extract data based on the schema
            s_no = str(row.get('S.No.', ''))
            source = str(row.get('Source', 'ANC BBC Africa'))
            topic = str(row.get('Topic', 'News'))
            original_text = str(row.get('Original Kis/Eng', ''))
            translation = str(row.get('Local Language Translation', ''))
            dialect = str(row.get('Language Dialect', 'Nandi'))
            
            # Determine if original is English or Swahili
            # Simple heuristic: if it contains common Swahili words, it's Swahili
            swahili_indicators = ['na', 'ya', 'wa', 'ni', 'kwa', 'hii', 'hiyo', 'kwamba', 'katika']
            is_swahili = any(word in original_text.lower() for word in swahili_indicators)
            
            processed_data.append({
                'serial_number': s_no,
                'source': source,
                'topic': topic,
                'original_text': original_text,
                'original_language': 'swahili' if is_swahili else 'english',
                'translated_text': translation,
                'target_language': 'kalenjin',
                'dialect': dialect,
                'category': 'news'
            })
        
        # Generate SQL insert statements
        sql_statements = []
        
        for item in processed_data:
            # Escape single quotes in text
            original_text = item['original_text'].replace("'", "''")
            translated_text = item['translated_text'].replace("'", "''")
            
            sql = f"""
INSERT INTO standard_sentences (
    serial_number, source, topic, original_text, original_language, 
    translated_text, target_language, dialect, category, is_active
) VALUES (
    '{item['serial_number']}', '{item['source']}', '{item['topic']}', 
    '{original_text}', '{item['original_language']}', 
    '{translated_text}', '{item['target_language']}', 
    '{item['dialect']}', '{item['category']}', true
);"""
            sql_statements.append(sql)
        
        # Write to SQL file
        with open('scripts/06-insert-bbc-data.sql', 'w', encoding='utf-8') as f:
            f.write("-- BBC News Data Insert Script\n")
            f.write("-- Generated from BBC news English/Swahili to Kalenjin translations\n\n")
            f.write('\n'.join(sql_statements))
        
        print(f"\nGenerated SQL file with {len(sql_statements)} insert statements")
        print("File saved as: scripts/06-insert-bbc-data.sql")
        
        return processed_data
        
    except Exception as e:
        print(f"Error processing BBC data: {e}")
        return []

if __name__ == "__main__":
    fetch_and_process_bbc_data()
