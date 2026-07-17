import { createConfig } from '@davincibot/config/eslint';
import { fileURLToPath } from 'node:url';
import svelteConfig from './svelte.config.js';

const tsconfigRootDir = fileURLToPath(new URL('.', import.meta.url));

export default [
	...createConfig({
		tsconfigRootDir,
		svelteConfig
	}),
	{
		files: ['*.config.js'],
		languageOptions: {
			parserOptions: {
				projectService: {
					allowDefaultProject: ['eslint.config.js', 'svelte.config.js']
				},
				tsconfigRootDir
			}
		}
	}
];
