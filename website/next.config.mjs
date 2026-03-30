import nextra from 'nextra';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const srcDir = path.resolve(__dirname, '../src');

const withNextra = nextra({
  theme: 'nextra-theme-docs',
  themeConfig: './theme.config.tsx',
});

export default withNextra({
  transpilePackages: ['mermaid'],
  experimental: {
    externalDir: true,
  },
  webpack(config) {
    // Resolve .ts/.tsx for imports from parent src/
    config.resolve.extensionAlias = {
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
    };

    // Include parent src/ in transpilation
    config.module.rules.forEach(rule => {
      if (rule.oneOf) {
        rule.oneOf.forEach(oneOf => {
          if (oneOf.test?.toString().includes('tsx|ts')) {
            if (oneOf.include) {
              if (Array.isArray(oneOf.include)) {
                oneOf.include.push(srcDir);
              } else {
                oneOf.include = [oneOf.include, srcDir];
              }
            }
          }
        });
      }
    });

    return config;
  },
});
