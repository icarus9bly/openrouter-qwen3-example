# Qwen3 Chat Interface

A modern web-based chat interface for interacting with Qwen3 AI model via OpenRouter API.

## Features

- **Clean Chat UI** - Modern chat-style interface with real-time message updates  
- **Real-time Responses** - Seamless conversation flow with loading indicators  
- **Beautiful Design** - Responsive gradient UI that works on mobile and desktop  
- **Continuous Conversation** - Chat back and forth naturally  
- **Secure** - Uses Infisical for secure credential management  

## Setup

1. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

2. **Configure Infisical credentials** (or update the `get_openrouter_key()` function in `app.py` to match your setup):
   ```bash
   python -c "import keyring; keyring.set_password('infisical', 'client_id', 'your-client-id')"
   python -c "import keyring; keyring.set_password('infisical', 'client_secret', 'your-client-secret')"
   python -c "import keyring; keyring.set_password('infisical', 'project_id', 'your-project-id')"
   ```

3. **Run the Flask server**:
   ```bash
   python app.py
   ```

4. **Open in browser**:
   - Navigate to `http://localhost:5000`
   - Start chatting!

## Architecture

### Backend (`app.py`)
- Flask web server that serves the chat interface
- Provides `/api/chat` endpoint for processing messages
- Handles OpenRouter API calls using credentials from Infisical
- Returns AI responses in JSON format

### Frontend
- **HTML** (`templates/index.html`) - Chat interface structure
- **CSS** (`static/style.css`) - Modern styling with gradients and animations
- **JavaScript** (`static/script.js`) - Handles user input and real-time updates

## Usage

1. Type your message in the input field at the bottom
2. Press Enter or click Send
3. Watch as the AI processes your request
4. Receive the response and continue the conversation

## Keyboard Shortcuts

- **Enter** - Send message
- **Shift + Enter** - New line (if multi-line input is added)

## Troubleshooting

### Port already in use
If port 5000 is already in use, modify the port in `app.py`:
```python
app.run(debug=True, port=5001)  # Change 5001 to your preferred port
```

### Infisical credentials not found
Make sure you've set the keyring values correctly:
```bash
python -c "import keyring; print(keyring.get_password('infisical', 'client_id'))"
```

### OpenRouter API errors
Check that your OpenRouter API key from Infisical is valid and has sufficient credits.

## Next Steps

- Add conversation history persistence
- Implement file upload for images/documents
- Add model selection dropdown
- Implement voice input/output
- Add response streaming for longer messages
