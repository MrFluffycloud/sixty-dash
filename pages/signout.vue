<template></template>

<script setup lang="ts">
const supabase = useSupabaseClient();

const { error } = await supabase.auth.signOut();

if (error) {
	alert(error.message);
} else {
	navigateTo('/data');
}
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
