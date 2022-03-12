import { html, LitElement, TemplateResult } from 'lit'
import { customElement } from 'lit/decorators.js'
import * as openpgp from 'openpgp';

interface Tree extends Record<string, Tree|string> {};

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
    private key: string = '';

    createRenderRoot() {
	return this;
    }

    constructor() {
	super();
	this.readConfig();
    }

    private readConfig() {
	this.dataURL = window.localStorage.passDataURL;
	this.dataPass = window.localStorage.passDataPass;
	this.data = {};
	this.key = '';
	if(!this.dataURL || !this.dataPass) {
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
	window.localStorage.passDataURL = (this.querySelector('#url') as HTMLInputElement).value;
	window.localStorage.passDataPass = (this.querySelector('#password') as HTMLInputElement).value;
	this.readConfig();
	this.requestUpdate();
    }

    private async loadData() {
	const encryptedRaw = await (await fetch(this.dataURL)).arrayBuffer();
	const encryptedMessage = await openpgp.readMessage({
	    binaryMessage: new Uint8Array(encryptedRaw)
	});
	const { data: decrypted } = await openpgp.decrypt({
	    message: encryptedMessage,
	    passwords: [this.dataPass],
	    format: 'utf8'
	});
	let data: Record<string, string> = JSON.parse(decrypted);
	this.key = data._key;
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
	console.log(this.data);

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
		${this.msg}
		<button @click=${this.changeConfig}>Change Config</button>
	    `;
	} else {
	    return html`<h1>Passwords</h1>
		${this.renderTree(this.data)}
		<button @click=${this.changeConfig}>Change Config</button>
	    `;

	}
    }

    private renderTree(tree: Tree): TemplateResult
    {
	const itemTemplates = [];
	for(const [name, value] of Object.entries(tree)) {
	    if(typeof(value) === 'string') {
		itemTemplates.push(html`<li data-value=${value}>${name}</li>`);
	    } else {
		itemTemplates.push(html`<li>${name}${this.renderTree(value)}</li>`);
	    }
	}
	return html`<ul>${itemTemplates}</ul>`;
    }
}

declare global {
    interface HTMLElementTagNameMap {
	'app-main': AppMainElement
    }
}
