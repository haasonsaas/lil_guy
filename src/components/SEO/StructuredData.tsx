import { Helmet } from 'react-helmet-async';
import { 
  BlogPostStructuredData, 
  WebsiteStructuredData, 
  BreadcrumbStructuredData 
} from '../../utils/seo/structuredData';

interface StructuredDataProps {
  data: BlogPostStructuredData | WebsiteStructuredData | BreadcrumbStructuredData | Array<BlogPostStructuredData | WebsiteStructuredData | BreadcrumbStructuredData>;
}

/**
 * Component to inject JSON-LD structured data into the page head
 */
export function StructuredData({ data }: StructuredDataProps) {
  const structuredDataArray = Array.isArray(data) ? data : [data];
  
  return (
    <Helmet>
      {structuredDataArray.map((item, index) => (
        <script 
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ 
            __html: JSON.stringify(item, null, 0) 
          }}
        />
      ))}
    </Helmet>
  );
}

export default StructuredData;