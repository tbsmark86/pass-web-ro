import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
    base: '/pass/',
    build: {},
    plugins: [
	//https://vite-plugin-pwa.netlify.app/guide/
	VitePWA({
	    includeAssets: ['favicon.png'],
	    injectRegister: 'inline',
	    manifest: {
		name: 'Pass.sh Web',
		short_name: 'Passwords',
		description: 'Read-Only access to your pass.sh db from any browser',
		theme_color: '#ffffff',
		icons: [
		  {
		    src: 'icon-192.png',
		    sizes: '192x192',
		    type: 'image/png',
		  },
		  {
		    src: 'icon-512.png',
		    sizes: '512x512',
		    type: 'image/png',
		  }
		]
	    },
	    workbox: {runtimeCaching: [
		{
		    urlPattern: /.*/,
		    handler: 'NetworkFirst',
		    options: {
			cacheName: 'data',
			cacheableResponse: {statuses: [0, 200]}
		    }
		}
	    ]}
	})
    ]
})
