const useRouter = () => ({
    push: () => { },
    replace: () => { },
    prefetch: () => { },
    back: () => { },
    forward: () => { },
    refresh: () => { },
});

const usePathname = () => '/';
const useSearchParams = () => new URLSearchParams();

export { useRouter, usePathname, useSearchParams };
