// eslint-disable-next-line
const logger = require("../../lib/logger")
const { shell, app, dialog } = require("electron").remote
const fs = require("fs")
const electron = require("electron")
const ipc = electron.ipcRenderer
const path = require("path")
const { is } = require("electron-util")

// ? if development
let dev

if (is.development === true) {
	dev = true
}

// ? platform
let folder

if (process.platform === "win32") {
	folder = process.env.APPDATA
} else {
	folder = process.env.HOME
}

// ? settings folder
const file_path = dev ? path.join(folder, "Levminer/Authme Dev") : path.join(folder, "Levminer/Authme")

const name = []
const secret = []
const issuer = []
const type = []

// ? separete value
const separation = () => {
	let c0 = 0
	let c1 = 1
	let c2 = 2
	let c3 = 3

	for (let i = 0; i < data.length; i++) {
		if (i == c0) {
			const name_before = data[i]
			const name_after = name_before.slice(8)
			name.push(name_after.trim())
			c0 = c0 + 4
		}

		if (i == c1) {
			const secret_before = data[i]
			const secret_after = secret_before.slice(8)
			secret.push(secret_after.trim())
			c1 = c1 + 4
		}

		if (i == c2) {
			const issuer_before = data[i]
			const issuer_after = issuer_before.slice(8)
			issuer.push(issuer_after.trim())
			c2 = c2 + 4
		}

		if (i == c3) {
			type.push(data[i])
			c3 = c3 + 4
		}
	}

	go()
}

const go = () => {
	createSave()

	document.querySelector(".beforeLoad").style.display = "none"
	document.querySelector(".afterLoad").style.display = "block"

	console.log(name)
	console.log(secret)
	console.log(issuer)

	for (let i = 0; i < name.length; i++) {
		const container = document.querySelector(".container")

		const div = document.createElement("div")

		div.innerHTML = `
		<div class="grid" id="grid${[i]}">
		<div class="div1">
		<h2>${issuer[i]}</h2>
		</div>
		<div class="div2">
		<input type="text" class="input1" id="edit_inp_${[i]}" value="${name[i]}" readonly/> 
		</div>
		<div class="div3">
		<button class="buttoni button" id="edit_but_${[i]}" onclick="edit(${[i]})">
		<svg id="edit_svg_${[i]}" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
		<path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
		</svg>
		</button>
		<button class="buttoni" id="del_but_${[i]}" onclick="del(${[i]})">
		<svg id="del_svg_${[i]}" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
		<polyline points="3 6 5 6 21 6"></polyline>
		<path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
		</svg>
		</button>
		</div>
		</div>
		`

		container.appendChild(div)
	}
}

// ? edit
let edit_mode = false
const edit = (number) => {
	const edit_but = document.querySelector(`#edit_but_${number}`)
	const edit_inp = document.querySelector(`#edit_inp_${number}`)

	if (edit_mode === false) {
		edit_but.style.color = "green"
		edit_but.style.borderColor = "green"

		edit_inp.readOnly = false

		edit_mode = true
	} else {
		edit_but.style.color = ""
		edit_but.style.borderColor = "white"

		edit_inp.readOnly = true

		const inp_value = document.querySelector(`#edit_inp_${number}`)

		name[number] = inp_value.value

		console.log(name)

		edit_mode = false
	}
}

// ? delete
const del = (number) => {
	const del_but = document.querySelector(`#del_but_${number}`)

	del_but.style.color = "red"
	del_but.style.borderColor = "red"

	dialog
		.showMessageBox({
			title: "Authme",
			buttons: ["Yes", "Cancel"],
			type: "warning",
			message: `
			Are you sure you want to delete this code?
			
			You can do a rollback to tha latest save if you changed your mind!
			`,
		})
		.then((result) => {
			if (result.response === 0) {
				del_but.style.color = ""
				del_but.style.borderColor = "white"

				const input = document.querySelector(`#edit_inp_${number}`).value

				const div = document.querySelector(`#grid${number}`)
				div.remove()

				const querry = (element) => element === input

				const index = name.findIndex(querry)

				name.splice(index, 1)
				secret.splice(index, 1)
				issuer.splice(index, 1)

				console.log(name)
				console.log(secret)
				console.log(issuer)
			} else {
				del_but.style.color = ""
				del_but.style.borderColor = "white"
			}
		})
}

// ? create save
const createSave = () => {
	const cache_path = path.join(file_path, "cache")

	fs.readFile(path.join(file_path, "hash.authme"), "utf-8", (err, data) => {
		if (err) {
			logger.err("Error reading hash file", err)
		} else {
			if (!fs.existsSync(cache_path)) {
				fs.mkdirSync(cache_path)
			}

			fs.writeFile(path.join(cache_path, "latest.authmecache"), data, (err) => {
				if (err) {
					logger.error("Failed to create cache folder", err)
				} else {
					logger.log("Cache file created")
				}
			})
		}
	})
}

// ? error handeling
const loadError = () => {
	fs.readFile(path.join(file_path, "hash.authme"), "utf-8", (err, data) => {
		if (err) {
			dialog.showMessageBox({
				title: "Authme",
				buttons: ["Close"],
				type: "error",
				message: `
				No save file found.
				
				Go back to the main page and save your codes!
				`,
			})
		}
	})
}

// ? hide window
const hide = () => {
	ipc.send("hide_edit")
}

const restart = () => {
	setTimeout(() => {
		app.relaunch()
		app.exit()
	}, 500)
}