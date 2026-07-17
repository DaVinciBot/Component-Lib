// Pile globale des overlays : seul le sommet affiche son backdrop.
const stack = $state<symbol[]>([]);

export interface OverlayRegistration {
	readonly isTop: boolean;
	unregister: () => void;
}

export function registerOverlay(): OverlayRegistration {
	const id = Symbol('overlay');
	stack.push(id);
	return {
		get isTop() {
			return stack[stack.length - 1] === id;
		},
		unregister() {
			const index = stack.indexOf(id);
			if (index !== -1) {
				stack.splice(index, 1);
			}
		}
	};
}

export function overlayCount(): number {
	return stack.length;
}
