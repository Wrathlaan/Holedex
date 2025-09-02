/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useLayoutEffect, useState } from 'react';

interface InspectorHighlightProps {
  element: HTMLElement;
}

const InspectorHighlight: React.FC<InspectorHighlightProps> = ({ element }) => {
  const [rect, setRect] = useState<DOMRect | null>(null);

  useLayoutEffect(() => {
    const updateRect = () => {
        setRect(element.getBoundingClientRect());
    };
    updateRect();

    // Re-calculate on scroll or resize
    window.addEventListener('scroll', updateRect, true);
    window.addEventListener('resize', updateRect);
    
    return () => {
        window.removeEventListener('scroll', updateRect, true);
        window.removeEventListener('resize', updateRect);
    };
  }, [element]);

  if (!rect || rect.width === 0 || rect.height === 0) return null;

  const style: React.CSSProperties = {
    position: 'fixed',
    top: `${rect.top}px`,
    left: `${rect.left}px`,
    width: `${rect.width}px`,
    height: `${rect.height}px`,
    border: '2px dashed var(--accent-color)',
    boxShadow: '0 0 12px var(--accent-color)',
    backgroundColor: 'var(--accent-color-translucent)',
    pointerEvents: 'none',
    zIndex: 9999,
    transition: 'all 50ms ease-out',
  };
  
  const labelStyle: React.CSSProperties = {
    position: 'absolute',
    bottom: '100%',
    left: 0,
    backgroundColor: 'var(--accent-color)',
    color: 'var(--background-dark)',
    padding: '2px 6px',
    fontSize: '11px',
    fontFamily: 'monospace',
    fontWeight: 'bold',
    borderRadius: '4px 4px 0 0',
    whiteSpace: 'nowrap',
    textTransform: 'none',
    maxWidth: '300px',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  };

  const getElementIdentifier = () => {
      let identifier = element.tagName.toLowerCase();
      if (element.id) {
          identifier += `#${element.id}`;
      }
      if (element.className && typeof element.className === 'string') {
          const classes = element.className.split(' ').filter(c => c).join('.');
          if (classes) {
              identifier += `.${classes}`;
          }
      }
      return identifier;
  }

  return (
    <div id="inspector-highlight-overlay" style={style}>
        <div style={labelStyle}>
            {getElementIdentifier()}
        </div>
    </div>
  );
};

export default InspectorHighlight;
