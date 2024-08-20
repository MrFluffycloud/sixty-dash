<template>
	<div class="login-page">
		<h1>Admin Login</h1>
		<form @submit.prevent="login">
			<div>
				<label for="email">Email</label>
				<input v-model="email" type="email" id="email" required />
			</div>
			<div>
				<label for="password">Password</label>
				<input v-model="password" type="password" id="password" required />
			</div>
			<button type="submit">Login</button>
		</form>
		<div v-if="error" class="error">{{ error }}</div>
	</div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const email = ref('');
const password = ref('');
const error = ref('');
const router = useRouter();

const supabase = useSupabaseClient();

const login = async () => {
	const { data: user, error: signInError } =
		await supabase.auth.signInWithPassword({
			email: email.value,
			password: password.value,
		});

	if (signInError) {
		error.value = signInError.message;
	} else if (user) { 
		if (user.user.email === 'admin@admin.com') {
			router.push('/data');
		} else {
			error.value = 'Access denied. Admins only.';
		}
	}
};
</script>

<style scoped>
.login-page {
	max-width: 400px;
	margin: 0 auto;
	padding: 1rem;
	border: 1px solid #ddd;
	border-radius: 8px;
}
.error {
	color: red;
	margin-top: 1rem;
}
</style>
