import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

const config: Config = {
  title: 'PowerPlan',
  tagline: 'A PowerPlan webalkalmazás projektmunkájának dokumentációja',
  favicon: 'img/favicon.ico',


  future: {
    v4: true, // Improve compatibility with Docusaurus v4
  },

  url: 'https://tothmartonmate.github.io',
  baseUrl: '/',

  organizationName: 'tothmartonmate',
  projectName: 'Vizsgaremek-PowerPlan',

  onBrokenLinks: 'throw',
  markdown: {
    hooks: {
      onBrokenMarkdownLinks: 'warn',
    },
  },

  i18n: {
    defaultLocale: 'hu',
    locales: ['hu'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: require.resolve('./sidebars.ts'),
          editUrl:
            'https://github.com/tothmartonmate/Vizsgaremek-PowerPlan/tree/main/Document/powerplan/',
        },
        blog: false,
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    image: 'img/logo.png',
    colorMode: {
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: '',
      logo: {
        alt: 'PowerPlan logo',
        src: 'img/logo.png',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'tutorialSidebar',
          position: 'left',
          label: 'Dokumentáció',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Projekt',
          items: [
            {
              label: 'GitHub',
              href: 'https://github.com/tothmartonmate/Vizsgaremek-PowerPlan',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} PowerPlan Projektmunka.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
