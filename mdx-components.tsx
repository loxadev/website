import defaultMdxComponents from 'fumadocs-ui/mdx';
import type { MDXComponents } from 'mdx/types';
import type { HTMLAttributes } from 'react';

type HeadingTag = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';

type HeadingWithoutCopyControlProps = HTMLAttributes<HTMLHeadingElement> & {
  as: HeadingTag;
};

export function getMDXComponents(components?: MDXComponents): MDXComponents {
  return { ...defaultMdxComponents, ...components };
}

export const headingsWithoutCopyControls: MDXComponents = {
  h1: (props) => <HeadingWithoutCopyControl as="h1" {...props} />,
  h2: (props) => <HeadingWithoutCopyControl as="h2" {...props} />,
  h3: (props) => <HeadingWithoutCopyControl as="h3" {...props} />,
  h4: (props) => <HeadingWithoutCopyControl as="h4" {...props} />,
  h5: (props) => <HeadingWithoutCopyControl as="h5" {...props} />,
  h6: (props) => <HeadingWithoutCopyControl as="h6" {...props} />,
};

function HeadingWithoutCopyControl({
  as: Heading,
  children,
  className,
  id,
  ...props
}: HeadingWithoutCopyControlProps) {
  return (
    <Heading
      {...props}
      className={['group/heading flex scroll-m-28 flex-row items-center gap-1', className]
        .filter(Boolean)
        .join(' ')}
      id={id}
    >
      {id ? (
        <a data-card="" href={`#${id}`}>
          {children}
        </a>
      ) : (
        children
      )}
    </Heading>
  );
}
