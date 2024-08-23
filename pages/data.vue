<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';

const supabase = useSupabaseClient();

const email = ref<string>('');
const phone = ref<string>('');
const firstName = ref<string>('');
const lastName = ref<string>('');
const age = ref<number | null>(null);
const country = ref<string>('');

const editing = ref<Record<string, boolean>>({});
const dataLoading = ref(false);
const isAppLoading = ref(true);

const userData = ref<any[]>([]);
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
	const fAge = fLastName.filter(
		(v) => age.value === null || v.age === age.value
	);
	const fCountry = fAge.filter(
		(v) =>
			!country.value ||
			v.country.toLowerCase().includes(country.value.toLowerCase())
	);

	return fCountry;
});

const currentPage = ref(1);
const itemsPerPage = 6;

const totalPages = computed(() => {
	return Math.ceil(filteredUserData.value.length / itemsPerPage);
});

const paginatedUserData = computed(() => {
	const start = (currentPage.value - 1) * itemsPerPage;
	return filteredUserData.value.slice(start, start + itemsPerPage);
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
	age.value = null;
	country.value = '';
}

async function refresh() {
	dataLoading.value = true;
	currentPage.value = 1;
	try {
		const { data: userCoursesData, error: userCoursesError } = await supabase
			.from('user_courses')
			.select(
				'userid, email, phone, first_name, last_name, age, country, courses'
			);

		if (userCoursesError) throw userCoursesError;

		userData.value = userCoursesData.map((userCourse) => ({
			userid: userCourse.userid,
			email: userCourse.email || '',
			phone: userCourse.phone || '',
			firstName: userCourse.first_name || '',
			lastName: userCourse.last_name || '',
			age: userCourse.age || '',
			country: userCourse.country || '',
			courses: userCourse.courses || [],
		}));

		isAppLoading.value = false;
	} catch (e) {
		console.error(`Error while fetching users with courses: ${e.message || e}`);
	} finally {
		dataLoading.value = false;
	}
}

async function fetchUserCourses(userid: string) {
	const { data, error } = await supabase
		.from('user_courses')
		.select('courses')
		.eq('userid', userid);

	if (error) {
		console.error('Error fetching courses:', error.message);
		return [];
	}

	return data.length > 0 ? data[0].courses : [];
}

function editCourses(email: string) {
	currEditEmail.value = email;
	editing.value[email] = true;

	const user = userData.value.find((v) => v.email === email);
	if (user) {
		currEditCourses.value = JSON.stringify(
			user.courses.length ? user.courses : ['']
		);
	} else {
		currEditCourses.value = JSON.stringify(['']);
	}
}

async function saveEdit() {
    editSaving.value = true;
    const newUser = userData.value.find((v) => v.email === currEditEmail.value)!;
    const newCourses = JSON.parse(currEditCourses.value) as string[];

    try {
        console.log("Saving courses:", newCourses);  // Log the courses being saved
        const { error } = await supabase
            .from('user_courses')
            .update({ courses: newCourses })
            .eq('userid', newUser.userid);

        if (error) {
            console.error("Supabase error:", error);  // Log Supabase errors
            editErr.value = 'Error while saving. Check network tab for details.';
        } else {
            editing.value[currEditEmail.value] = false;
            refresh();  // Refresh data after successful save
        }
    } catch (error) {
        console.error('Error updating courses:', error.message);
        editErr.value = 'Error while saving. Check network tab for details.';
    } finally {
        editSaving.value = false;
    }
}


function downloadCSV() {
	const headers = [
		'User ID',
		'Email',
		'Phone',
		'First Name',
		'Last Name',
		'Age',
		'Country',
		'Courses',
	];
	const rows = paginatedUserData.value.map((user) => [
		user.userid,
		user.email,
		user.phone,
		user.firstName,
		user.lastName,
		user.age,
		user.country,
		JSON.stringify(user.courses)
			.replaceAll(',', ' ')
			.replaceAll('[', '')
			.replaceAll(']', ''),
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
			<div v-if="!paginatedUserData.length && dataLoading">Loading...</div>
			<div v-else-if="!paginatedUserData.length">No data</div>
			<div v-else class="w-full h-full flex flex-col gap-4">
				<div class="ml-2 text-xl">
					{{ paginatedUserData.length }} results out of
					{{ filteredUserData.length }}
				</div>
				<div
					v-for="user in paginatedUserData"
					:key="user.userid"
					class="border border-gray-600 rounded-md flex flex-col gap-2 w-full h-max p-4"
				>
					<div class="flex items-center justify-between max-w-md gap-4">
						User Id:
						<UInput readonly :value="user.userid" class="w-full"></UInput>
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
				<div class="flex justify-between mt-4">
					<UButton :disabled="currentPage === 1" @click="currentPage -= 1">
						Previous
					</UButton>

					<span>Page {{ currentPage }} of {{ totalPages }}</span>

					<UButton
						:disabled="currentPage === totalPages"
						@click="currentPage += 1"
					>
						Next
					</UButton>
				</div>
			</div>
		</div>
	</div>
</template>
