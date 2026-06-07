<script lang="ts">
	interface IconProps {
		name?: string;
		fill?: string;
		size?: string;
	}

	const { name: iconName = '', fill = '', size = '' }: IconProps = $props();
</script>

<i class="w-{size} aspect-square fill-{fill} text-{fill}">
	<svg class="w-full h-full" xmlns="http://www.w3.org/2000/svg">
		<use href={`/assets/img/icon/${iconName}.svg`} width="100%" height="100%" />
	</svg>
</i>
