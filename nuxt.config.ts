// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
	devtools: { enabled: true },
	modules: ['nuxt-mongoose', '@nuxt/ui'],
	mongoose: {
		options: {
			dbName: process.env.MONGODB_DB_NAME,
		},
	},
});
