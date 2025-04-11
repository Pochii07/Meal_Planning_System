import { useState } from 'react';

const useCopyToClipboard = () => {
  const [copiedCode, setCopiedCode] = useState(null);

  const copyToClipboard = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return { copiedCode, copyToClipboard };
};

export default useCopyToClipboard;