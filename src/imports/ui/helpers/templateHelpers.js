Template.registerHelper('log', function log (...args) {
  console.log(...args)
})

Template.registerHelper('toMB', function toMB(bytes) {
  return Number(bytes / 1000000).toFixed(2)
})

Template.registerHelper('values', function (obj) {
  return Object.values(obj)
})

Template.registerHelper('keys', function (obj) {
  return Object.keys(obj)
})
