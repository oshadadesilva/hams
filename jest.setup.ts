import '@testing-library/jest-dom';

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({
    children,
    href,
    ...props
  }: Readonly<{
    children: unknown;
    href: string | { pathname?: string };
  }>) => {
    const React = require('react');

    return React.createElement(
      'a',
      {
        href: typeof href === 'string' ? href : href.pathname ?? '#',
        ...props,
      },
      children,
    );
  },
}));
