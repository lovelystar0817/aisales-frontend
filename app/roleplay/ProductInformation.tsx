import type { Product } from '~/routes/app/roleplay/types';
import { ProductMarkdown } from '~/components/ProductMarkdown';

interface ProductInformationProps {
  product: Product;
}

export function ProductInformation({ product }: ProductInformationProps) {
  function convertProductToMarkdown(product: Product): string {
    let markdown = `### ${product.name}\n\n`;
    // Add feature highlight as blockquote
    if (product.featureHighlight) {
      markdown += `> **${product.featureHighlight.title}**\n>\n> ${product.featureHighlight.description}\n`;
    }
    // Add key features as bullet list
    if (product.keyFeatures && product.keyFeatures.length > 0) {
      markdown += product.keyFeatures
        .map((feature) => `- ${feature}`)
        .join('\n');
      markdown += '\n\n';
    }

    return markdown;
  }

  return (
    <ProductMarkdown
      content={product.markdown ?? convertProductToMarkdown(product)}
    />
  );
}
