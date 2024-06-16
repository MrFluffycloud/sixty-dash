<script setup lang="ts">
import type { User } from '~/types';
import { ref, computed, onMounted } from 'vue';

const email = ref<string>('');
const phone = ref<string>('');
const firstName = ref<string>('');
const lastName = ref<string>('');
const age = ref<number>(0);
const country = ref<string>('');

const editing = ref<Record<string, boolean>>({});
const dataLoading = ref(false);
const isAppLoading = ref(true);

const userData = ref<User[]>([]);
const filteredUserData = computed(() => {
	const fEmail = userData.value.filter(
		(v) =>
			!email.value || v.email.toLowerCase().includes(email.value.toLowerCase())
	);
	const fPhone = fEmail.filter(
		(v) =>
			!phone.value || v.phone.toLowerCase().includes(phone.value.toLowerCase())
	);
	const fFirstName = fPhone.filter(
		(v) =>
			!firstName.value ||
			v.firstName.toLowerCase().includes(firstName.value.toLowerCase())
	);
	const fLastName = fFirstName.filter(
		(v) =>
			!lastName.value ||
			v.lastName.toLowerCase().includes(lastName.value.toLowerCase())
	);
	const fAge = fLastName.filter((v) => !age.value || v.age === age.value);
	const fCountry = fAge.filter(
		(v) =>
			!country.value ||
			v.country.toLowerCase().includes(country.value.toLowerCase())
	);

	return fCountry;
});

const editErr = ref<string>('');
const currEditEmail = ref<string>('');
const currEditCourses = ref<string>('');
const isEditValid = computed(() => {
	try {
		let arr = JSON.parse(currEditCourses.value);
		if (!Array.isArray(arr)) {
			editErr.value = 'Courses should be an array';
			return false;
		}
		if (arr.some((v) => typeof v !== 'string')) {
			editErr.value =
				'Elements of courses should be strings. Did you forget "quotes"?';
			return false;
		}

		editErr.value = '';
		return true;
	} catch (err) {
		editErr.value = 'Courses should be an array';
		return false;
	}
});
const editSaving = ref<boolean>(false);

function clear() {
	email.value = '';
	phone.value = '';
	firstName.value = '';
	lastName.value = '';
	age.value = 0;
	country.value = '';
}

async function refresh() {
	dataLoading.value = true;
	try {
		const users = await $fetch('/api/users');
		userData.value = users;
		isAppLoading.value = false;
	} catch (e) {
		console.error(`Error while refreshing: ${e.message || e}`);
		setInterval(() => window.location.reload(), 5000);
	} finally {
		dataLoading.value = false;
	}
}

function editCourses(email: string) {
	currEditEmail.value = email;
	editing.value[email] = true;
	currEditCourses.value = JSON.stringify(
		userData.value.find((v) => v.email === email)!.courses
	);
}

function saveEdit() {
	editSaving.value = true;
	const newUser = userData.value.find((v) => v.email === currEditEmail.value)!;
	newUser.courses = JSON.parse(currEditCourses.value) as string[];

	$fetch('/api/user', {
		method: 'POST',
		body: newUser,
	})
		.then(() => {
			editing.value[currEditEmail.value] = false;
		})
		.catch(() => {
			editErr.value = 'Error while saving. Check network tab for details.';
		})
		.finally(() => {
			editSaving.value = false;
		});

	refresh();
}

function downloadCSV() {
	const headers = [
		'Email',
		'Phone',
		'First Name',
		'Last Name',
		'Age',
		'Country',
		'Courses',
	];
	const rows = filteredUserData.value.map((user) => [
		user.email,
		user.phone,
		user.firstName,
		user.lastName,
		user.age,
		user.country,
		JSON.stringify(user.courses),
	]);

	let csvContent =
		'data:text/csv;charset=utf-8,' +
		headers.join(',') +
		'\n' +
		rows.map((row) => row.join(',')).join('\n');

	const encodedUri = encodeURI(csvContent);
	const link = document.createElement('a');
	link.setAttribute('href', encodedUri);
	link.setAttribute('download', 'filtered_users.csv');
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
}

onMounted(() => {
	refresh();
});
</script>

