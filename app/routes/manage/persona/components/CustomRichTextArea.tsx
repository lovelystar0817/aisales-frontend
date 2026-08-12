import { useEffect, useRef, useState, useCallback } from 'react';

interface CleanRichTextAreaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  minHeight?: string;
}

export default function CleanRichTextArea({
  value,
  onChange,
  placeholder,
  className = '',
  minHeight = '100px',
}: CleanRichTextAreaProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [isEmpty, setIsEmpty] = useState(!value);
  const isComposingRef = useRef(false);

  // Convert plain text with bullets to HTML
  const textToHtml = useCallback((text: string): string => {
    if (!text) return '<div><br></div>';

    const lines = text.split('\n');
    let html = '';
    let inList = false;

    lines.forEach((line, index) => {
      const trimmedLine = line.trim();

      // Check if line starts with bullet indicators
      const isBullet = /^•\s/.test(trimmedLine);

      if (isBullet) {
        const content = trimmedLine.replace(/^•\s/, '');
        if (!inList) {
          html += '<ul>';
          inList = true;
        }
        html += `<li>${content || '<br>'}</li>`;
      } else {
        if (inList) {
          html += '</ul>';
          inList = false;
        }
        // Preserve empty lines
        if (trimmedLine) {
          html += `<div>${trimmedLine}</div>`;
        } else {
          html += '<div><br></div>';
        }
      }
    });

    if (inList) {
      html += '</ul>';
    }

    return html;
  }, []);

  // Convert HTML back to plain text with bullets
  const htmlToText = useCallback((html: string): string => {
    if (!html || html === '<div><br></div>') return '';

    const temp = document.createElement('div');
    temp.innerHTML = html;

    const lines: string[] = [];

    const processNode = (node: Node) => {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node as HTMLElement;

        if (element.tagName === 'LI') {
          const content = element.textContent?.trim() || '';
          lines.push('• ' + content);
        } else if (element.tagName === 'UL' || element.tagName === 'OL') {
          Array.from(element.childNodes).forEach((child) => processNode(child));
        } else if (element.tagName === 'DIV' || element.tagName === 'P') {
          const content = element.textContent?.trim() || '';
          lines.push(content);
        }
      }
    };

    Array.from(temp.childNodes).forEach((node) => processNode(node));

    return lines.join('\n');
  }, []);

  // Initialize editor content
  useEffect(() => {
    setIsEmpty(!value);

    if (editorRef.current && !isFocused) {
      const currentHtml = editorRef.current.innerHTML;
      const expectedHtml = textToHtml(value);

      // Normalize HTML for comparison (remove extra whitespace)
      const normalize = (html: string) => html.replace(/>\s+</g, '><').trim();

      if (normalize(currentHtml) !== normalize(expectedHtml)) {
        editorRef.current.innerHTML = expectedHtml;
      }
    }
  }, [value, isFocused, textToHtml]);

  // Inject styles for placeholder and lists
  useEffect(() => {
    const styleId = 'clean-rich-textarea-styles';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        /* Placeholder styling */
        .clean-rich-textarea[data-show-placeholder]:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
          position: absolute;
        }

        /* List styling */
        .clean-rich-textarea ul {
          list-style-type: none;
          padding-left: 0;
          margin: 0;
        }

        .clean-rich-textarea li {
          position: relative;
          padding-left: 1.25rem;
          margin-bottom: 0.25rem;
          min-height: 1.25rem;
        }

        .clean-rich-textarea li:before {
          content: '•';
          position: absolute;
          left: 0;
          color: #374151;
          font-weight: 600;
        }

        /* Div/paragraph spacing */
        .clean-rich-textarea div {
          min-height: 1.25rem;
        }

        /* Remove default margins */
        .clean-rich-textarea div,
        .clean-rich-textarea ul,
        .clean-rich-textarea li,
        .clean-rich-textarea p {
          margin: 0;
        }

        /* Line height for readability */
        .clean-rich-textarea {
          line-height: 1.5;
        }

        /* Focus state */
        .clean-rich-textarea:focus {
          outline: none;
        }

        /* Text wrapping */
        .clean-rich-textarea * {
          word-wrap: break-word;
          overflow-wrap: break-word;
        }

        /* Better spacing between different block types */
        .clean-rich-textarea ul + div,
        .clean-rich-textarea div + ul {
          margin-top: 0.25rem;
        }
      `;
      document.head.appendChild(style);
    }

    return () => {
      // Optional: cleanup on unmount if you want
      // const style = document.getElementById(styleId);
      // if (style) style.remove();
    };
  }, []);

  // Handle input changes
  const handleInput = useCallback(() => {
    if (editorRef.current && !isComposingRef.current) {
      const html = editorRef.current.innerHTML;
      const text = htmlToText(html);

      // Update empty state
      setIsEmpty(!text);

      // Always call onChange to keep parent state in sync
      onChange(text);
    }
  }, [htmlToText, onChange]);

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!editorRef.current) return;

      // Handle Delete and Backspace with selection
      if (
        (e.key === 'Delete' || e.key === 'Backspace') &&
        !isComposingRef.current
      ) {
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) return;

        const range = selection.getRangeAt(0);

        // If there's a selection (not just cursor), let browser handle it normally
        // but clean up and trigger update after
        if (!range.collapsed) {
          setTimeout(() => {
            if (editorRef.current) {
              // CRITICAL: Verify editor still exists and is attached
              if (!editorRef.current.parentElement) {
                console.error(
                  'Editor element was removed! This should never happen.',
                );
                return;
              }

              // Clean up only completely empty lists after deletion
              const lists = editorRef.current.querySelectorAll('ul, ol');
              lists.forEach((list) => {
                const hasContent = Array.from(list.querySelectorAll('li')).some(
                  (li) => li.textContent?.trim(),
                );
                if (!hasContent) {
                  list.remove();
                }
              });

              // Ensure editor has content structure
              if (
                editorRef.current.innerHTML.trim() === '' ||
                editorRef.current.innerHTML === '<br>'
              ) {
                editorRef.current.innerHTML = '<div><br></div>';
              }

              handleInput();
            }
          }, 0);
          return;
        }
      }

      // Auto-convert dash/asterisk to bullet on space
      if (e.key === ' ' && !isComposingRef.current) {
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) return;

        const range = selection.getRangeAt(0);
        const container = range.startContainer;

        if (container.nodeType === Node.TEXT_NODE) {
          const text = container.textContent || '';
          const cursorPos = range.startOffset;

          // Get text from start of line to cursor
          let parent = container.parentElement;

          // Check if cursor is immediately after - or *
          const charBeforeCursor = text.charAt(cursorPos - 1);

          // Only proceed if the character before cursor is - or *
          if (charBeforeCursor === '-' || charBeforeCursor === '*') {
            // Now check if this is at the START of the line (no content before in parent div)
            const parentDiv =
              parent?.tagName === 'DIV' ? parent : parent?.closest('div');

            if (parentDiv && parentDiv !== editorRef.current) {
              // Check if there's any text content before the dash in the entire parent div
              let hasContentBefore = false;

              // Walk through all nodes before our text node
              const childNodesArray = Array.from(parentDiv.childNodes);
              const containerIndex = childNodesArray.indexOf(
                container as ChildNode,
              );

              for (let i = 0; i < containerIndex; i++) {
                if (childNodesArray[i].textContent?.trim()) {
                  hasContentBefore = true;
                  break;
                }
              }

              // Also check if there's text before the dash in our own text node
              const textBeforeDash = text.substring(0, cursorPos - 1).trim();
              if (textBeforeDash) {
                hasContentBefore = true;
              }

              if (hasContentBefore) {
                // There's content before the dash, don't convert to bullet
                return;
              }
            }

            e.preventDefault();

            // CRITICAL: Never touch the root editor element
            if (!editorRef.current || parent === editorRef.current) {
              // If typing directly in root, wrap in proper structure first
              const textNode = container as Text;

              // Remove only the dash/asterisk character
              textNode.deleteData(cursorPos - 1, 1);
              const allText = textNode.textContent || '';
              textNode.remove();

              const ul = document.createElement('ul');
              const li = document.createElement('li');
              li.textContent = allText;
              if (!allText.trim()) li.innerHTML = '<br>';
              ul.appendChild(li);

              editorRef.current.appendChild(ul);

              // Set cursor in the new li after any existing text
              const newRange = document.createRange();
              const targetNode = li.firstChild || li;
              const offset = targetNode.nodeType === Node.TEXT_NODE ? 0 : 0;
              newRange.setStart(targetNode, offset);
              newRange.collapse(true);
              selection.removeAllRanges();
              selection.addRange(newRange);

              setTimeout(() => handleInput(), 0);
              return;
            }

            const textNode = container as Text;
            // Delete only the dash/asterisk (1 character before cursor)
            textNode.deleteData(cursorPos - 1, 1);

            // Create list
            const ul = document.createElement('ul');
            const li = document.createElement('li');

            // Get ALL content from the parent div by moving its child nodes
            if (parentDiv && parentDiv !== editorRef.current) {
              // Move all child nodes from the div to the li
              while (parentDiv.firstChild) {
                li.appendChild(parentDiv.firstChild);
              }

              // If li is empty, add a br
              if (!li.textContent?.trim()) {
                li.innerHTML = '<br>';
              }

              ul.appendChild(li);

              // Replace the entire div with the ul
              parentDiv.replaceWith(ul);
            } else {
              // Fallback for other cases
              const remainingText = textNode.textContent || '';
              if (remainingText.trim()) {
                li.textContent = remainingText;
              } else {
                li.innerHTML = '<br>';
              }
              ul.appendChild(li);

              if (
                parent?.tagName === 'DIV' &&
                parent.parentElement === editorRef.current
              ) {
                parent.replaceWith(ul);
              } else {
                textNode.remove();
                editorRef.current.appendChild(ul);
              }
            }

            // Set cursor in the new li - place it at the start of the text content
            const newRange = document.createRange();

            // Find the first text node in li for proper cursor placement
            let firstTextNode = li.firstChild;
            while (firstTextNode && firstTextNode.nodeType !== Node.TEXT_NODE) {
              firstTextNode = firstTextNode.firstChild;
            }

            if (firstTextNode && firstTextNode.nodeType === Node.TEXT_NODE) {
              newRange.setStart(firstTextNode, 0);
            } else {
              newRange.setStart(li, 0);
            }
            newRange.collapse(true);
            selection.removeAllRanges();
            selection.addRange(newRange);

            setTimeout(() => handleInput(), 0);
            return;
          }
        }
      }

      // Handle Enter key in lists
      if (e.key === 'Enter' && !isComposingRef.current) {
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) return;

        const range = selection.getRangeAt(0);
        const li = range.startContainer.parentElement?.closest('li');

        if (li) {
          e.preventDefault();

          // If list item is empty, exit the list
          if (!li.textContent?.trim()) {
            const ul = li.parentElement;
            const newDiv = document.createElement('div');
            newDiv.innerHTML = '<br>';

            if (ul) {
              ul.parentElement?.insertBefore(newDiv, ul.nextSibling);
              li.remove();

              // Remove ul if empty
              if (ul.children.length === 0) {
                ul.remove();
              }
            }

            // Set cursor in new div
            const newRange = document.createRange();
            newRange.setStart(newDiv, 0);
            newRange.collapse(true);
            selection.removeAllRanges();
            selection.addRange(newRange);
          } else {
            // Split the content at cursor position
            const newLi = document.createElement('li');

            // Extract content after cursor
            const afterRange = range.cloneRange();
            afterRange.selectNodeContents(li);
            afterRange.setStart(range.startContainer, range.startOffset);
            const afterContent = afterRange.extractContents();

            // Put the extracted content in the new li
            if (afterContent.textContent?.trim()) {
              newLi.appendChild(afterContent);
            } else {
              newLi.innerHTML = '<br>';
            }

            // If current li is now empty, add br
            if (!li.textContent?.trim()) {
              li.innerHTML = '<br>';
            }

            // Insert new li after current one
            li.parentElement?.insertBefore(newLi, li.nextSibling);

            // Set cursor at start of new li
            const newRange = document.createRange();
            const firstNode = newLi.firstChild;
            if (firstNode && firstNode.nodeType === Node.TEXT_NODE) {
              newRange.setStart(firstNode, 0);
            } else {
              newRange.setStart(newLi, 0);
            }
            newRange.collapse(true);
            selection.removeAllRanges();
            selection.addRange(newRange);
          }

          setTimeout(() => handleInput(), 0);
        }
      }

      // Handle Backspace at beginning of list item (when no selection)
      if (e.key === 'Backspace' && !isComposingRef.current) {
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) return;

        const range = selection.getRangeAt(0);

        // Check if cursor is at the very beginning
        if (range.startOffset !== 0) return;

        const li = range.startContainer.parentElement?.closest('li');

        if (li) {
          // Check if we're at the start of the li
          const textBeforeCursor =
            range.startContainer.textContent?.substring(0, range.startOffset) ||
            '';

          if (!textBeforeCursor) {
            e.preventDefault();

            const ul = li.parentElement;
            const content = li.textContent || '';
            const newDiv = document.createElement('div');

            if (content) {
              newDiv.textContent = content;
            } else {
              newDiv.innerHTML = '<br>';
            }

            if (ul) {
              ul.parentElement?.insertBefore(newDiv, ul);
              li.remove();

              // Remove ul if empty
              if (ul.children.length === 0) {
                ul.remove();
              }
            }

            // Set cursor at start of new div
            const newRange = document.createRange();
            newRange.setStart(newDiv.firstChild || newDiv, 0);
            newRange.collapse(true);
            selection.removeAllRanges();
            selection.addRange(newRange);

            setTimeout(() => handleInput(), 0);
          }
        }
      }
    },
    [handleInput],
  );

  // Handle paste - convert to plain text
  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      e.preventDefault();
      const text = e.clipboardData.getData('text/plain');

      // Use execCommand for better cursor handling
      document.execCommand('insertText', false, text);

      setTimeout(() => handleInput(), 0);
    },
    [handleInput],
  );

  return (
    <div
      ref={editorRef}
      contentEditable
      onInput={handleInput}
      onKeyDown={handleKeyDown}
      onPaste={handlePaste}
      onFocus={() => setIsFocused(true)}
      onBlur={() => {
        setIsFocused(false);
        handleInput();
      }}
      onCompositionStart={() => {
        isComposingRef.current = true;
      }}
      onCompositionEnd={() => {
        isComposingRef.current = false;
        handleInput();
      }}
      className={`clean-rich-textarea w-full max-w-[550px] resize-y overflow-y-auto rounded-lg border border-gray-300 bg-white p-3 text-sm focus:border-blue-500 focus:outline-none ${className} `}
      style={{
        minHeight,
        whiteSpace: 'pre-wrap',
        wordWrap: 'break-word',
        position: 'relative',
      }}
      {...(isEmpty && !isFocused && placeholder
        ? { 'data-show-placeholder': '', 'data-placeholder': placeholder }
        : {})}
      suppressContentEditableWarning
    />
  );
}
