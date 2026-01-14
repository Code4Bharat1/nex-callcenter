/**
 * Parse transcript text into structured messages (user/agent)
 * Handles various transcript formats
 */
export function parseTranscript(transcript) {
  if (!transcript || typeof transcript !== 'string') {
    return [];
  }

  const messages = [];
  const lines = transcript.split('\n');
  
  let currentMessage = null;
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      // Empty line - finalize current message if exists
      if (currentMessage) {
        messages.push(currentMessage);
        currentMessage = null;
      }
      continue;
    }

    // Check for speaker prefixes
    const userMatch = trimmed.match(/^(user|customer|User|Customer):\s*(.+)/i);
    const agentMatch = trimmed.match(/^(agent|assistant|Agent|Assistant):\s*(.+)/i);

    if (userMatch) {
      // Finalize previous message
      if (currentMessage) {
        messages.push(currentMessage);
      }
      // Start new user message
      currentMessage = {
        role: 'user',
        content: userMatch[2].trim()
      };
    } else if (agentMatch) {
      // Finalize previous message
      if (currentMessage) {
        messages.push(currentMessage);
      }
      // Start new agent message
      currentMessage = {
        role: 'agent',
        content: agentMatch[2].trim()
      };
    } else if (currentMessage) {
      // Continuation of current message (multi-line)
      currentMessage.content += ' ' + trimmed;
    } else {
      // No prefix found - try to infer from context or treat as agent
      // (Many transcripts start with agent greeting)
      if (messages.length === 0) {
        currentMessage = {
          role: 'agent',
          content: trimmed
        };
      } else {
        // If last message was agent, this might be user response
        const lastMessage = messages[messages.length - 1];
        if (lastMessage && lastMessage.role === 'agent') {
          currentMessage = {
            role: 'user',
            content: trimmed
          };
        } else {
          currentMessage = {
            role: 'agent',
            content: trimmed
          };
        }
      }
    }
  }

  // Add final message if exists
  if (currentMessage) {
    messages.push(currentMessage);
  }

  // Clean up messages (remove empty ones, trim content)
  return messages
    .filter(msg => msg.content && msg.content.trim().length > 0)
    .map(msg => ({
      ...msg,
      content: msg.content.trim()
    }));
}

