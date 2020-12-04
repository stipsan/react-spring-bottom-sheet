// @stipsan/react-spring => React Spring
export function capitalize(str) {
  return str
    .split('/')
    .pop()
    .split('-')
    .map((_) => _.charAt(0).toUpperCase() + _.slice(1))
    .join(' ')
}
