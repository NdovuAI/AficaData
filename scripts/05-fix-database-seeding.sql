-- First, let's check if the table exists and is empty
SELECT COUNT(*) as current_count FROM english_sentences;

-- If the table is empty, let's insert the sentences again
-- This script will only insert if the table is empty to avoid duplicates

DO $$
BEGIN
    -- Only proceed if the table is empty
    IF (SELECT COUNT(*) FROM english_sentences) = 0 THEN
        
        -- Insert 100 sample English sentences with various categories and difficulty levels
        INSERT INTO english_sentences (text_content, category, difficulty_level) VALUES
        -- Easy General sentences (20 sentences)
        ('Hello, how are you today?', 'conversation', 'easy'),
        ('The sun is shining brightly.', 'general', 'easy'),
        ('I like to eat apples.', 'general', 'easy'),
        ('What is your name?', 'conversation', 'easy'),
        ('The cat is sleeping.', 'general', 'easy'),
        ('I am going to school.', 'general', 'easy'),
        ('She has a red car.', 'general', 'easy'),
        ('We are happy today.', 'conversation', 'easy'),
        ('The book is on the table.', 'general', 'easy'),
        ('I love my family.', 'conversation', 'easy'),
        ('The water is cold.', 'general', 'easy'),
        ('He is a good teacher.', 'general', 'easy'),
        ('The children are playing.', 'general', 'easy'),
        ('I need some help.', 'conversation', 'easy'),
        ('The food tastes good.', 'general', 'easy'),
        ('She is wearing a blue dress.', 'general', 'easy'),
        ('The dog is barking.', 'general', 'easy'),
        ('I want to go home.', 'conversation', 'easy'),
        ('The flowers are beautiful.', 'general', 'easy'),
        ('He works in an office.', 'general', 'easy'),

        -- Medium News sentences (15 sentences)
        ('The government announced new policies to improve healthcare access.', 'news', 'medium'),
        ('Climate change continues to affect agricultural productivity across the region.', 'news', 'medium'),
        ('The local market experienced significant price fluctuations this week.', 'news', 'medium'),
        ('Education reforms are being implemented in primary schools nationwide.', 'news', 'medium'),
        ('The community organized a successful fundraising event for the hospital.', 'news', 'medium'),
        ('Technology companies are investing heavily in renewable energy solutions.', 'news', 'medium'),
        ('The transportation system requires urgent infrastructure improvements.', 'news', 'medium'),
        ('Small businesses are adapting to digital payment methods.', 'news', 'medium'),
        ('The university launched a new scholarship program for underprivileged students.', 'news', 'medium'),
        ('Local farmers are adopting modern irrigation techniques to increase yields.', 'news', 'medium'),
        ('The election results showed a significant shift in voter preferences.', 'news', 'medium'),
        ('Healthcare workers received recognition for their dedicated service during the pandemic.', 'news', 'medium'),
        ('The new trade agreement will boost economic cooperation between countries.', 'news', 'medium'),
        ('Environmental conservation efforts are gaining momentum in urban areas.', 'news', 'medium'),
        ('The tourism industry is recovering after months of reduced activity.', 'news', 'medium'),

        -- Medium General sentences (15 sentences)
        ('Despite the challenges, she managed to complete her degree successfully.', 'general', 'medium'),
        ('The conference brought together experts from various fields of study.', 'general', 'medium'),
        ('His dedication to community service earned him widespread recognition.', 'general', 'medium'),
        ('The project requires careful planning and coordination between departments.', 'general', 'medium'),
        ('She demonstrated exceptional leadership skills during the crisis.', 'general', 'medium'),
        ('The research findings could have significant implications for future policy.', 'general', 'medium'),
        ('They established a partnership to address environmental conservation issues.', 'general', 'medium'),
        ('The workshop provided valuable insights into sustainable development practices.', 'general', 'medium'),
        ('His innovative approach to problem-solving impressed the entire team.', 'general', 'medium'),
        ('The organization is committed to promoting gender equality in the workplace.', 'general', 'medium'),
        ('The training program enhanced participants'' professional development opportunities.', 'general', 'medium'),
        ('Cultural diversity enriches our understanding of different perspectives and traditions.', 'general', 'medium'),
        ('The mentorship program connects experienced professionals with young graduates.', 'general', 'medium'),
        ('Effective communication skills are essential for building strong relationships.', 'general', 'medium'),
        ('The volunteer initiative made a positive impact on the local community.', 'general', 'medium'),

        -- Medium Literature sentences (10 sentences)
        ('The protagonist faced a moral dilemma that would define his character.', 'literature', 'medium'),
        ('Her words carried the weight of generations of wisdom and experience.', 'literature', 'medium'),
        ('The village elder shared stories that had been passed down through centuries.', 'literature', 'medium'),
        ('In the silence of dawn, she contemplated the meaning of her journey.', 'literature', 'medium'),
        ('The ancient baobab tree stood as a testament to the endurance of nature.', 'literature', 'medium'),
        ('His laughter echoed through the valley, bringing joy to all who heard it.', 'literature', 'medium'),
        ('The rhythm of the drums spoke a language older than words themselves.', 'literature', 'medium'),
        ('She wove tales of courage and hope into the fabric of everyday life.', 'literature', 'medium'),
        ('The marketplace buzzed with the energy of a thousand conversations.', 'literature', 'medium'),
        ('Under the starlit sky, the community gathered to celebrate their heritage.', 'literature', 'medium'),

        -- Medium Conversation sentences (10 sentences)
        ('Could you please explain how this process works in more detail?', 'conversation', 'medium'),
        ('I appreciate your patience while we resolve this technical issue.', 'conversation', 'medium'),
        ('Would it be possible to reschedule our meeting for next Tuesday?', 'conversation', 'medium'),
        ('I understand your concerns, and I will address them immediately.', 'conversation', 'medium'),
        ('The presentation was informative, but I have a few questions.', 'conversation', 'medium'),
        ('I would like to discuss the proposal with my colleagues first.', 'conversation', 'medium'),
        ('Thank you for taking the time to consider our request.', 'conversation', 'medium'),
        ('I believe there might be a misunderstanding that we should clarify.', 'conversation', 'medium'),
        ('Could you provide more information about the requirements?', 'conversation', 'medium'),
        ('I look forward to hearing your feedback on this matter.', 'conversation', 'medium'),

        -- Hard Technical sentences (10 sentences)
        ('The implementation of blockchain technology requires sophisticated cryptographic protocols.', 'technical', 'hard'),
        ('Quantum computing algorithms demonstrate exponential speedup for specific computational problems.', 'technical', 'hard'),
        ('The neural network architecture incorporates attention mechanisms for improved performance.', 'technical', 'hard'),
        ('Distributed systems must handle consistency, availability, and partition tolerance trade-offs.', 'technical', 'hard'),
        ('The optimization algorithm converges to a local minimum through gradient descent iterations.', 'technical', 'hard'),
        ('Microservices architecture enables scalable and maintainable software development practices.', 'technical', 'hard'),
        ('The database indexing strategy significantly impacts query execution performance.', 'technical', 'hard'),
        ('Machine learning models require extensive hyperparameter tuning for optimal results.', 'technical', 'hard'),
        ('The encryption protocol ensures data integrity and confidentiality during transmission.', 'technical', 'hard'),
        ('Cloud computing infrastructure provides elastic scalability for enterprise applications.', 'technical', 'hard'),

        -- Hard Literature sentences (10 sentences)
        ('The metaphysical implications of his philosophical treatise challenged conventional wisdom.', 'literature', 'hard'),
        ('Her prose exhibited a profound understanding of the human condition and existential angst.', 'literature', 'hard'),
        ('The narrative structure employed non-linear temporality to explore themes of memory and identity.', 'literature', 'hard'),
        ('His allegorical representation of societal decay resonated with contemporary political discourse.', 'literature', 'hard'),
        ('The juxtaposition of traditional folklore with modern sensibilities created a compelling dichotomy.', 'literature', 'hard'),
        ('Her literary criticism deconstructed the colonial narrative embedded in canonical texts.', 'literature', 'hard'),
        ('The protagonist''s psychological transformation reflected broader themes of cultural displacement.', 'literature', 'hard'),
        ('The author''s use of magical realism blurred the boundaries between reality and imagination.', 'literature', 'hard'),
        ('The epistolary novel revealed the complexity of interpersonal relationships across generations.', 'literature', 'hard'),
        ('His poetic language transcended linguistic barriers to convey universal human experiences.', 'literature', 'hard'),

        -- Hard News sentences (10 sentences)
        ('The geopolitical ramifications of the trade agreement extend beyond bilateral economic relations.', 'news', 'hard'),
        ('Epidemiological studies indicate a correlation between environmental factors and public health outcomes.', 'news', 'hard'),
        ('The constitutional amendment requires a two-thirds majority in both legislative chambers.', 'news', 'hard'),
        ('Macroeconomic indicators suggest potential volatility in emerging market currencies.', 'news', 'hard'),
        ('The diplomatic negotiations involve complex multilateral agreements and sovereignty considerations.', 'news', 'hard'),
        ('Biotechnology innovations present both therapeutic opportunities and ethical dilemmas.', 'news', 'hard'),
        ('The judicial ruling establishes precedent for future cases involving intellectual property rights.', 'news', 'hard'),
        ('Sustainable development goals require coordinated efforts across governmental and non-governmental sectors.', 'news', 'hard'),
        ('The monetary policy decisions reflect central bank concerns about inflationary pressures.', 'news', 'hard'),
        ('International humanitarian law governs the conduct of armed conflicts and protection of civilians.', 'news', 'hard'),

        -- Hard General sentences (10 sentences)
        ('The epistemological framework underlying scientific methodology emphasizes empirical validation.', 'general', 'hard'),
        ('Interdisciplinary collaboration facilitates innovative solutions to complex societal challenges.', 'general', 'hard'),
        ('The phenomenological approach to research prioritizes subjective experience and interpretation.', 'general', 'hard'),
        ('Systemic inequalities perpetuate disparities in educational and economic opportunities.', 'general', 'hard'),
        ('The paradigmatic shift in theoretical understanding necessitates methodological adaptations.', 'general', 'hard'),
        ('Cognitive biases influence decision-making processes in predictable and measurable ways.', 'general', 'hard'),
        ('The dialectical relationship between theory and practice informs pedagogical approaches.', 'general', 'hard'),
        ('Organizational culture significantly impacts employee engagement and productivity metrics.', 'general', 'hard'),
        ('The hermeneutical interpretation of historical texts requires contextual understanding.', 'general', 'hard'),
        ('Technological determinism versus social construction debates shape innovation policy frameworks.', 'general', 'hard');

        RAISE NOTICE 'Successfully inserted 100 English sentences into the database.';
    ELSE
        RAISE NOTICE 'English sentences already exist in the database. Current count: %', (SELECT COUNT(*) FROM english_sentences);
    END IF;
END $$;

-- Verify the insertion
SELECT 
    COUNT(*) as total_sentences,
    COUNT(DISTINCT category) as unique_categories,
    COUNT(DISTINCT difficulty_level) as unique_difficulties
FROM english_sentences;

-- Show distribution
SELECT 
    category,
    difficulty_level,
    COUNT(*) as count
FROM english_sentences 
GROUP BY category, difficulty_level 
ORDER BY category, difficulty_level;
