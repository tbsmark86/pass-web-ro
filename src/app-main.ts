import { html, LitElement } from 'lit'
import { customElement, query } from 'lit/decorators.js'
import type { ShowPassElement } from './show-pass'
import * as openpgp from 'openpgp';

export interface Tree extends Record<string, Tree|string> {};

async function sha256(message: string) {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

async function sha1(message: string) {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-1', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

/**
 * Load the pass dump and renders the content for selection.
 */
@customElement('app-main')
export class AppMainElement extends LitElement {
    private state: 'init'|'config-required'|'loading'|'ready'|'error' = 'init';
    private dataURL: string = '';
    private dataPass: string = '';
    private msg: string = '';
    private data: Tree = {};
    private dialog: ShowPassElement;

    @query('#url')
    private urlEle?: HTMLInputElement;
    @query('#password')
    private passwordEle?: HTMLInputElement;

    createRenderRoot() {
	return this;
    }

    constructor() {
	super();
	this.dialog = document.querySelector('show-pass') as ShowPassElement;
	if(!this.dialog) {
	    this.state = 'error';
	    this.msg = 'Invalid HTML';
	} else {
	    this.readConfig();
	}
    }

    private readConfig() {
	this.dataURL = window.localStorage.passDataURL;
	this.dataPass = window.localStorage.passDataPass;
	this.data = {};
	if(!this.dataPass) {
	    this.state = 'config-required';
	} else {
	    this.state = 'init';
	    this.loadData()
		.then(() => {
		    this.state = 'ready';
		})
		.catch((err) => {
		    this.msg = String(err);
		    this.state = 'error';
		})
		.finally(() => {
		    this.requestUpdate()
		})
	}
    }

    private changeConfig() {
	this.state = 'config-required';
	this.requestUpdate();
    }

    private saveConfig() {
	window.localStorage.passDataURL = this.urlEle?.value;
	window.localStorage.passDataPass = this.passwordEle?.value;
	this.readConfig();
	this.requestUpdate();
    }

    private async loadData() {
	let url;
	let headers = {};
	if(this.dataURL) {
	    // fixed url
	    url = this.dataURL;
	} else {
	    // default url derived from the password.
	    // Idea:
	    // * hard to guess filename
	    // * only get data with password
	    // * but still hoster does not known the data password
	    url = new URL(document.location.href);
	    url.pathname += await sha1(this.dataPass)+'.php';
	    url = url.toString();
	    headers = {
		Authorization: await sha256(this.dataPass)
	    }
	}

	const response = await fetch(url, {headers});
	if(!response.ok) {
	    throw new Error(`Can't Fetch Data: ${response.statusText}`);
	}
	const encryptedRaw = await response.arrayBuffer();
	const encryptedMessage = await openpgp.readMessage({
	    binaryMessage: new Uint8Array(encryptedRaw)
	});
	const { data: decrypted } = await openpgp.decrypt({
	    message: encryptedMessage,
	    passwords: [this.dataPass],
	    format: 'utf8'
	});
	let data: Record<string, string> = JSON.parse(decrypted);
	this.dialog.privateKey = data._key;
	delete data._key;

	// convert flat list into a tree
	let tree: Tree = {}
	for(const [fullpath, value] of Object.entries(data)) {
	    let cur = tree;
	    let parts = fullpath.split('/');
	    let lastpart = parts.pop() as string;
	    for(const part of parts) {
		cur[part] ??= {};
		if(typeof(cur[part]) === 'string') {
		    console.warn('Input structure seems invalid!', fullpath);
		    cur[part] = {};
		}
		cur = cur[part] as Tree;
	    }
	    if(cur[lastpart]) {
		console.warn('Input structure seems invalid!', fullpath);
	    }
	    cur[lastpart] = value;
	}
	this.data = tree;
    }

    render() {
	if(this.state === 'init') {
	    return html`<h1>Loading ...</h1>`;
	} else if(this.state === 'config-required') {
	    return html`<h1>Configuration Required</h1>
		<form>
		    <label>URL: <input type="url" id=url value=${this.dataURL}></label><br>
		    <label>Password: <input type="password" id=password value=${this.dataPass}></label><br>
		    <button @click=${this.saveConfig}>Save</button>
		</form>
	    `;
	} else if(this.state === 'error') {
	    return html`<h1>Error!</h1>
		${this.msg}<br>
		<button @click=${this.changeConfig}>Change Config</button>
	    `;
	} else {
	    return html`<h1>Passwords</h1>
		<pass-tree .value=${this.data} @select=${this.onSelect}></pass-tree>
		<button @click=${this.changeConfig}>Change Config</button>
	    `;

	}
    }

    private onSelect(event: CustomEvent) {
	const {name, value} = event.detail;
	this.dialog.use(name, value);
    }
}

declare global {
    interface HTMLElementTagNameMap {
	'app-main': AppMainElement
    }
}
