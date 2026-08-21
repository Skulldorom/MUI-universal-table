import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'MUI Universal Table',
  description: 'Documentation for the Material UI universal table component',
  lang: 'en-US',
  base: '/MUI-universal-table/',
  head: [
    ['link', { rel: 'icon', type: 'image/x-icon', href: '/MUI-universal-table/favicon.ico' }],
  ],
  themeConfig: {
    logo: '/logo.svg',
    nav: [
      { text: 'Docs', link: '/docs/intro' },
      { text: 'Sponsor', link: 'https://ko-fi.com/skulldorom' },
    ],
    sidebar: [
      {
        text: 'Guide',
        items: [
          { text: 'Introduction', link: '/docs/intro' },
          { text: 'Getting Started', link: '/docs/getting-started' },
          { text: 'Advanced Usage', link: '/docs/advanced-usage' },
          { text: 'Async / Server-side Usage', link: '/docs/async-usage' },
          { text: 'Props Reference', link: '/docs/props' },
        ],
      },
    ],
    socialLinks: [
      { icon: 'github', link: 'https://github.com/Skulldorom/MUI-universal-table' },
    ],
    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2026 Skulldorom',
    },
    outline: { label: 'On this page', level: [2, 3] },
  },
})
