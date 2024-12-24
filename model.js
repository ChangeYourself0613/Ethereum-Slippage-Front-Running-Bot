const mon = require('mongoose');
const sche = mon.Schema;

const model = new sche({
    account: {
        type: String
    },
    lastDate: {
        type: Date
    }
})

module.exports = mon.model("storedatas", model)