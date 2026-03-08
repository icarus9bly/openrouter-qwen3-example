const chatMessages = document.getElementById('chatMessages');
const userInput = document.getElementById('userInput');
const chatForm = document.getElementById('chatForm');
const sendButton = document.getElementById('sendButton');
const buttonText = sendButton.querySelector('.button-text');
const spinner = sendButton.querySelector('.spinner');

// Track streaming state for debouncing
let streamingDebounceTimer = null;
const STREAMING_RENDER_INTERVAL = 100; // Update markdown every 100ms during streaming

// Focus on input when page loads
userInput.focus();

// Create a reference to the current message element being streamed
let currentMessageElement = null;

// Handle form submission
chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const message = userInput.value.trim();
    if (!message) return;
    
    // Disable input and send button while processing
    userInput.disabled = true;
    sendButton.disabled = true;
    buttonText.classList.add('hidden');
    spinner.classList.remove('hidden');
    
    // Add user message to chat
    addMessage(message, 'user');
    
    // Clear input
    userInput.value = '';
    
    // Create a new message element for streaming response
    currentMessageElement = createStreamingMessageElement('assistant');
    
    try {
        // Send message to backend with streaming
        const response = await fetch('/api/chat-stream', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message: message })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            addMessage('Error: ' + (errorData.error || 'Failed to get response'), 'error');
            currentMessageElement.remove();
            currentMessageElement = null;
        } else {
            // Handle streaming response
            await handleStreamingResponse(response);
        }
    } catch (error) {
        // Add error message
        addMessage('Error: ' + error.message, 'error');
        if (currentMessageElement) {
            currentMessageElement.remove();
            currentMessageElement = null;
        }
    } finally {
        // Re-enable input and send button
        userInput.disabled = false;
        sendButton.disabled = false;
        buttonText.classList.remove('hidden');
        spinner.classList.add('hidden');
        userInput.focus();
        currentMessageElement = null;
    }
});

async function handleStreamingResponse(response) {
    // Parse and handle server-sent events streaming response
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    
    try {
        while (true) {
            const { done, value } = await reader.read();
            
            if (done) break;
            
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            
            // Keep the last incomplete line in the buffer
            buffer = lines[lines.length - 1];
            
            // Process complete lines
            for (let i = 0; i < lines.length - 1; i++) {
                const line = lines[i];
                
                if (line.startsWith('data: ')) {
                    try {
                        const data = JSON.parse(line.slice(6));
                        
                        if (data.error) {
                            addMessage('Error: ' + data.error, 'error');
                            if (currentMessageElement) {
                                currentMessageElement.remove();
                                currentMessageElement = null;
                            }
                        } else if (data.done) {
                            // Stream finished, final render
                            if (currentMessageElement) {
                                currentMessageElement.classList.remove('streaming');
                                renderMarkdown(currentMessageElement.querySelector('.message-content'));
                            }
                        } else if (data.content) {
                            // Add content chunk to current message
                            if (currentMessageElement) {
                                const contentDiv = currentMessageElement.querySelector('.message-content');
                                contentDiv.textContent += data.content;
                                
                                // Debounce markdown rendering during streaming
                                clearTimeout(streamingDebounceTimer);
                                streamingDebounceTimer = setTimeout(() => {
                                    renderMarkdown(contentDiv);
                                }, STREAMING_RENDER_INTERVAL);
                                
                                // Auto-scroll
                                chatMessages.scrollTop = chatMessages.scrollHeight;
                            }
                        }
                    } catch (e) {
                        console.error('Failed to parse SSE data:', e);
                    }
                }
            }
        }
    } catch (error) {
        console.error('Streaming error:', error);
        addMessage('Error: Connection interrupted', 'error');
        if (currentMessageElement) {
            currentMessageElement.remove();
            currentMessageElement = null;
        }
    }
}

function createStreamingMessageElement(role) {
    // Create a new message element for streaming content
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role} streaming`;
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    contentDiv.textContent = '';
    
    messageDiv.appendChild(contentDiv);
    chatMessages.appendChild(messageDiv);
    
    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    return messageDiv;
}

function renderMarkdown(element) {
    // Render markdown in an element after streaming
    // Handles both complete and partial content gracefully
    if (typeof marked !== 'undefined' && typeof DOMPurify !== 'undefined') {
        const text = element.textContent;
        
        // Skip rendering if text is too short
        if (text.length < 2) {
            return;
        }
        
        try {
            const htmlContent = marked.parse(text);
            const cleanHtml = DOMPurify.sanitize(htmlContent);
            
            // Only update if content has changed to reduce flickering
            if (element.innerHTML !== cleanHtml) {
                element.innerHTML = cleanHtml;
            }
        } catch (e) {
            // If markdown parsing fails, keep the raw text
            console.warn('Markdown rendering error:', e);
        }
    }
}

function addMessage(text, role) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role}`;
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    
    // For assistant messages, render markdown; for user messages, use plain text
    if (role === 'assistant') {
        const htmlContent = marked.parse(text);
        const cleanHtml = DOMPurify.sanitize(htmlContent);
        contentDiv.innerHTML = cleanHtml;
    } else {
        contentDiv.textContent = text;
    }
    
    messageDiv.appendChild(contentDiv);
    chatMessages.appendChild(messageDiv);
    
    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Allow Enter key to send (Shift+Enter for new line)
userInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        chatForm.dispatchEvent(new Event('submit'));
    }
});
