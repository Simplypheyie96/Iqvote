import { useEffect } from 'react';
import OgImage from '../imports/OgImage';

export function OgImagePage() {
  // Set exact dimensions on mount
  useEffect(() => {
    // Set page title
    document.title = 'IQ Vote - OG Image Preview';
    
    // Add meta viewport for exact sizing
    let viewport = document.querySelector('meta[name="viewport"]') as HTMLMetaElement;
    const originalViewport = viewport?.content;
    
    if (viewport) {
      viewport.content = 'width=1200, height=630';
    } else {
      viewport = document.createElement('meta');
      viewport.name = 'viewport';
      viewport.content = 'width=1200, height=630';
      document.head.appendChild(viewport);
    }
    
    // Set body styles for exact dimensions
    document.body.style.margin = '0';
    document.body.style.padding = '0';
    document.body.style.overflow = 'hidden';
    document.body.style.width = '1200px';
    document.body.style.height = '630px';
    
    // Log ready state for screenshot tools
    console.log('OG Image Preview Ready - 1200x630px');
    
    // Cleanup
    return () => {
      if (originalViewport) {
        viewport.content = originalViewport;
      }
      document.body.style.margin = '';
      document.body.style.padding = '';
      document.body.style.overflow = '';
      document.body.style.width = '';
      document.body.style.height = '';
    };
  }, []);

  return (
    <div 
      className="w-[1200px] h-[630px] overflow-hidden"
      style={{ 
        width: '1200px', 
        height: '630px',
        maxWidth: '1200px',
        maxHeight: '630px',
        minWidth: '1200px',
        minHeight: '630px'
      }}
    >
      <OgImage />
    </div>
  );
}