<template>
	<div
		v-if="isAppLoading"
		class="flex items-center justify-center min-h-screen"
	>
		<!-- Add your loading spinner or message here -->
		<div>Loading...</div>
	</div>
	<div
		v-else
		class="grid lg:grid-flow-col grid-flow-row gap-4 min-h-screen p-4 font-mono"
	>
		<div
			class="relative flex flex-col gap-4 grow p-4 rounded-md border border-dashed border-primary"
		>
			<div class="flex flex-col gap-4 sticky top-8">
				<h3 class="font-bold text-2xl underline mb-8">Filters</h3>
				<div class="flex justify-between">
					<div>Email:</div>
					<UInput class="w-1/2" v-model="email" />
				</div>
				<div class="flex justify-between">
					<div>Phone:</div>
					<UInput class="w-1/2" v-model="phone" />
				</div>
				<div class="flex justify-between">
					<div>First Name:</div>
					<UInput class="w-1/2" v-model="firstName" />
				</div>
				<div class="flex justify-between">
					<div>Last Name:</div>
					<UInput class="w-1/2" v-model="lastName" />
				</div>
				<div class="flex justify-between">
					<div>Age:</div>
					<UInput type="number" class="w-1/2" v-model="age" />
				</div>
				<div class="flex justify-between">
					<div>Country:</div>
					<UInput class="w-1/2" v-model="country" />
				</div>
				<div class="flex flex-wrap justify-end gap-4 mt-8">
					<UButton size="lg" @click="refresh" :loading="dataLoading"
						>Refresh Data</UButton
					>
					<UButton size="lg" @click="clear" :loading="dataLoading"
						>Clear Filters</UButton
					>
					<UButton size="lg" @click="downloadCSV" :loading="dataLoading"
						>Download CSV</UButton
					>
				</div>
			</div>
		</div>
		<div class="grow p-4 rounded-md border border-dashed border-primary">
			<div v-if="!filteredUserData.length && dataLoading">Loading...</div>
			<div v-else-if="!filteredUserData.length">No data</div>
			<div v-else class="w-full h-full flex flex-col gap-4">
				<div class="ml-2 text-xl">{{ filteredUserData.length }} results</div>
				<div
					v-for="user in filteredUserData"
					class="border border-gray-600 rounded-md flex flex-col gap-2 w-full h-max p-4"
				>
					<div class="flex items-center justify-between max-w-sm gap-4">
						Mongo Id:
						<UInput readonly :value="user._id"></UInput>
					</div>
					<div class="flex items-center justify-between max-w-sm gap-4">
						Email:
						<UInput readonly :value="user.email"></UInput>
					</div>
					<div class="flex items-center justify-between max-w-sm gap-4">
						Phone:
						<UInput readonly :value="user.phone"></UInput>
					</div>
					<div class="flex items-center justify-between max-w-sm gap-4">
						First Name:
						<UInput readonly :value="user.firstName"></UInput>
					</div>
					<div class="flex items-center justify-between max-w-sm gap-4">
						Last Name:
						<UInput readonly :value="user.lastName"></UInput>
					</div>
					<div class="flex items-center justify-between max-w-sm gap-4">
						Age:
						<UInput readonly :value="user.age"></UInput>
					</div>
					<div class="flex items-center justify-between max-w-sm gap-4">
						Country:
						<UInput readonly :value="user.country"></UInput>
					</div>
					<div class="flex items-center justify-between max-w-sm gap-4">
						Courses:
						<UInput readonly :value="JSON.stringify(user.courses)"></UInput>
					</div>
					<UButton class="w-max" @click="editCourses(user.email)"
						>Edit courses</UButton
					>

					<UModal
						v-model="editing[user.email]"
						:transition="false"
						prevent-close
					>
						<UCard>
							<template #header>Courses</template>
							<div class="flex flex-col gap-4">
								<div class="text-rose-500 text-sm">{{ editErr }}</div>
								<UInput
									:disabled="editSaving"
									v-model="currEditCourses"
									class="rounded-md"
									:class="{ 'ring-2 ring-rose-500': !isEditValid }"
									outline="white"
								/>
								<div class="flex gap-4 justify-end">
									<UButton @click="editing[user.email] = false">Cancel</UButton>
									<UButton
										:disabled="!isEditValid"
										:loading="editSaving"
										@click="saveEdit"
										>Save</UButton
									>
								</div>
							</div>
						</UCard>
					</UModal>
				</div>
			</div>
		</div>
	</div>
</template>
