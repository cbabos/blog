// @ts-check

import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
	site: 'https://yourweb.hu',
	integrations: [mdx(), sitemap()],
	image: {
		layout: 'constrained',
        responsiveStyles: true,
	},
	redirects: {
		"/": {
			"destination": "/articles",
			status: 301,
		},
	},
    build: {
        assets: 'node_modules/reveal.js/dist/reveal.js',
    },
});
