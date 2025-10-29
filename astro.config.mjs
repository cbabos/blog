// @ts-check

import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
	site: 'https://yourweb.hu',
	integrations: [mdx(), sitemap()],
	image: {
		layout: 'fixed',
	},
	redirects: {
		"/": {
			"destination": "/articles",
			status: 301,
		},
	},
});
