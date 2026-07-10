import { MarkdownCopyButton } from 'fumadocs-ui/layouts/docs/page';

type DocsPageActionsProps = Readonly<{
  markdownUrl: string;
  githubUrl: string;
}>;

const actionClass =
  'inline-flex min-h-11 items-center gap-2 rounded-md border border-fd-border px-3 py-2 text-sm font-medium text-fd-foreground transition-colors hover:bg-fd-accent hover:text-fd-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fd-ring';

export function DocsPageActions({ markdownUrl, githubUrl }: DocsPageActionsProps) {
  return (
    <nav className="loxaDocsPageActions" aria-label="Page actions">
      <MarkdownCopyButton className={actionClass} markdownUrl={markdownUrl}>
        Copy Markdown
      </MarkdownCopyButton>
      <a className={actionClass} href={markdownUrl}>
        <FileIcon />
        View Markdown
      </a>
      <a className={actionClass} href={githubUrl} rel="noreferrer" target="_blank">
        <ExternalLinkIcon />
        Edit on GitHub
      </a>
    </nav>
  );
}

function FileIcon() {
  return (
    <svg aria-hidden="true" fill="none" height="16" viewBox="0 0 24 24" width="16">
      <path d="M6 2h8l4 4v16H6zM14 2v5h5M9 12h6M9 16h6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" />
    </svg>
  );
}

function ExternalLinkIcon() {
  return (
    <svg aria-hidden="true" fill="none" height="16" viewBox="0 0 24 24" width="16">
      <path d="M14 5h5v5M19 5l-8 8M18 13v6H5V6h6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" />
    </svg>
  );
}
