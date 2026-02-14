<script lang="ts">
	export let registeredCount = 0;
	export let presentCount = 0;
	export let absentCount = 0;
	export let unknownCount = 0;
</script>

<div class="mt-5 grid grid-cols-2 gap-4 xl:grid-cols-4">
	<div class="rounded-2xl border border-light-blue/15 bg-dark-blue/70 p-4">
		<p class="text-xs tracking-[0.25em] text-light-blue/60 uppercase">Inscrits</p>
		<p class="mt-2 text-2xl font-semibold text-white">{registeredCount}</p>
	</div>
	<div class="rounded-2xl border border-registered/25 bg-dark-blue/70 p-4">
		<p class="text-xs tracking-[0.25em] text-registered uppercase">Présents</p>
		<p class="mt-2 text-2xl font-semibold text-registered">{presentCount}</p>
	</div>
	<div class="rounded-2xl border border-red-400/25 bg-dark-blue/70 p-4">
		<p class="text-xs tracking-[0.25em] text-red-300 uppercase">Absents</p>
		<p class="mt-2 text-2xl font-semibold text-red-300">{absentCount}</p>
	</div>
	<div class="rounded-2xl border border-light-blue/20 bg-dark-blue/70 p-4">
		<p class="text-xs tracking-[0.25em] text-light-blue/60 uppercase">Non renseigné</p>
		<p class="mt-2 text-2xl font-semibold text-light-blue">{unknownCount}</p>
	</div>
</div>
