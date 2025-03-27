/**
 * Simple Diff Renderer
 * A lightweight alternative to diff2html that formats diff output in a readable way
 */
window.SimpleDiff = {
  /**
   * Render a diff string as HTML
   * @param {string} diffText - The diff text to render
   * @returns {string} HTML string
   */
  render: function(diffText) {
    if (!diffText || diffText.trim() === '') {
      return '<div class="sd-empty">No changes found</div>';
    }
    
    // Split the diff into file sections
    const sections = this._parseDiffSections(diffText);
    
    let html = '<div class="sd-container">';
    
    // Add file list if there are multiple files
    if (sections.length > 1) {
      html += '<div class="sd-file-list">';
      html += '<h3>Changed Files</h3>';
      html += '<ul>';
      sections.forEach((section, index) => {
        html += `<li><a href="#sd-file-${index}">${section.filename || 'Unknown file'}</a></li>`;
      });
      html += '</ul>';
      html += '</div>';
    }
    
    // Add each file section
    sections.forEach((section, index) => {
      html += `<div id="sd-file-${index}" class="sd-file">`;
      html += `<div class="sd-file-header">${section.filename || 'Unknown file'}</div>`;
      html += '<div class="sd-file-content">';
      html += '<table class="sd-diff-table">';
      
      // Process each line
      const lines = section.content.split('\n');
      lines.forEach(line => {
        if (line.startsWith('+')) {
          html += `<tr class="sd-addition"><td></td><td class="sd-line-content">${this._escapeHtml(line)}</td></tr>`;
        } else if (line.startsWith('-')) {
          html += `<tr class="sd-deletion"><td></td><td class="sd-line-content">${this._escapeHtml(line)}</td></tr>`;
        } else if (line.startsWith('@@ ')) {
          html += `<tr class="sd-chunk-header"><td colspan="2">${this._escapeHtml(line)}</td></tr>`;
        } else {
          html += `<tr class="sd-unchanged"><td></td><td class="sd-line-content">${this._escapeHtml(line)}</td></tr>`;
        }
      });
      
      html += '</table>';
      html += '</div>'; // End file content
      html += '</div>'; // End file
    });
    
    html += '</div>'; // End container
    
    return html;
  },
  
  /**
   * Parse a diff string into sections
   * @private
   * @param {string} diffText - The diff text to parse
   * @returns {Array} Array of section objects with filename and content
   */
  _parseDiffSections: function(diffText) {
    const sections = [];
    const lines = diffText.split('\n');
    
    let currentSection = null;
    
    lines.forEach(line => {
      if (line.startsWith('diff --git ')) {
        // Start a new section
        if (currentSection) {
          sections.push(currentSection);
        }
        
        // Extract the filename from the diff header
        const match = line.match(/diff --git a\/(.*) b\/(.*)/);
        const filename = match ? match[2] : 'Unknown file';
        
        currentSection = {
          filename: filename,
          content: line
        };
      } else if (currentSection) {
        // Add to the current section
        currentSection.content += '\n' + line;
      } else {
        // Create a section for content before the first diff header
        currentSection = {
          filename: 'Unknown file',
          content: line
        };
      }
    });
    
    // Add the last section
    if (currentSection) {
      sections.push(currentSection);
    }
    
    return sections;
  },
  
  /**
   * Escape HTML special characters
   * @private
   * @param {string} text - The text to escape
   * @returns {string} Escaped text
   */
  _escapeHtml: function(text) {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
};