function inIframe() {
  try {
    return window.self !== window.top
  } catch (e) {
    return true
  }
}

export function useDetectEnv() {
  return inIframe() ? 'iframe' : 'window'
}
