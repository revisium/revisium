import { getRobotsTxt } from './robots-indexing';

describe('robots-indexing', () => {
  it.each([[undefined], [null], ['']])(
    'uses a private-by-default robots.txt when env is %s',
    (value) => {
      expect(getRobotsTxt(value)).toBe('User-agent: *\nDisallow: /\n');
    },
  );

  it('uses the custom robots.txt value', () => {
    expect(getRobotsTxt('User-agent: *\nAllow: /')).toBe(
      'User-agent: *\nAllow: /\n',
    );
  });

  it('supports escaped newlines in the custom robots.txt value', () => {
    expect(getRobotsTxt(String.raw`User-agent: *\nAllow: /`)).toBe(
      'User-agent: *\nAllow: /\n',
    );
  });

  it('preserves the custom robots.txt trailing newline', () => {
    expect(getRobotsTxt('User-agent: *\nAllow: /\n')).toBe(
      'User-agent: *\nAllow: /\n',
    );
  });
});
