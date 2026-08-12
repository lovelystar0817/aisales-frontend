import ReactMarkdown from 'react-markdown';

interface ProductMarkdownProps {
  content: string;
}

/**
 * Renders product information in markdown format with custom styling
 * Supports headings, lists, blockquotes, and text formatting
 */
export function ProductMarkdown({ content }: ProductMarkdownProps) {
  return (
    <div className="product-markdown my-4 px-4">
      <ReactMarkdown
        components={{
          // Product name heading
          h1: ({ children }) => (
            <h1 className="mb-3 text-lg font-bold text-gray-900">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="mb-3 text-lg font-bold text-gray-900">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="mb-3 text-base font-semibold text-gray-900">
              {children}
            </h3>
          ),
          // Key features list
          ul: ({ children }) => (
            <ul className="mb-4 list-disc space-y-1 pl-5 text-sm text-gray-700">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="mb-4 list-decimal space-y-1 pl-5 text-sm text-gray-700">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="text-sm text-gray-700">{children}</li>
          ),
          // Feature highlight blockquote
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-[#D9DDE0] pl-4">
              {children}
            </blockquote>
          ),
          // Paragraph styling
          p: ({ children }) => (
            <p className="mb-3 text-sm text-gray-600">{children}</p>
          ),
          // Strong/bold text (for highlight titles)
          strong: ({ children }) => (
            <strong className="font-semibold text-orange-600">
              {children}
            </strong>
          ),
          // Emphasis/italic text
          em: ({ children }) => (
            <em className="text-gray-600 italic">{children}</em>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
