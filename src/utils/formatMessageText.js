export function formatMessageText(text) {
  const urlRegex = /\b((https?:\/\/|www\.)[^\s]+|\b[^\s]+\.[^\s]{2,})/gi;

  return text.split(/(\s+)/).map((part, index) => {
    const trimmed = part.trim();
    const hasProtocol = trimmed.startsWith('http://') || trimmed.startsWith('https://');
    const isLikelyUrl = urlRegex.test(trimmed);

    if (isLikelyUrl) {
      const href = hasProtocol ? trimmed : `https://${trimmed}`;
      return (
        <a
          key={index}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: '#4A90E2',
            textDecoration: 'underline',
            wordBreak: 'break-word',
          }}
        >
          {trimmed}
        </a>
      );
    }

    return part;
  });
}