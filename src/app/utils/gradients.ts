export class GradientGenerator {
    private static gradients = [
        {
            name: 'aurora',
            from: 'from-green-400',
            via: 'via-teal-400',
            to: 'to-blue-500',
            hoverFrom: 'hover:from-green-500',
            hoverVia: 'hover:via-teal-500',
            hoverTo: 'hover:to-blue-600',
            shadow: 'rgba(45,212,191,0.5)',
            glow: 'animate-glow-ocean'
        },
        {
            name: 'sunset',
            from: 'from-orange-400',
            via: 'via-pink-500',
            to: 'to-purple-600',
            hoverFrom: 'hover:from-orange-500',
            hoverVia: 'hover:via-pink-600',
            hoverTo: 'hover:to-purple-700',
            shadow: 'rgba(244,63,94,0.5)',
            glow: 'animate-glow-sunset'
        },
        {
            name: 'cosmic',
            from: 'from-indigo-500',
            via: 'via-purple-500',
            to: 'to-pink-500',
            hoverFrom: 'hover:from-indigo-600',
            hoverVia: 'hover:via-purple-600',
            hoverTo: 'hover:to-pink-600',
            shadow: 'rgba(139,92,246,0.5)',
            glow: 'animate-glow-purple'
        },
        {
            name: 'tropical',
            from: 'from-yellow-400',
            via: 'via-green-400',
            to: 'to-blue-500',
            hoverFrom: 'hover:from-yellow-500',
            hoverVia: 'hover:via-green-500',
            hoverTo: 'hover:to-blue-600',
            shadow: 'rgba(34,197,94,0.5)',
            glow: 'animate-glow-ocean'
        },
        {
            name: 'candy',
            from: 'from-pink-400',
            via: 'via-rose-400',
            to: 'to-red-500',
            hoverFrom: 'hover:from-pink-500',
            hoverVia: 'hover:via-rose-500',
            hoverTo: 'hover:to-red-600',
            shadow: 'rgba(251,113,133,0.5)',
            glow: 'animate-glow-sunset'
        },
        {
            name: 'galaxy',
            from: 'from-violet-400',
            via: 'via-indigo-400',
            to: 'to-blue-500',
            hoverFrom: 'hover:from-violet-500',
            hoverVia: 'hover:via-indigo-500',
            hoverTo: 'hover:to-blue-600',
            shadow: 'rgba(139,92,246,0.5)',
            glow: 'animate-glow-purple'
        },
        {
            name: 'rainbow',
            from: 'from-red-400',
            via: 'via-yellow-400',
            to: 'to-green-500',
            hoverFrom: 'hover:from-red-500',
            hoverVia: 'hover:via-yellow-500',
            hoverTo: 'hover:to-green-600',
            shadow: 'rgba(234,179,8,0.5)',
            glow: 'animate-glow-sunshine'
        },
        {
            name: 'ocean-deep',
            from: 'from-cyan-400',
            via: 'via-blue-500',
            to: 'to-indigo-600',
            hoverFrom: 'hover:from-cyan-500',
            hoverVia: 'hover:via-blue-600',
            hoverTo: 'hover:to-indigo-700',
            shadow: 'rgba(6,182,212,0.5)',
            glow: 'animate-glow-ocean'
        },
        {
            name: 'magic',
            from: 'from-fuchsia-400',
            via: 'via-purple-400',
            to: 'to-violet-500',
            hoverFrom: 'hover:from-fuchsia-500',
            hoverVia: 'hover:via-purple-500',
            hoverTo: 'hover:to-violet-600',
            shadow: 'rgba(192,38,211,0.5)',
            glow: 'animate-glow-berry'
        },
        {
            name: 'fire',
            from: 'from-yellow-400',
            via: 'via-orange-500',
            to: 'to-red-600',
            hoverFrom: 'hover:from-yellow-500',
            hoverVia: 'hover:via-orange-600',
            hoverTo: 'hover:to-red-700',
            shadow: 'rgba(245,158,11,0.5)',
            glow: 'animate-glow-sunshine'
        }
    ];

    static getRandomGradient() {
        const randomIndex = Math.floor(Math.random() * this.gradients.length);
        return this.gradients[randomIndex];
    }

    static getGradientByName(name: string) {
        return this.gradients.find(g => g.name === name);
    }

    static getButtonClasses(gradient = this.getRandomGradient()) {
        return `flex items-center gap-2 px-4 py-2 font-semibold text-white rounded-lg
            bg-gradient-to-r ${gradient.from} ${gradient.via} ${gradient.to}
            ${gradient.hoverFrom} ${gradient.hoverVia} ${gradient.hoverTo}
            transform transition-all duration-200
            hover:shadow-[0_0_20px_${gradient.shadow}]
            animate-charge ${gradient.glow}`;
    }
} 