#!/usr/bin/env node

const init = require("../commands/init")
const start = require("../commands/start")
const stop = require("../commands/stop")
const status = require("../commands/status")
const model = require("../commands/model")
const auth = require("../commands/auth")

const command = process.argv[2]

switch (command) {

  case "init":
    init()
    break

  case "start":
    start()
    break

  case "stop":
    stop()
    break

  case "status":
    status()
    break

  case "model":
    model()
    break

  case "auth":
    auth()
    break

  default:
    console.log(`
Available commands:

nudge init
nudge start
nudge stop
nudge status
nudge model
nudge auth
`)
}