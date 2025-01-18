import React, { useState, useEffect } from 'react';
import './BlogGenerator.css';

const BlogGenerator = () => {
  const [domain, setDomain] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [topics, setTopics] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState('');
  const [outline, setOutline] = useState({});
  const [initialContent, setInitialContent] = useState('');
  const [finalContent, setFinalContent] = useState('');
  const [error, setError] = useState('');

  // Load saved content from localStorage on component mount
  useEffect(() => {
    const savedTopics = localStorage.getItem('topics');
    const savedOutline = localStorage.getItem('outline');
    const savedInitialContent = localStorage.getItem('initialContent');
    const savedFinalContent = localStorage.getItem('finalContent');

    if (savedTopics) setTopics(JSON.parse(savedTopics));
    if (savedOutline) setOutline(JSON.parse(savedOutline));
    if (savedInitialContent) setInitialContent(savedInitialContent);
    if (savedFinalContent) setFinalContent(savedFinalContent);
  }, []);

  const handleGenerate = async () => {
    // Reset state before generating new content
    setIsGenerating(true);
    setError('');
    setTopics([]);
    setOutline({});
    setInitialContent('');
    setFinalContent('');

    try {
        // Create EventSource for SSE
        const eventSource = new EventSource(
            `http://localhost:8000/generate-blog/stream?domain=${encodeURIComponent(domain)}&target_audience=${encodeURIComponent(targetAudience)}`
        );

        // Handle connection open
        eventSource.onopen = () => {
            console.log('SSE connection opened');
        };

        // Handle messages
        eventSource.onmessage = (event) => {
            try {
                if (!event.data) {
                    console.log('Empty event data received');
                    return;
                }
                
                // Remove any "data: " prefix if it exists
                const cleanData = event.data.replace(/^data: /, '');
                console.log('Clean data:', cleanData);
                
                const eventData = JSON.parse(cleanData);
                console.log('Parsed event data:', eventData);

                switch (eventData.event) {
                    case 'topics':
                        console.log('Setting topics:', eventData.data.topics);
                        setTopics(eventData.data.topics);
                        localStorage.setItem('topics', JSON.stringify(eventData.data.topics)); // Save to localStorage
                        break;
                    case 'outline':
                        console.log('Setting outline:', eventData.data.outline);
                        setOutline(eventData.data.outline);
                        setSelectedTopic(eventData.data.topic);
                        localStorage.setItem('outline', JSON.stringify(eventData.data.outline)); // Save to localStorage
                        break;
                    case 'initial_content':
                        console.log('Setting initial content');
                        setInitialContent(eventData.data.content);
                        localStorage.setItem('initialContent', eventData.data.content); // Save to localStorage
                        break;
                    case 'final_content':
                        console.log('Setting final content');
                        setFinalContent(eventData.data.content);
                        localStorage.setItem('finalContent', eventData.data.content); // Save to localStorage
                        setIsGenerating(false);
                        eventSource.close();
                        break;
                    case 'error':
                        console.error('Received error:', eventData.data.error);
                        setError(eventData.data.error);
                        setIsGenerating(false);
                        eventSource.close();
                        break;
                    default:
                        console.log('Unknown event type:', eventData.event);
                        break;
                }
            } catch (e) {
                console.error('Error parsing message:', e, 'Raw data:', event.data);
                setError('Error processing server response');
                setIsGenerating(false);
                eventSource.close();
            }
        };

        // Handle errors
        eventSource.onerror = (error) => {
            console.error('EventSource error:', error);
            setError('Connection error with the server');
            setIsGenerating(false);
            eventSource.close();
        };

    } catch (e) {
        console.error('Setup error:', e);
        setError('Failed to setup connection: ' + e.message);
        setIsGenerating(false);
    }
  };

  return (
    <div className="blog-generator">
      <div className="instruction-section">
        <h2>AI Blog Post Generator</h2>
        <p>This application allows you to generate blog posts using AI. Follow the steps below:</p>
        <ol>
          <li>Enter a domain (e.g., "artificial intelligence") and a target audience (e.g., "business professionals").</li>
          <li>Click the "Generate Blog" button to start the process.</li>
          <li>The application will generate topics, create an outline, write content, and polish it.</li>
        
        </ol>
        <p>Enjoy creating engaging blog posts with the help of AI!</p>
      </div>

      <div className="input-section">
        <div className="input-group">
          <label htmlFor="domain">Domain:</label>
          <input
            id="domain"
            type="text"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            placeholder="e.g., artificial intelligence"
          />
        </div>
        <div className="input-group">
          <label htmlFor="target-audience">Target Audience:</label>
          <input
            id="target-audience"
            type="text"
            value={targetAudience}
            onChange={(e) => setTargetAudience(e.target.value)}
            placeholder="e.g., business professionals"
          />
        </div>
        <button 
          onClick={handleGenerate} 
          disabled={isGenerating || !domain || !targetAudience}
        >
          {isGenerating ? 'Generating...' : 'Generate Blog'}
        </button>
      </div>

      {error && <div className="error">{error}</div>}

      <div className="results-section">
        {topics.length > 0 && (
          <div className="result-group">
            <h3>Generated Topics:</h3>
            <ul>
              {topics.map((topic, index) => (
                <li key={index}>{topic}</li>
              ))}
            </ul>
          </div>
        )}

        {Object.keys(outline).length > 0 && (
          <div className="result-group">
            <h3>Outline for: {selectedTopic}</h3>
            {Object.entries(outline).map(([section, points]) => (
              <div key={section}>
                <h4>{section}</h4>
                <ul>
                  {points.map((point, index) => (
                    <li key={index}>{point}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}

        {initialContent && (
          <div className="result-group">
            <h3>Initial Content:</h3>
            <div className="content">{initialContent}</div>
          </div>
        )}

        {finalContent && (
          <div className="result-group">
            <h3>Final Content:</h3>
            <div className="content">{finalContent}</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BlogGenerator; 