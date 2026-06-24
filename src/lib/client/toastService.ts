export function triggerToast(message: string) {
    sessionStorage.setItem('show-toast', message);
    document.dispatchEvent(
        new CustomEvent('reload', {
            detail: { }, 
            bubbles: true
        })
    );
}