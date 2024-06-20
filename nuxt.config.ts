// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
	devtools: { enabled: true },
	modules: ['nuxt-mongoose', '@nuxt/ui', '@kgierke/nuxt-basic-auth'],
	mongoose: {
		options: {
			dbName: process.env.MONGODB_DB_NAME,
		},
	},
	basicAuth: {
		enabled: true,
		users: [
			{
				username: 'admin',
				password: 'admin',
			},
		],
	},
});
