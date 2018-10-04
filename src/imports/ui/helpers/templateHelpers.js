Template.registerHelper('log', function log (...args) {
  console.log(...args)
})

Template.registerHelper('toMB', function toMB(bytes) {
  return Number(bytes / 1000000).toFixed(2)
})