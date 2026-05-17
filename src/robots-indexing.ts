import type { ConfigService } from '@nestjs/config';
import type { NestExpressApplication } from '@nestjs/platform-express';
import type { NextFunction, Request, Response } from 'express';

export const ROBOTS_TXT_ENV = 'REVISIUM_ROBOTS_TXT';
export const ROBOTS_NOINDEX_HEADER_VALUE = 'noindex, nofollow, noarchive';

const DEFAULT_ROBOTS_TXT = 'User-agent: *\nDisallow: /\n';

export function getRobotsTxt(value: string | null | undefined): string {
  if (value === undefined || value === null || value === '') {
    return DEFAULT_ROBOTS_TXT;
  }

  const robotsTxt = value.replaceAll('\\n', '\n');
  return robotsTxt.endsWith('\n') ? robotsTxt : `${robotsTxt}\n`;
}

export function configureRobotsIndexing(
  app: NestExpressApplication,
  config: ConfigService,
): void {
  const robotsTxt = config.get<string>(ROBOTS_TXT_ENV);
  const hasCustomRobotsTxt = robotsTxt !== undefined && robotsTxt !== '';

  if (!hasCustomRobotsTxt) {
    app.use((_req: Request, res: Response, next: NextFunction) => {
      res.setHeader('X-Robots-Tag', ROBOTS_NOINDEX_HEADER_VALUE);
      next();
    });
  }

  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.get('/robots.txt', (_req: Request, res: Response) => {
    res.type('text/plain');
    res.setHeader('Cache-Control', 'no-store');
    res.send(getRobotsTxt(robotsTxt));
  });
}
