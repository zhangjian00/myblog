import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';

import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
	site: 'https://zhangjian00.github.io',
	base: '/myblog',
	integrations: [mdx(), sitemap()],
});
